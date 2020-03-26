Map.setOptions('HYBRID')

var assets = require('users/gena/packages:assets')

var region = Map.getBounds(true)

var min = -0.1
var max = 0.3

var start = '2016-01-01'
var stop = '2020-01-01'

var images = assets.getImages(region, {
  missions: [
    // 'L4', 'L5', 'L7', 
    // 'L8', 
    'S2'
  ],
  filter: ee.Filter.date(start, stop),
  resample: true
}).filter(ee.Filter.eq('SPACECRAFT_NAME', 'Sentinel-2A'))

print(images.first())

images = assets.getMostlyCleanImages(images, region)

print(images.size())

images = images.map(function(i) {
  return ee.Image([
    i.normalizedDifference(['green', 'nir']).clamp(min, max).rename('NDWI'),
    i.normalizedDifference(['red', 'nir']).clamp(min, max).rename('NDVI'),
    i.normalizedDifference(['green', 'swir']).clamp(min, max).rename('MNDWI'),
  ]).reduce(ee.Reducer.mean()).rename('water')
  .copyProperties(i, ['system:time_start'])
})

// This function adds a time band to the image.
var createTimeBand = function(image) {
  // Scale milliseconds by a large constant.
  return image.addBands(image.metadata('system:time_start').divide(1e13));
};

// This function adds a constant band to the image.
var createConstantBand = function(image) {
  return ee.Image(1).addBands(image);
};

images = images
  .map(createTimeBand)
  .map(createConstantBand)
  .select(['constant', 'system:time_start', 'water']);

// Compute ordinary least squares regression coefficients.
var linearRegression = images.reduce(
  ee.Reducer.linearRegression({
    numX: 2,
    numY: 1
}));

// Compute robust linear regression coefficients.
var robustLinearRegression = images.reduce(
  ee.Reducer.robustLinearRegression({
    numX: 2,
    numY: 1
}));

// The results are array images that must be flattened for display.
// These lists label the information along each axis of the arrays.
var bandNames = [['constant', 'time'], // 0-axis variation.
                 ['water']]; // 1-axis variation.

// Flatten the array images to get multi-band images according to the labels.
var lrImage = linearRegression.select(['coefficients']).arrayFlatten(bandNames);
var rlrImage = robustLinearRegression.select(['coefficients']).arrayFlatten(bandNames);

// Display the OLS results.
Map.addLayer(lrImage.updateMask(lrImage.select('time_water').abs().divide(3)), {min: 0, max: [10, -10, 0], bands: ['time_water', 'time_water', 'time_water']}, 'OLS');

Map.addLayer(images.select('water'), {}, 'water (raw)', false)