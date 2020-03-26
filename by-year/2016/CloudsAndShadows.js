var rescale = function(img, exp, thresholds) {
    return img.expression(exp, {img: img})
        .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
  };
  

function detectShadows(img, cloudMask) {
  // exclude small clouds
  // cloudMask = cloudMask.focal_max(2).focal_min(2)
  
  var cloudHeights = [8000] // ee.List.sequence(100, 10000, 100);

  //Get solar azimuth and senith
  var az = ee.Number(img.get('SUN_AZIMUTH'));
  var zen = ee.Number(img.get('SUN_ELEVATION'));

  var nominalScale = cloudMask.projection().nominalScale();

  //Convert to radians
  var azR = ee.Number(az) .multiply(Math.PI).divide(180.0).add(ee.Number(0.5).multiply(Math.PI ));
  var zenR = ee.Number(0.5).multiply(Math.PI ).subtract(zen.multiply(Math.PI).divide(180.0));
  
  //Find the shadows
  var shadows = cloudHeights.map(function(cloudHeight){
    cloudHeight = ee.Number(cloudHeight);
    
    var shadowCastedDistance = zenR.tan().multiply(cloudHeight);//Distance shadow is cast
    var x = azR.cos().multiply(shadowCastedDistance).divide(nominalScale).round();//X distance of shadow
    var y = azR.sin().multiply(shadowCastedDistance).divide(nominalScale).round();//Y distance of shadow
  
    return cloudMask.changeProj(cloudMask.projection(), cloudMask.projection().translate(x, y)).set('height', cloudHeight);
  })
  
  return ee.ImageCollection(shadows).max().not()
    .and(cloudMask);
}  
  
// Compute a cloud score.  This expects the input image to have the common
// band names: ["red", "blue", etc], so it can work across sensors.
function landsatCloudScore(img) {
  // A helper to apply an expression and linearly rescale the output.
 
  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1.0);
  
  // Clouds are reasonably bright in the blue band.
  var brightInBlue = rescale(img, 'img.blue', [0.1, 0.3])
  score = score.min(brightInBlue);
  Map.addLayer(brightInBlue, {}, 'bright in blue', false)

  // Clouds are reasonably bright in all visible bands.
  var brightInVisible = rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8])
  score = score.min(brightInVisible);
  Map.addLayer(brightInVisible, {}, 'bright in visible', false)

  // Clouds are reasonably bright in all infrared bands.
  var brightInInfrared = rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8])
  score = score.min(brightInInfrared);
  Map.addLayer(brightInInfrared, {}, 'bright in infrared', false)

  // Clouds are reasonably cool in temperature.
  var cool = rescale(img, 'img.temp', [300, 290])
  score = score.where(img.select(['temp']).mask(),score.min(cool));
  Map.addLayer(cool, {}, 'cool', false)

  // However, clouds are not snow.
  var ndsi = img.normalizedDifference(['green', 'swir1']);
  var notSnow = rescale(ndsi, 'img', [0.8, 0.6])
  
  // snow is less red?  
  notSnow = notSnow.multiply(img.select('red').gt(0.55))
    
  score =  score.min(notSnow);
  Map.addLayer(notSnow, {}, 'not snow', false)

  score = score.multiply(100).byte()
  
  addToMap(score,{'min':0,'max':100}, 'cloud score', false);
  score = score.lt(cloudThresh).rename('cloudMask');
  
  // detect shadows
  var cloudShadow = detectShadows(img, score)
  addToMap(cloudShadow.mask(cloudShadow), {palette:['ffff00']}, 'cloud shadow');
  
  img = img.updateMask(img.mask().and(score).and(cloudShadow.not()));
  
  return img.addBands(score);
}

var vizParams = {'min': 0.05,'max': [0.3,0.4,0.4],   'bands':'swir1,nir,red', 'gamma':1.6};
var cloudThresh = 20;
var img = ee.Image('LANDSAT/LC8_L1T_TOA/LC80340332016013LGN00')
  .select(ee.List([1,2,3,4,5,9,6]),ee.List(['blue','green','red','nir','swir1','temp','swir2']));
addToMap(img,vizParams,'Before Masking');

img = landsatCloudScore(img);
addToMap(img,vizParams,'After Masking')
