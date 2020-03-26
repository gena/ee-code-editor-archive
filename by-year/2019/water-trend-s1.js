/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s1 = ee.ImageCollection("COPERNICUS/S1_GRD");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// This function adds a time band to the image.
var createTimeBand = function(image) {
  // Scale milliseconds by a large constant.
  return image.addBands(image.metadata('system:time_start').divide(1e13));
};

// This function adds a constant band to the image.
var createConstantBand = function(image) {
  return ee.Image(1).addBands(image);
};

var images = s1
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'HH'))
  .map(function(i) { return i.select('HH').rename('b1').copyProperties(i, ['system:time_start']) })
  .map(createTimeBand)
  .map(createConstantBand)
  .select(['constant', 'system:time_start', 'b1']);


Map.addLayer(images.filterDate('2015-01-01', '2017-01-01').mean(), { min: -25, max: 5 }, 'before')
Map.addLayer(images.filterDate('2018-01-01', '2019-01-01').mean(), { min: -25, max: 5 }, 'after')


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
                 ['b1']]; // 1-axis variation.

// Flatten the array images to get multi-band images according to the labels.
var lrImage = linearRegression.select(['coefficients']).arrayFlatten(bandNames);
var rlrImage = robustLinearRegression.select(['coefficients']).arrayFlatten(bandNames);

// Display the OLS results.
Map.addLayer(lrImage.updateMask(lrImage.select('time_b1').abs().divide(3)), {min: 0, max: [10, -10, 0], bands: ['time_b1', 'time_b1', 'time_b1']}, 'OLS');

Map.addLayer(images.select('b1'), {}, 'b1 (raw)', false)