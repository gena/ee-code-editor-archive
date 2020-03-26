var assets = require('users/gena/packages:assets')
var palettes = require('users/gena/packages:palettes')

var bounds = ee.Geometry(Map.getBounds(true))
var scale = Map.getScale() * 5
var palette = palettes.cmocean.Thermal[7]

var images = assets.getImages(bounds/*.centroid(1)*/, {
  missions: ['S2'],
  // filter: ee.Filter.date('2018-01-01', '2020-01-01'),
  resample: true
})

images = assets.getMostlyCleanImages(images, bounds, {
  cloudFrequencyThresholdDelta: 0.25
})

images = assets.addCdfQualityScore(images, 70, 80, false)

print(ui.Chart.feature.histogram(images, 'weight'))

// Map.addLayer(images.select('temp').reduce(ee.Reducer.stdDev()), {min: 10, max: 15, palette: palette}, 'stdDev')
// // Map.addLayer(images.select('temp').reduce(ee.Reducer.median()), {min: 14, max: 25, palette: palette}, 'median')
Map.addLayer(images.select(['swir', 'nir', 'green']).reduce(ee.Reducer.mean()), {min: 0.05, max: 0.3}, 'mean')

print('Image count: ', images.size())

Map.addLayer(images.select(['swir', 'nir']), {}, 'raw', false)

// This function adds a time band to the image.
var createTimeBand = function(image) {
  // Scale milliseconds by a large constant.
  return image.addBands(image.metadata('system:time_start').multiply(2.5e-12))
};

// This function adds a constant band to the image.
var createConstantBand = function(image) {
  return ee.Image(1).addBands(image);
};

images = images
  .map(createTimeBand)
  .map(createConstantBand)

  // Select the predictors and the responses.
  .select(['constant', 'system:time_start', 'swir', 'nir']);

// Compute ordinary least squares regression coefficients.
var linearRegression = images.reduce(
  ee.Reducer.linearRegression({
    numX: 2,
    numY: 2
}));

// Compute robust linear regression coefficients.
var robustLinearRegression = images.reduce(
  ee.Reducer.robustLinearRegression({
    numX: 2,
    numY: 2
}));

// The results are array images that must be flattened for display.
// These lists label the information along each axis of the arrays.
var bandNames = [['constant', 'time'], // 0-axis variation.
                 ['swir', 'nir']]; // 1-axis variation.

// Flatten the array images to get multi-band images according to the labels.
var lrImage = linearRegression.select(['coefficients']).arrayFlatten(bandNames);
var rlrImage = robustLinearRegression.select(['coefficients']).arrayFlatten(bandNames);

// Display the OLS results.
var vis = { min: -0.5, max: 0.5, palette: ['0000ff', '000000', 'ff0000'] } 
Map.addLayer(lrImage.select('time_swir'), vis, 'swir OLS', false);
Map.addLayer(rlrImage.select('time_swir'), vis, 'swir OLS (robust)', false);
Map.addLayer(lrImage.select('time_nir'), vis, 'nir OLS', true);
Map.addLayer(rlrImage.select('time_nir'), vis, 'nir OLS (robust)', false);



