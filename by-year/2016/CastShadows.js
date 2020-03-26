/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var sa = /* color: #0b4a8b */ee.Geometry.Point([-108.64551544189453, 37.816022261402544]),
    profile1 = /* color: #ffc82d */ee.Geometry.LineString(
        [[-108.65753173828125, 37.81642908929271],
         [-108.67401123046875, 37.83053107003994]]),
    profile2 = /* color: #00ffff */ee.Geometry.LineString(
        [[-108.73014756332583, 37.76759595267009],
         [-108.7479076609502, 37.782108734310405]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/***
 * θ - zenith, degrees
 * φ - azimuth, degrees
 */
function findCloudShadow(cloudMask, cloudHeight, φ, θ) {
  cloudHeight = ee.Number(cloudHeight);

  // convert to radians
  var π = Math.PI
  θ  = ee.Number(0.5).multiply(π).subtract(ee.Number(θ).multiply(π).divide(180.0))
  φ = ee.Number(φ).multiply(π).divide(180.0).add(ee.Number(0.5).multiply(π))

  // compute shadow offset (vector length)
  var offset = θ.tan().multiply(cloudHeight); 
  
  // compute x, y components of the vector
  var proj = cloudMask.projection();
  var nominalScale = proj.nominalScale();
  var x = φ.cos().multiply(offset).divide(nominalScale).round();
  var y = φ.sin().multiply(offset).divide(nominalScale).round();
  
  return cloudMask
    .changeProj(proj, proj.translate(x, y))
    .set('height', cloudHeight);
}

function castShadows(az, zen, cloud) {
  //Find the shadows
  var shadows = cloudHeights.map(function(cloudHeight) { 
    return findCloudShadow(cloud, cloudHeight, az, zen) 
  })

  return shadows;
}

// =============================================================
//Set up possible cloud heights in meters
var cloudHeights =ee.List.sequence(100, 4000, 100);
print(cloudHeights)


var vizParams = {'min': 0.05,'max': [0.3,0.6,0.35],   'bands':'swir1,nir,green'};

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


Map.addLayer(img,vizParams,'image');
print(img);

//Get solar azimuth and senith
var az = ee.Number(img.get('SUN_AZIMUTH'));
var zen = ee.Number(img.get('SUN_ELEVATION'));

var unMaskedImg = img;

//Get cloud mask
Map.centerObject(sa, 12)

var cloudScore = img.select('cs')
Map.addLayer(cloudScore,{min:0.1, max:0.5},'cloudScore',false);

var cloudThreshold = 0.15

var clouds = cloudScore.lt(cloudThreshold).not();
var cloudMask = clouds.mask(clouds);
cloudMask = cloudMask.focal_max();

Map.addLayer(cloudMask,{},'cloudMask',false);


Map.addLayer(img.select('nir'), {min:0.1, max:0.5},'nir',false);

//var options = { cloudHeigh: 500, sunAzimuth: 
//Map.addLayer(findCloudShadow(cloudMask, ), {min:0.1, max:0.5},'nir',false);


// detect cloud blob centers
var cloudBlobs = cloudMask.connectedPixelCount(1000, true)
Map.addLayer(cloudBlobs.mask(cloudBlobs), {}, 'cloud blobs', false);

// plot values along the line
var bands = ['nir', 'swir1', 'swir2', 'blue', 'green', 'red']
print(createProfileChart(img.select(bands), profile1))
print(createProfileChart(img.select(bands), profile2))

var rescale = function (img, thresholds) {
    return img.subtract(thresholds[0]).divide(ee.Number(thresholds[1]).subtract(thresholds[0]))
};

var cloudScoreMask = cloudScore
Map.addLayer(cloudScoreMask.mask(cloudScoreMask),{},'cloudScoreMask',false);

// print(Chart.image.histogram(cloudScore, ee.Geometry(Map.getBounds(true)), 60, 250))

var shadow = ee.ImageCollection(castShadows(az, zen, cloudMask)).max();

var azRange = 10
//var azRange = 0
var azStep = 2
//var zenRange = 6
var zenRange = 0
var zenStep = 2
var az2 = ee.List.sequence(az.subtract(azRange/2), az.add(azRange/2), azStep);
var zen2 = ee.List.sequence(zen.subtract(zenRange), zen, zenStep);

var cloudScore2 = cloudScore
  //.reduceResolution(ee.Reducer.median(), true, 100)
  //.reproject(cloudScore.projection().scale(10, 10))

var shadows2 = az2.map(function(az) { 
  return zen2.map(function(zen) {
    return castShadows(az, zen, cloudScore2)
  })
}).flatten()

print(shadows2)

shadows2 = ee.ImageCollection(shadows2)

Map.addLayer(shadows2, {}, 'shadows2', false)

var shadows2 = shadows2
  .max()
Map.addLayer(shadows2, {min:0, max:0.4}, 'shadows2 max', false)

Map.addLayer(shadows2.mask(shadows2
  .gt(cloudThreshold)
  .multiply(shadows2.add(0.5)) // make edges look transparent
  .multiply(cloudMask.mask().not()) // remove clouds
  ), {min:0, max:0.4, opacity: 0.7,
  palette:['092d25','03797b', '59f3f5', 'acf9fa']}, 'shadows2.max - cloud > 0.1', true)


var darkPixels = img.select(['nir','swir1','swir2']).reduce(ee.Reducer.sum()).lt(0.35) ;
Map.addLayer(darkPixels.mask(darkPixels),{'min':1,'max':1,'palette':'ffff30'},'darkPixels', true, 0.5);

shadow = shadow.updateMask(cloudMask.mask().not().and(shadow.mask()));//shadow.and(cloudMask.not())
Map.addLayer(shadow,{'min':1,'max':1,'palette':'404040'},'all projected shadows', false);
shadow = shadow.updateMask(shadow.mask().and(darkPixels));
Map.addLayer(shadow,{'min':1,'max':1,'palette':'404040'},'dark projected shadows',false);

var outMask = ee.Image(0).updateMask(img.select([0]).mask());
outMask = outMask.where(cloudMask,1);
outMask = outMask.where(shadow,2);
Map.addLayer(outMask,{'min':0,'max':2,'palette':'FF5000,FFFFFF,808080'},'outMask',false);
img = img.updateMask(img.mask().and(outMask.eq(0)));
Map.addLayer(img,vizParams,'maskedImage',false);



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
  
//   Map.addLayer(ndci,{'min':0,'max':1})
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
//   Map.addLayer(score,{'min':0,'max':100});
//   // score = score.lt(cloudThresh).rename('cloudMask');
//   // img = img.updateMask(img.mask().and(score));
//   // return img.addBands(score);
// }
// ////////////////////////////////////////
// landsatCloudScore(unMaskedImg)



function sampleLinePoints(line, count) {
  var length = line.length();
  var step = line.length().divide(count);
  var distances = ee.List.sequence(0, length, step)

  function makePointFeature(coord, offset) {
    var pt = ee.Algorithms.GeometryConstructors.Point(coord);
    return new ee.Feature(pt).set('offset', offset)
  }
  
  var lines = line.cutLines(distances).geometries();

  var points =   lines.zip(distances).map(function(s) {
    var line = ee.List(s).get(0);
    var offset = ee.List(s).get(1)
    return makePointFeature(ee.Geometry(line).coordinates().get(0), offset)
  })
  
  points = points.add(makePointFeature(line.coordinates().get(-1), length))

  return new ee.FeatureCollection(points);
}

function getScale(image) { 
  return image.projection().nominalScale().divide(ee.Projection('EPSG:4326').nominalScale())
}

function createProfileChart(image, line) {
  var scale = getScale(image)
  var segmentCount = profile1.length(1, 'EPSG:4326').divide(scale)
  var points = sampleLinePoints(line, segmentCount);
  var samples = image.reduceRegions(points, ee.Reducer.first())
  print(samples)
  
  return Chart.feature.byFeature(samples, 'offset')
}
