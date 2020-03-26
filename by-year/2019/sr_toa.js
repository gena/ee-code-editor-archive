/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8sr1 = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR"),
    l8sr2 = ee.ImageCollection("LANDSAT/LC08/C01/T2_SR"),
    s2sr = ee.ImageCollection("COPERNICUS/S2_SR"),
    s2toa1 = ee.ImageCollection("COPERNICUS/S2"),
    l8toa1 = ee.ImageCollection("LANDSAT/LC08/C01/T1_TOA"),
    l8toa2 = ee.ImageCollection("LANDSAT/LC08/C01/T2_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var animation = require('users/gena/packages:animation')
var assets = require('users/gena/packages:assets')

var center = Map.getCenter()

var imagesS2sr = assets.getMostlyCleanImages(s2sr, Map.getBounds(true), {
  qualityBand: 'B4',
  cloudFrequencyThresholdDelta: 0.15
}).sort('system:time_start')

var ndvi = imagesS2sr.map(function(i) {
  return i.normalizedDifference(['B5', 'B4']).rename('NDVI')
})

Map.addLayer(ndvi, {}, 'ndvi', false)

// show(l8sr1.filterBounds(center))
// show(l8sr2.filterBounds(center))
// show(s2sr.filterBounds(center))

// show(l8toa1.filterBounds(center))
// show(l8toa2.filterBounds(center))
// show(s2toa1.filterBounds(center))




var start = '2014-01-01'
var stop = '2020-01-01'

var images1 = s2sr.filterDate(start, stop).filterBounds(center)

var images2 = l8sr1.filterDate(start, stop).filterBounds(center)

var images = images1 //.merge(images2)

var bands = ['B4', 'B3', 'B2', 'B5']

// find pairs for S2 images
var images = ee.Join.inner('primary', 'secondary')
  .apply(
    s2toa1.select(bands).filterDate(start, stop).filterBounds(center), 
    s2sr.select(bands).filterDate(start, stop).filterBounds(center),
    ee.Filter.equals({ leftField: 'system:time_start', rightField: 'system:time_start' })
  )

var imagesDiff = ee.ImageCollection(images).map(function(i) {
  var primary = ee.Image(i.get('primary'))
  var secondary = ee.Image(i.get('secondary'))

  return primary.subtract(secondary)
    .set('system:time_start', primary.get('system:time_start'))
})

Map.addLayer(imagesDiff.select(bands), {}, 'diff', false)

images = ee.ImageCollection(images.map(function(i) {
  return ee.Image(i.get('primary'))
}))

images = assets.getMostlyCleanImages(images, Map.getBounds(true), {
  qualityBand: 'B4',
  cloudFrequencyThresholdDelta: 0.15
})

images = images.sort('system:time_start')

animation.animate(images, { 
  maxFrames: 100,  
  vis: { min: 0, max: 1500, bands: ['B4', 'B3', 'B2'] }
})
