// CloudShadows.js

//L8 Cloud/cloud-shadow masking single image
//Adaptation of previously provided GEE code

//Code adapted by:
//Ian Housman
//RedCastle Resources, Inc.

//Working onsite at:
//USDA Forest Service
//Remote Sensing Applications Center (RSAC)
//2222 West 2300 South
//Salt Lake City, UT 84119
//Office: (801) 975-3366
//Email: ihousman@fs.fed.us
//RSAC FS Intranet website: http://fsweb.rsac.fs.fed.us/
//RSAC FS Internet website: http://www.fs.fed.us/eng/rsac/
//////////////////////////////////////////////////////////////////
//Question- what can be done to simply include shadows in the cloud score?

// A mapping from a standard name to the sensor-specific bands.
var LC8_BANDS = ['B2',   'B3',    'B4',  'B5',  'B6',    'B7',    'B10'];
var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'temp'];

// A helper to apply an expression and linearly rescale the output.
var rescale = function(img, exp, thresholds) {
    return img.expression(exp, {img: img})
        .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
};
  
// Compute a cloud score.  This expects the input image to have
// STD band names: ["red", "blue", etc], so it can work across sensors.
var cloudScore = function(img) {
 
  var score = ee.Image(1);
  
  // Clouds are reasonably bright in the blue band.
  score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));
  
  // Clouds are reasonably bright in all visible bands.
  score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]));

  // Clouds are reasonably bright in all infrared bands.
  score = score.min(rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]));
  
  //Take care of shadows
  //This is the piece that needs work
  
  var rescale_nir = rescale(img, 'img.nir', [2, -2]);//[1, -.1]);
  score = score.where(img.select('nir').lte(0.02),rescale_nir);
  
  
  // Clouds are reasonably cool in temperature.
  score = score.min(rescale(img, 'img.temp', [300, 290]));

  // However, clouds are not snow.
  score.min(rescale(img.normalizedDifference(['green', 'nir']), 'img', [0.8, 0.6]));
  return score.multiply(100).toInt().clamp(0,100)
};
///////////////////////////////////////////
//Specify which image

var img = ee.Image(ee.ImageCollection('LC8_L1T_TOA')
  .filterBounds(ee.Geometry(Map.getBounds(true)).centroid(1)).first())
  
// var img = ee.Image('LC8_L1T_TOA/LC80410262013197LGN00')
//     .select(LC8_BANDS, STD_NAMES);


//Test the existing algorithm- misses shadows 
var cs1 = ee.Algorithms.Landsat.simpleCloudScore(img).select('cloud');

img = img.select(LC8_BANDS, STD_NAMES)

addToMap(img, {'bands':'swir2,nir,red'}, 'refl');

//Test the new algorithm- includes shadows, but also includes water,
//and north-facing slopes among other areas
var cs2 = cloudScore(img);

var vzps = {'min': 0, 'max': 100}
addToMap(cs1, vzps, 'cloud_score_from_API');
addToMap(cs2, vzps, 'cloud_score_adaptation_w_shadows');


//Some different basic methods for finding shadows
var nir = img.select('nir');
var water_score = img.normalizedDifference(['green','swir1']);
var water_mask_complex = (nir.divide(img.select('green').add(0.0001))) ;


addToMap(nir, {'palette': '000000,ffffff'}, 'nir (values)',false)
addToMap(nir.mask(nir.lte(0.10)), {'palette': '0000FF,0000FF'}, 'nir',false)
addToMap(water_mask_complex.mask(water_mask_complex.lte(1)),{'palette': '00FFFF,00FFFF'}, 'water_mask_complex',false);
addToMap(water_score.mask(water_score.gte(0.1)), {'palette': 'FF00FF,FF00FF'}, 'water_score',false);