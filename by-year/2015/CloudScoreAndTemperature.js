// A mapping from a common name to the sensor-specific bands.
var LC8_BANDS = ['B2',   'B3',    'B4',  'B5',  'B6',    'B7',    'B10'];
var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'swir2', 'temp'];

// Compute a cloud score.  This expects the input image to have the common
// band names: ["red", "blue", etc], so it can work across sensors.
var cloudScore = function(img) {
  // A helper to apply an expression and linearly rescale the output.
  var rescale = function(img, exp, thresholds) {
    return img.expression(exp, {img: img})
        .subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
  };

  // Compute several indicators of cloudyness and take the minimum of them.
  var score = ee.Image(1.0);
  // Clouds are reasonably bright in the blue band.
  score = score.min(rescale(img, 'img.blue', [0.1, 0.3]));

  // Clouds are reasonably bright in all visible bands.
  score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8]));

  // Clouds are reasonably bright in all infrared bands.
  score = score.min(rescale(img, 'img.nir + img.swir1 + img.swir2', [0.3, 0.8]));

  // Clouds are reasonably cool in temperature.
  score = score.min(rescale(img, 'img.temp', [300, 290]));

  // However, clouds are not snow.
  var ndsi = img.normalizedDifference(['green', 'swir1']);
  
  return score.min(rescale(ndsi, 'img', [0.8, 0.6]));
};

var image = ee.Image('LANDSAT/LC8_L1T_TOA/LC81650392013106LGN01').select(LC8_BANDS, STD_NAMES)

var score = cloudScore(image);
score = ee.Image(1).subtract(score).select([0], ['cloudscore']);
image = image.addBands(score);

Map.centerObject(image)

print(image)

Map.addLayer(image.select(['temp']), {min:200, max:323.15}, 'temp', true)

Map.addLayer(image.select(['red', 'green', 'blue']), {min:0.05, max:0.5}, 'image', true)
var cloudscore = ee.Image(1).subtract(image.select('cloudscore'))
Map.addLayer(cloudscore.mask(cloudscore), {palette:['ff0000', 'ff0000'], min:-0.5, max:2}, 'cloudscore', true);
