var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')
var palettes = require('users/gena/packages:palettes')

var bounds = ee.Geometry(Map.getBounds(true))
var scale = Map.getScale() * 5
var palette = palettes.cmocean.Thermal[7]

var images = assets.getImages(bounds/*.centroid(1)*/, {
  includeTemperature: true,
  missions: ['L8'], //  'L7'],
  resample: true,
  // filter: ee.Filter.date('2010-01-01', '2020-01-01'),
  clipBufferSize: 12000
})

images = assets.getMostlyCleanImages(images, bounds, {
  cloudFrequencyThresholdDelta: 0
})

images = images.map(function(i) {
  return i.subtract(273.15).copyProperties(i, ['system:time_start'])
})

// images = images.filter(ee.Filter.or(
//   ee.Filter.dayOfYear(335, 365),
//   ee.Filter.dayOfYear(0, 60)
// ))

Map.addLayer(images.select('temp').reduce(ee.Reducer.stdDev()), {min: 10, max: 15, palette: palette}, 'stdDev')
// Map.addLayer(images.select('temp').reduce(ee.Reducer.median()), {min: 14, max: 25, palette: palette}, 'median')
Map.addLayer(images.select('temp').reduce(ee.Reducer.mean()), {min: 14, max: 25, palette: palette}, 'mean')

print('Image count: ', images.size())


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
  .select(['constant', 'system:time_start', 'temp']);

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
                 ['temp']]; // 1-axis variation.

// Flatten the array images to get multi-band images according to the labels.
var lrImage = linearRegression.select(['coefficients']).arrayFlatten(bandNames);
var rlrImage = robustLinearRegression.select(['coefficients']).arrayFlatten(bandNames);

// Display the OLS results.
// var vis = {min: 0, max: [2500000, -2500000, 0.0001], bands: ['time_ndwi', 'time_ndwi', 'constant_ndwi']}
var vis = { min: -20, max: 20, palette: ['0000ff', '000000', 'ff0000'] } 
Map.addLayer(lrImage.select('time_temp'), vis, 'OLS', false);
Map.addLayer(rlrImage.select('time_temp'), vis, 'OLS (robust)');




images = images.sort('system:time_start')

Map.addLayer(images.select('temp'), {}, 'temp (raw)', false)
function visualize(i)  {
  // var minMax = i.select('temp').reduceRegion({
  //   reducer: ee.Reducer.percentile([2, 98]), 
  //   geometry: bounds, 
  //   scale: scale,
  //   tileScale: 4
  // }).values()
  // var min = minMax.get(0)
  // var max = minMax.get(1)
  
  i = i.subtract(273.15)
  
  var min = 15
  var max = 25
  
  return i.visualize({bands: 'temp', min: min, max: max, palette: palette, forceRgbOutput: true})
    .set({label: i.date().format('YYYY-MM-dd')})
}

var yearStart = 2014
var yearStop = 2017
var yearWindow = 1 / 2
var yearsDelta = 1 / 4

var yearOffsets = ee.List.sequence(0, (yearStop - yearStart) / yearsDelta, yearsDelta)

print(yearOffsets)

// group by years
images = yearOffsets.map(function(yearOffset) {
  var start = ee.Date.fromYMD(yearStart, 1, 1).advance(yearOffset, 'year')
  var stop = start.advance(yearWindow, 'year')
  
  return images.filterDate(start, stop).median()
    .set('system:time_start', start.millis())
})

images = ee.ImageCollection(images)

images = images.map(visualize)

print(images.first())

// animation.animate(images, {label: 'label', maxFrames: 110})

Export.video.toDrive({
  collection: images, 
  description: 'Aleppo-temperature', 
  fileNamePrefix:'Aleppo-temperature',
  framesPerSecond: 15, 
  dimensions: '1920', 
  region: bounds,
  maxFrames: 120
})