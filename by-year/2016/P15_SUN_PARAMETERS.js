/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: d63000 */ee.Geometry.Point([94.75381851196289, 29.466279003343548]),
    hand1000 = ee.Image("users/gena/GlobalHAND/90m-global/hand-1000");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function getPercentile(p, start, stop) {
  var bands = ['swir1', 'nir', 'green', 'red'];
  var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').filterDate(start, stop).select(['B6', 'B5', 'B3', 'B2'], bands);
  var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').filterDate(start, stop).select(['B5', 'B4', 'B2', 'B1'], bands);
  var l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').filterDate(start, stop).select(['B5', 'B4', 'B2', 'B1'], bands);
  var l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').filterDate(start, stop).select(['B5', 'B4', 'B2', 'B1'], bands);
  var images = ee.ImageCollection(l8.merge(l7).merge(l5).merge(l4))
    .filterBounds(Map.getBounds(true))
    //.filterMetadata('SUN_ELEVATION', 'greater_than', 35)
    //.filterMetadata('SUN_AZIMUTH', 'greater_than', 107)
    
  var features = ee.FeatureCollection(images)
    .sort('system:time_start')
    .filterBounds(geometry)
    .map(function(f) {
      return f.set('DOY', ee.Date(f.get('system:time_start')).getRelative('day','year'))
    })
  
  print(Chart.image.series(images, geometry, ee.Reducer.mean(), 30, 'system:time_start'))
  
  print(features.size())
  print(Chart.feature.byFeature(features, 'system:time_start', ['SUN_AZIMUTH', 'SUN_ELEVATION', 'DOY']))
  print(Chart.feature.histogram(features, 'SUN_ELEVATION', 100))
  print(Chart.feature.histogram(features, 'DOY', 100))
  
  print('15% SUN_ELEVATION: ', features.reduceColumns({reducer: ee.Reducer.percentile([p]), selectors: ['SUN_ELEVATION']}).get('p' + p.toString()))
  print('15% SUN_AZIMUTH: ', features.reduceColumns({reducer: ee.Reducer.percentile([p]), selectors: ['SUN_AZIMUTH']}).get('p' + p.toString()))

  return images.reduce(ee.Reducer.percentile([p])).rename(bands)
    .mask(images.count().gt(10))

}

var start1 = '1984'
var stop1 = '1994'
var start2 = '2013'
var stop2 = '2016'

var p1 = getPercentile(10, start1, stop1)
Map.addLayer(p1, {min:0.03, max:0.3}, start1 + '-' + stop1)

var p2 = getPercentile(10, start2, stop2)
Map.addLayer(p2, {min:0.03, max:0.3}, start2 + '-' + stop2)

// var ndwiBands = ['green', 'swir1']
var ndwiBands = ['green', 'nir']

var ndwi1 = p1.normalizedDifference(ndwiBands)
Map.addLayer(ndwi1, {min: 0.5, max: -0.5}, 'NDWI1', false)

var ndwi2 = p2.normalizedDifference(ndwiBands);
Map.addLayer(ndwi2, {min: 0.5, max: -0.5}, 'NDWI2', false)

Map.addLayer(ee.Image(1), {opacity:0.7, palette: ['000000']}, 'bg')

var ndwiDiff = ndwi2.subtract(ndwi1)
Map.addLayer(ndwiDiff, {min: -1, max: 1, palette: ['00ff00', '000000', '00d8ff']}, 'NDWI diff (all)', false)
Map.addLayer(ndwiDiff.mask(ndwiDiff.abs().gt(0.25)), {min: -0.5, max: 0.5, palette: ['00ff00', '000000', '00d8ff']}, 'NDWI diff')

var handMask = hand1000.gt(150)
Map.addLayer(handMask.mask(handMask), {opacity: 0.5}, 'HAND > 150m')