var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')

var bounds = Map.getBounds(true)

var images = assets.getImages(bounds, {resample: true, missions: ['S2']})

images = assets.getMostlyCleanImages(images, bounds, { cloudFrequencyThresholdDelta: 0.25 })

print(images.size())

animation.animate(images, { vis: {min: 0, max: 0.4}, maxFrames: 225 })

var addNdwi = function(image) {
  return image
    .addBands(image.normalizedDifference(['green', 'swir']).unitScale(-0.1, 0.3).clamp(0, 1).rename('mndwi'))
    .addBands(image.normalizedDifference(['green', 'nir']).unitScale(-0.1, 0.3).clamp(0, 1).rename('ndwi'))
}

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
  .map(addNdwi)
  .map(createTimeBand)
  .map(createConstantBand)

  // Select the predictors and the responses.
  .select(['constant', 'system:time_start', 'mndwi', 'ndwi']);

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
                 ['ndwi', 'mndwi']]; // 1-axis variation.

// Flatten the array images to get multi-band images according to the labels.
var lrImage = linearRegression.select(['coefficients']).arrayFlatten(bandNames);
var rlrImage = robustLinearRegression.select(['coefficients']).arrayFlatten(bandNames);

Map.addLayer(images.select('ndwi'), {}, 'ndwi', false)

// Display the OLS results.
// var vis = {min: 0, max: [2500000, -2500000, 0.0001], bands: ['time_ndwi', 'time_ndwi', 'constant_ndwi']}
var vis = { min: -1, max: 1, palette: ['00ff00', '000000', '00d8ff'] } 
Map.addLayer(lrImage.select('time_ndwi'), vis, 'OLS');
Map.addLayer(rlrImage.select('time_ndwi'), vis, 'OLS (robust)');
