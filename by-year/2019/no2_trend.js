/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var no2 = ee.ImageCollection("COPERNICUS/S5P/NRTI/L3_NO2");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var palettes = require('users/gena/packages:palettes')
var animation = require('users/gena/packages:animation')

var images = no2.select(['NO2_column_number_density'], ['no2'])

// no2 = no2.filterDate('2019-03-20', '2020-03-20')

images = images.filterBounds(Map.getBounds(true)).map(function(i) {
  return i
    // .resample('bicubic')
    .convolve(ee.Kernel.gaussian(7500, 2500, 'meters'))
})

// var start = ee.Date('2018-07-01')

// var months = 20
// images = ee.List.sequence(0, months).map(function(m) {
//   var t0 = start.advance(m, 'month')
//   var t1 = t0.advance(1, 'month')
//   var images2 = images.filterDate(t0, t1)
  
//   return images2.reduce(ee.Reducer.mean()).rename('no2')
//     .set({ 'system:time_start': t0.millis(), count: images2.size() })
// })

var start = ee.Date('2020-01-01')

var days = 3
var intervals = 90
images = ee.List.sequence(0, intervals, 1).map(function(i) {
  i = ee.Number(i)
  var t0 = start.advance(i.subtract(days), 'day')
  var t1 = start.advance(i, 'day')
  var images2 = images.filterDate(t0, t1)
  
  return images2.reduce(ee.Reducer.percentile([75])).rename('no2')
    .set({ 'system:time_start': t0.millis(), count: images2.size() })
})

images = ee.ImageCollection(images).filter(ee.Filter.gt('count', 0))

print(images.aggregate_array('count'))

var min = 0.000025
var max = 0.000250

// var palette = palettes.matplotlib.magma[7]
var palette = [
  "#000004",
  "#2C105C",
  "#711F81",
  "#B63679",
  "#EE605E",
  "#FDAE78",
  "#FCFDBF"
]

var visParams = { min: min, max: max, palette: palette }

images = images.map(function(i) {
  return i.updateMask(i.unitScale(min, min + (max - min) * 0.25)).visualize(visParams)
    .set({ label: i.date().format('YYYY-MM-dd') })
})

animation.animate(images, { maxFrames: 100, label: 'label' })

throw(0)

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
  .select(['constant', 'system:time_start', 'no2']);

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
                 ['no2']]; // 1-axis variation.

// Flatten the array images to get multi-band images according to the labels.
var lrImage = linearRegression.select(['coefficients']).arrayFlatten(bandNames);
// var rlrImage = robustLinearRegression.select(['coefficients']).arrayFlatten(bandNames);

Map.addLayer(lrImage, {}, 'regression, raw', false)

// Display the OLS results.
Map.addLayer(lrImage/*.updateMask(lrImage.select('time_no2').multiply(10000))*/, {min: -0.005, max: 0.005, bands: ['time_no2'], palette: palettes.crameri.berlin[50].reverse() }, 'OLS');
//Map.addLayer(lrImage.updateMask(lrImage.select('time_no2').abs().divide(3)), {min: 0, max: [25, -25, 0], bands: ['time_no2', 'time_no2', 'time_no2']}, 'OLS');
// Map.addLayer(rlrImage.updateMask(rlrImage.select('time_water').abs().divide(3)), {min: 0, max: [10, -10, 0], bands: ['time_water', 'time_water', 'time_water']}, 'OLS');
