/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var animation = require('users/gena/packages:animation')
var assets = require('users/gena/packages:assets')
var charting = require('users/gena/packages:charting')
var palettes = require('users/gena/packages:palettes')
var utils = require('users/gena/packages:utils')

Map.addLayer(ee.Image(1), { palette: ['000000'] }, 'black', true, 0.5)
Map.setOptions('SATELLITE')

var bounds = ee.Geometry(Map.getBounds(true))

var images = assets.getImages(ee.Geometry(Map.getCenter()).buffer(Map.getScale() * 100).bounds(), {
  missions: ['S2', 'L8'/*, 'L7'*/], 
  filter: ee.Filter.date('2017-01-01', '2021-11-01'),
  resample: false
})

print(images.size())

images = assets.getMostlyCleanImages(images, bounds)

print(images.size())

// images = images.sort('system:time_start').map(function(i) {
//   return i.log().set({ label: i.date().format() })
// })

// animation.animate(images, { vis: { bands: ['red', 'green', 'blue'], min: -3.2, max: -1.2}, label: 'label', maxFrames: 100 })

// throw(0)

function showThumb(year) {
  print(year)
  
  var start = ee.Date.fromYMD(year, 1, 1)
  var stop = start.advance(1, 'year')
  
  // plot
  var rect = ee.Geometry.Rectangle({ coords: [[0, 0], [100, 4]], geodesic: false })
  
  // add rug plots
  var plot = new charting.Plot(rect.bounds(), { 
    area: { width: 1, color: '000000', fillColor: '00000011' }
  })
  
  plot.setMinMax(start.millis(), stop.millis(), 0, 1)
    
  var images2 = images.filterDate(start, stop)
  var times = ee.List(images2.aggregate_array('system:time_start'))
  plot.addRugSeries('', times, { width: 1, color: 'red' }, 1)  
  
  print(plot.getThumbnail({ dimensions: '600x24'}))
}

images = images.distinct(['system:time_start'])

// Define an allowable time difference: 1 hour in milliseconds.
var diff = 1 * 60 * 60 * 1000;

// Create a time filter to define a match as overlapping timestamps.
var timeFilter = ee.Filter.maxDifference({
  difference: diff,
  leftField: 'system:time_start',
  rightField: 'system:time_start'
})

// Define the join.
var saveAllJoin = ee.Join.saveAll({
  matchesKey: 'matches',
  ordering: 'system:time_start',
  ascending: true
});

// Apply the join.
images = saveAllJoin.apply(images, images, timeFilter)
.map(function(i) {
  return i.set({matchCount: ee.List(i.get('matches')).size() })
})
.filter(ee.Filter.gt('matchCount', 1))

images = ee.ImageCollection(images).sort('system:time_start').map(function(i) {
  var water = i.normalizedDifference(['green', 'nir']).gt(0)
  
  var dark = i
    .updateMask(water)
    .reduceRegion(ee.Reducer.percentile([0]), bounds, Map.getScale())
  
  var darkImage = ee.Image.constant(i.bandNames().map(function(n) { return dark.get(n) })).rename(i.bandNames())
    
  var t = i.get('system:time_start')
  
  // i = i.subtract(darkImage.multiply(0.5)).max(0.001)
    // .set({ 'system:time_start': t })

  i = i.log()
  
  i = i.set({ label: ee.Date(t).format() })
    .updateMask(water)

  // i = i.select('green')
    
  // var dem = i
  
  // var minMax = i.reduceRegion(ee.Reducer.percentile([1,99]), bounds.buffer(Map.getScale() * 100), Map.getScale())
  // var range = ee.Image.constant([ee.Number(minMax.get('green_p99')).subtract(minMax.get('green_p1'))])
  // var min = ee.Image.constant([minMax.get('green_p1')])
  
  // var c = 0.18 // approximate
  // i = i.select('nir').subtract(i.select('red')).add(i.select('red').subtract(i.select('swir')).multiply(c)).rename('FAI')
  
  // i = i.select('nir').subtract(i.select('red')).divide(i.select('nir').add(i.select('red'))).rename('NDVI')
    
  // var minMax = i.reduceRegion(ee.Reducer.percentile([1,99]), bounds, Map.getScale() * 5)
  // var range = ee.Image.constant([ee.Number(minMax.get('NDVI_p99')).subtract(minMax.get('NDVI_p1'))])
  // var min = ee.Image.constant([minMax.get('NDVI_p1')])

  // var minMax = i.reduceRegion(ee.Reducer.minMax(), bounds, Map.getScale() * 5)

  // var range = ee.Image.constant([
  //   ee.Number(minMax.get('red_max')).subtract(minMax.get('red_min')),
  //   ee.Number(minMax.get('green_max')).subtract(minMax.get('green_min')),
  //   ee.Number(minMax.get('blue_max')).subtract(minMax.get('blue_min'))
  // ])
  
  // var min = ee.Image.constant([
  //   minMax.get('red_min'), 
  //   minMax.get('green_min'), 
  //   minMax.get('blue_min')
  // ])

  // var range = ee.Image.constant([
  //   ee.Number(minMax.get('swir_max')).subtract(minMax.get('swir_min')),
  //   ee.Number(minMax.get('nir_max')).subtract(minMax.get('nir_min')),
  //   ee.Number(minMax.get('green_max')).subtract(minMax.get('green_min'))
  // ])
  
  // var min = ee.Image.constant([
  //   minMax.get('swir_min'), 
  //   minMax.get('nir_min'), 
  //   minMax.get('green_min')
  // ])

  var minMax = i.reduceRegion(ee.Reducer.percentile([5,95]), bounds, Map.getScale() * 5)

  var range = ee.Image.constant([
    // ee.Number(minMax.get('red_p95')).subtract(minMax.get('red_p5')),
    ee.Number(minMax.get('green_p95')).subtract(minMax.get('green_p5')),
    // ee.Number(minMax.get('blue_p95')).subtract(minMax.get('blue_p5'))
  ])
  
  var min = ee.Image.constant([
    // minMax.get('red_p5'), 
    minMax.get('green_p5'), 
    // minMax.get('blue_p5')
  ])

  i =  i.select(['red', 'green', 'blue'])
  // i =  i.select(['swir', 'nir', 'green'])
  
  i = i.subtract(min).divide(range)
  
  return i
    .set({ label: ee.Date(t).format() })

  // var styled = i.visualize({min: 0, max: 1, palette: palettes.crameri.tofino[50].slice(0, 25).reverse() })
  
  // return styled
  //   .set({ label: ee.Date(t).format() })
  
  // var weight = 0.5
  // var extrusion = 200
  // var sunAzimuth = 315
  // var sunElevation = 35
  // var contrast = 0.3
  // var brightness = 0
  // var saturation = 1
  // var shadows = false
  
  // var hillshaded = utils.hillshadeRGB(styled, dem.reproject(ee.Projection('EPSG:3857').atScale(Map.getScale())), weight, extrusion, 
  //                                       sunAzimuth, sunElevation, contrast, brightness, saturation, shadows)

  // return hillshaded
  //   .set({ label: ee.Date(t).format() })
})

print(images.first())
print(images)

animation.animate(images, { vis: { min: 0, max: 1, gamma: 1 }, label: 'label', maxFrames: 100 })

// var palette = palettes.crameri.tofino[50]
// animation.animate(images, { vis: { palette: palette, min: 0, max: 1}, label: 'label', maxFrames: 100 })

// animation.animate(images, { label: 'label', maxFrames: 100, gamma: 2 })

// var years = ee.List.sequence(2016, 2019)
// years.getInfo().map(function(year) { showThumb(year) })
