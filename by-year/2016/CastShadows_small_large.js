/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var sa = /* color: d63000 */ee.Geometry.Point([-108.017578125, 37.33522435930641]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var vizParams = {'min': 0.05,'max': [0.3,0.6,0.35],   'bands':'swir1,nir,red'};

//Get image
var imgs = ee.ImageCollection('LT5_L1T_TOA')
          .filterDate(ee.Date.fromYMD(2000,1,1),ee.Date.fromYMD(2005,12,31))
          .filter(ee.Filter.calendarRange(190,250))
          .filterBounds(sa)
          .filterMetadata('CLOUD_COVER','greater_than',30)
          .filterMetadata('CLOUD_COVER','less_than',60)
          .map(function(img){return img.addBands(ee.Algorithms.Landsat.simpleCloudScore(img))})
          .select([0,1,2,3,4,5,6,7],['blue','green','red','nir','swir1','temp','swir2','cs']);
          
var img = ee.Image(imgs.toList(100,0).get(1));        
addToMap(img,vizParams,'image');
print(img);
var unMaskedImg = img;
//Get cloud mask

var cloudScore = img.select('cs')
addToMap(cloudScore,{},'cloudScore',false);

var cloudThreshold = 0.15

var clouds = cloudScore.lt(cloudThreshold).not();
var cloudMask = clouds.mask(clouds);
cloudMask = cloudMask.focal_max();
addToMap(cloudMask,{},'cloudMask',false);


var rescale = function (img, thresholds) {
    return img.subtract(thresholds[0]).divide(ee.Number(thresholds[1]).subtract(thresholds[0]))
};

// print(Chart.image.histogram(cloudScore, ee.Geometry(Map.getBounds(true)), 60, 250))

//Set up possible cloud heights in meters
var cloudHeightsLow = ee.List.sequence(100, 600, 200);
print(cloudHeightsLow)

var cloudHeightsHigh = ee.List.sequence(1000, 10000, 500);
print(cloudHeightsHigh)

//Get solar azimuth and senith
var az = ee.Number(img.get('SUN_AZIMUTH'));
var zen = ee.Number(img.get('SUN_ELEVATION'));

function castShadows(az, zen, cloud, cloudHeights) {
  var nominalScale = cloud.projection().nominalScale();

  zen  = ee.Number(zen)
  az = ee.Number(az)
  //Convert to radians
  var azR =ee.Number(az) .multiply(Math.PI).divide(180.0).add(ee.Number(0.5).multiply(Math.PI ));
  var zenR  =ee.Number(0.5).multiply(Math.PI ).subtract(zen.multiply(Math.PI).divide(180.0));
  
  //Find the shadows
  var shadows = cloudHeights.map(function(cloudHeight){
    cloudHeight = ee.Number(cloudHeight);
    
    var shadowCastedDistance = zenR.tan().multiply(cloudHeight);//Distance shadow is cast
    var x = azR.cos().multiply(shadowCastedDistance).divide(nominalScale).round();//X distance of shadow
    var y = azR.sin().multiply(shadowCastedDistance).divide(nominalScale).round();//Y distance of shadow
  
    return cloud.changeProj(cloud.projection(), cloud.projection().translate(x, y)).set('height', cloudHeight);
  })
  
  return shadows;
}

var shadow = ee.ImageCollection(castShadows(az, zen, cloudMask, cloudHeightsLow.cat(cloudHeightsHigh))).max();

var azRange = 30
//var azRange = 0
var azStep = 4
//var zenRange = 6
var zenRange = 0
var zenStep = 2
var az2 = ee.List.sequence(az.subtract(azRange/2), az.add(azRange/2), azStep);
var zen2 = ee.List.sequence(zen.subtract(zenRange), zen, zenStep);

var cloudScore2 = cloudScore
  .reduceResolution(ee.Reducer.median(), true, 100)
  .reproject(cloudScore.projection().scale(10, 10))

function castShadowsWithVaryingSun(azValues, zenValues, cloud, cloudHeights) {
  return ee.ImageCollection(azValues.map(function(az) { 
    return zenValues.map(function(zen) {
      return castShadows(az, zen, cloud, cloudHeights)
    })
  }).flatten())
}

var cloudMaskSmall = cloudMask.conn
  .focal_min(1000, 'circle', 'meters')
  .focal_max(3000, 'circle', 'meters')

Map.addLayer(cloudMaskLarge.mask(cloudMaskLarge), {}, 'cloudMaskLarge')
  
var cloudMaskSmall = cloudMask.updateMask(cloudMaskLarge.not())

// fix large clouds
cloudMaskLarge = cloudMaskLarge.multiply(cloudMask)

var cloudMaskSmall = cloudMask.updateMask(cloudMaskLarge.not())
  
Map.addLayer(cloudMaskSmall.mask(cloudMaskSmall), {}, 'cloudMaskSmall')
Map.addLayer(cloudMaskLarge.mask(cloudMaskLarge), {}, 'cloudMaskLarge')

var cloudScore2Large = cloudScore2

  //.focal_min(5)
  //.focal_max(5)

  .focal_min(1000, 'circle', 'meters')
  .focal_max(1000, 'circle', 'meters')
  .reproject(cloudScore.projection())

var cloudScore2Small = cloudScore2.subtract(cloudScore2Large)

addToMap(cloudScore2Small,{},'cloudScore (small)',false);
addToMap(cloudScore2Large,{},'cloudScore (large)',false);


var shadows2 = ee.ImageCollection([
    castShadowsWithVaryingSun(ee.List([zen]), ee.List([az]), cloudScore2Small, cloudHeightsLow).max(),
    castShadowsWithVaryingSun(zen2, az2, cloudScore2Large, cloudHeightsHigh).max()
  ]).mosaic()

print(shadows2)

addToMap(shadows2, {min:0, max:0.4}, 'shadows2 max', false)

addToMap(shadows2.mask(shadows2
  .gt(cloudThreshold)
  .multiply(shadows2.add(0.5)) // make edges look transparent
  .multiply(cloudMask.mask().not()) // remove clouds
  ), {min:0, max:0.4, 
  palette:['092d25','03797b', '59f3f5', 'acf9fa']}, 'shadows2.max - cloud > 0.1', true)


var darkPixels = img.select(['nir','swir1','swir2']).reduce(ee.Reducer.sum()).lt(0.6) ;
shadow = shadow.updateMask(cloudMask.mask().not().and(shadow.mask()));//shadow.and(cloudMask.not())
addToMap(shadow,{'min':1,'max':1,'palette':'404040'},'all projected shadows',true);
shadow = shadow.updateMask(shadow.mask().and(darkPixels));
addToMap(darkPixels.mask(darkPixels),{'min':1,'max':1,'palette':'303030'},'darkPixels',false);
addToMap(shadow,{'min':1,'max':1,'palette':'404040'},'dark projected shadows',false);

var outMask = ee.Image(0).updateMask(img.select([0]).mask());
outMask = outMask.where(cloudMask,1);
outMask = outMask.where(shadow,2);
addToMap(outMask,{'min':0,'max':2,'palette':'FF5000,FFFFFF,808080'},'outMask',false);
img = img.updateMask(img.mask().and(outMask.eq(0)));
addToMap(img,vizParams,'maskedImage',false);



// //////////////////////////////////////////////////////////////////////////
// var rescale = function(img, exp, thresholds) {
//     return img.expression(exp, {img: img})
//         .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
//   };
// // Compute a cloud score.  This expects the input image to have the common
// // band names: ["red", "blue", etc], so it can work across sensors.
// function landsatCloudScore(img) {
//   // A helper to apply an expression and linearly rescale the output.
 

//   // Compute several indicators of cloudyness and take the minimum of them.
//   var score = ee.Image(1.0);
//   // Clouds are reasonably bright in the blue band.
//   score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));
 
//   var vizSum = img.select(['blue','green','red']).reduce(ee.Reducer.sum());
//   img = img.addBands(vizSum.rename('vizSum'))
//   var ndci = img.normalizedDifference(['vizSum','blue']);
//   ndci = rescale(ndci,'img',[0.95,1]).clamp(0,1)
  
//   addToMap(ndci,{'min':0,'max':1})
//   // Clouds are reasonably bright in all visible bands.
//   score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]));
   
//   // Clouds are reasonably bright in all infrared bands.
//   score = score.min(
//       rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]));

//   // Clouds are reasonably cool in temperature.
//   score = score.where(img.select(['temp']).mask(),score.min(rescale(img, 'img.temp', [300, 290])));

//   // However, clouds are not snow.
//   var ndsi = img.normalizedDifference(['green', 'swir1']);
//   score =  score.min(rescale(ndsi, 'img', [0.8, 0.6])).multiply(100).byte();
//   addToMap(score,{'min':0,'max':100});
//   // score = score.lt(cloudThresh).rename('cloudMask');
//   // img = img.updateMask(img.mask().and(score));
//   // return img.addBands(score);
// }
// ////////////////////////////////////////
// landsatCloudScore(unMaskedImg)