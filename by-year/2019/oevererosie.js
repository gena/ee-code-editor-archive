/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8t1 = ee.ImageCollection("LANDSAT/LC08/C01/T1_RT_TOA"),
    l8t2 = ee.ImageCollection("LANDSAT/LC08/C01/T2_TOA"),
    geometry = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[5.953885350746986, 51.69127012591579],
          [5.953885350746986, 51.672058567645536],
          [5.974313054604408, 51.672058567645536],
          [5.974313054604408, 51.69127012591579]]], null, false),
    geometry2 = /* color: #fcff45 */ee.Geometry.LineString(
        [[5.959742761133988, 51.68666292716016],
         [5.9616310362804725, 51.68679595631182]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')
var palettes = require('users/gena/packages:palettes')
var gl = require('users/gena/packages:gl')

var bounds = ee.Geometry(Map.getBounds(true))

// var images = assets.getImages(bounds.centroid(1), {
//   missions: ['S2']
// })

// var images = l8t1.merge(l8t2)
var images = l8t1

images = images.filterBounds(bounds.centroid(1)).sort('system:time_start')

print(images.size())

var cloudOptions = {scale: Map.getScale() * 5, percentile: 85, cloudFrequencyThresholdDelta: 0.05, qualityBand: 'B8'}
images = assets.getMostlyCleanImages(images, geometry, cloudOptions)
print(images.size())

images = images.map(function(i) {
  return i.resample('bicubic').set({ label: i.date().format() })
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

var addWater = function(image) {
  var water = image.normalizedDifference(['B8', 'B5']).rename('water').unitScale(0.0, 0.5).clamp(0, 1)
  // water = gl.smoothstep(0, 0.1, water)
  return image.addBands(water)
}

images = images
  .map(addWater)

var paletteWater = palettes.cb.Blues[9]
// var paletteWater = palettes.crameri.devon[50].slice(0).reverse()
// var paletteWater = palettes.crameri.oleron[50].slice(0).reverse()

// animation.animate(images, {
//   vis: { bands: ['B6', 'B5', 'B8'], min: 0.05, max: 0.5 },
//   maxFrames: 150, label: 'label'
// })

// animation.animate(images, {
//   vis: { bands: ['water'], min: 0, max: 1 },
//   maxFrames: 150, label: 'label', palette: paletteWater
// })


// profile
var imagesProfile = images.map(function(i) {
  var n = i.select('water').gt(0).reduceRegion(ee.Reducer.sum(), geometry2.buffer(10), 5).values().get(0)
  
  return ee.Feature(null, { n: n, 'system:time_start': i.get('system:time_start') })
})

print(imagesProfile)

print(ui.Chart.feature.byFeature(imagesProfile, 'system:time_start', ['n']).setOptions({ pointSize: 2, lineWidth: 0 }))

// blend water
var imagesRGB = images.map(function(i) {
  return i.visualize({bands: ['B6', 'B5', 'B8'], min: 0.05, max: 0.5})
    .blend(i.select('water').mask(i.select('water').unitScale(0, 0.1)).visualize({ palette: paletteWater, min: 0, max: 1, opacity: 0.5 }))
})


// var image = ee.Image(images.toList(1, 2).get(0))

// Map.addLayer(image, { bands: ['B6', 'B5', 'B8'], min: 0.02, max: 0.3, gamma: 1.1 }, 'image')
// Map.addLayer(image, { bands: ['B4', 'B3', 'B2'], min: 0.02, max: 0.3, gamma: 1.1 }, 'image (RGB)')

// var water = image.normalizedDifference(['B8', 'B6'])
// Map.addLayer(water, { min: -0.1, max: 0.3, palette: paletteWater }, '8/6')

// var water = image.normalizedDifference(['B8', 'B5'])
// Map.addLayer(water, { min: -0.1, max: 0.3, palette: paletteWater }, '8/5')

// var water = image.normalizedDifference(['B3', 'B5'])
// Map.addLayer(water, { min: -0.1, max: 0.3, palette: paletteWater }, '3/5')

// throw(0)

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

Map.addLayer(lrImage, {}, 'regression, raw', false)


animation.animate(imagesRGB, { maxFrames: 150, label: 'label' })
  .then(function() {
    // Display the OLS results.
    Map.addLayer(lrImage.updateMask(lrImage.select('time_water').abs().divide(3)), {min: 0, max: [25, -25, 0], bands: ['time_water', 'time_water', 'time_water']}, 'OLS');
    // Map.addLayer(rlrImage.updateMask(rlrImage.select('time_water').abs().divide(3)), {min: 0, max: [10, -10, 0], bands: ['time_water', 'time_water', 'time_water']}, 'OLS');
  })
