var animation = require('users/gena/packages:animation')
var assets = require('users/gena/packages:assets')

var images = assets.getImages(Map.getCenter(), {
  missions: ['S2'/*, 'L8'*/],
  filter: ee.Filter.date('2016-01-01', '2019-01-01'),
//  missions: ['S2'],

  //includeTier2: true,
  resample: true,
  //filter: ee.Filter.date('2017-05-01', '2017-09-01')
  //filter: ee.Filter.date('2015-01-01', '2020-01-01')
}).map(function(i) { return i.set({label: i.date().format() })})
  
var indices = images.map(function(i) {
  var ndwi = i.normalizedDifference(['green', 'nir']).rename('NDWI').clamp(-0.3, 0.3)
  var mndwi = i.normalizedDifference(['green', 'swir']).rename('MNDWI').clamp(-0.3, 0.3)
  var indvi = i.normalizedDifference(['red', 'nir']).rename('NDVI').clamp(-0.3, 0.3)
  
  return ee.Image([indvi, ndwi, mndwi]).set('system:time_start', i.get('system:time_start'))
})  

Map.addLayer(indices.mean(), {min: -0.25, max: 0.25}, 'indices (mean)', false)

// This function adds a time band to the image.
var createTimeBand = function(image) {
  // Scale milliseconds by a large constant to avoid very small slopes
  // in the linear regression output.
  return image.addBands(image.metadata('system:time_start').divide(1e18));
};

// This function adds a constant band to the image.
var createConstantBand = function(image) {
  return ee.Image(1).addBands(image);
};

// check trends
indices = indices
  .map(createTimeBand)
  .map(createConstantBand)
  // Select the predictors and the responses.
  .select(['constant', 'system:time_start', 'NDVI', 'NDWI', 'MNDWI']);

// Compute ordinary least squares regression coefficients.
var linearRegression = indices.reduce(
  ee.Reducer.linearRegression({
    numX: 2,
    numY: 3
}));

// Compute robust linear regression coefficients.
var robustLinearRegression = indices.reduce(
  ee.Reducer.robustLinearRegression({
    numX: 2,
    numY: 3
}));

Map.addLayer(robustLinearRegression, {}, 'regression', false)


// The results are array images that must be flattened for display.
// These lists label the information along each axis of the arrays.
var bandNames = [['constant', 'time'], // 0-axis variation.
                 ['NDVI', 'NDWI', 'MNDWI']]; // 1-axis variation.

// Flatten the array images to get multi-band images according to the labels.
var lrImage = linearRegression.select(['coefficients']).arrayFlatten(bandNames);
var rlrImage = robustLinearRegression.select(['coefficients']).arrayFlatten(bandNames);

Map.addLayer(lrImage, {min: -3000000, max: 3000000, bands: ['time_NDWI', 'time_NDVI', 'time_MNDWI']}, 'OLS');


