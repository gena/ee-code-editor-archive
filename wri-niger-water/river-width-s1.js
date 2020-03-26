/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var crossSection = /* color: #d63000 */ee.Geometry.MultiPoint(),
    s1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    geometry = /* color: #d63000 */ee.Geometry.Polygon(
        [[[-2.259362622352228, 16.846195282848775],
          [-2.2634826998342987, 16.84175872074645],
          [-2.250777468380875, 16.828450139483937],
          [-2.2456276267780595, 16.831901084019258]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/*
TODO:
- sort images in animation to date
- make some animations
- SLICK (segmentation algorithm). USe super pixels to classify per segment to which class it belongs
- 
- test a cloud / cloud shadow filter on one image (FMASK / Gena's script for shadow)
- 
*/ 

var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')
var palettes = require('users/gena/packages:colorbrewer').Palettes


var images = s1.filterBounds(Map.getCenter())
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .select('VV')

geometry = geometry.buffer(60)


var thresholding = require('users/gena/packages:thresholding')

images = images.select('VV').map(function(i) { 

  // TODO: apply SNIC

  // var th = thresholding.computeThresholdUsingOtsu(i, 30, geometry, 0.7, 3)
  // var water = i.lt(th)

  var water = i.lt(-17)
  
  water = water
     .focal_mode(20, 'circle', 'meters')

  var width = ee.Number(water.reduceRegion(ee.Reducer.sum(), geometry, 10).values().get(0))
  
  var rgb = ee.ImageCollection.fromImages([
    i.visualize({min: -25, max: -5, forceRgbOutput: true}),
    water.mask(water).visualize({palette: palettes.Blues[3][1], opacity: 0.5})
  ]).mosaic()
  
  return rgb  
    .set({width: width})
    .set({label: i.date().format().cat(', width: ').cat(width.format('%.1f'))})
    .copyProperties(i, ['system:time_start'])
})

print(
  ui.Chart.feature.byFeature(images, 'system:time_start', ['width'])
    .setChartType('ScatterChart')
    .setOptions({
      pointSize: 2
    })
)

animation.animate(images, {maxFrames: 50})


throw(0)


var images = assets.getImages(Map.getCenter())

print('Count: ', images.size())

var bounds = Map.getBounds(true)

images = assets.getMostlyCleanImages(images, bounds, {
  //cloudFrequencyThresholdDelta: -0.15
})

print('Count (clean): ', images.size())

var images = images.map(function(i) { 
  var ndwi = i.normalizedDifference(['green', 'swir']).rename('ndwi')
  
  var width = ndwi.gt(0).reduceRegion(ee.Reducer.sum(), crossSection, 10).values().get(0)
  
  return i
    .addBands(ndwi)
    .set({width: width})
})

print(ui.Chart.feature.byFeature(images, 'system:time_start', ['width']).setChartType('ScatterChart'))

images = images.map(function(i) {
  var water = ee.Image(1).float().mask(i.select('ndwi')).visualize({min: -0.05, max: 0.5, palette: palettes.Blues[9]})
  
  var image = i.visualize({bands: ['red', 'green', 'blue'], min: 0.0, max: 0.5})
  
  var rgb = ee.ImageCollection.fromImages([
    image,
    water
  ]).mosaic()
  
  return rgb
    .set({label: i.date().format().cat(', width: ').cat(ee.Number(i.get('width')).format('%.2f'))})
})

animation.animate(images, {label: 'label', maxFrames: 100})
