/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2"),
    geometry = /* color: #d63000 */ee.Geometry.Point([6.040248870849609, 53.468583995906705]),
    l8 = ee.ImageCollection("LANDSAT/LC08/C01/T1_RT_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var bandNames = ['nir','red','green','blue']

s2 = s2
  .filterBounds(geometry)
  .select(['B8','B4','B3','B2'], bandNames)
  .map(function(i) { return i.divide(10000).float().set('system:time_start', i.get('system:time_start')) })
  
l8 = l8
  .filterBounds(geometry)
  .select(['B5','B4','B3','B2'], bandNames)

var images = ee.ImageCollection(s2.merge(l8))

var i = images
  .filterDate('2016-01-01', '2017-01-01')
  .reduce(ee.Reducer.percentile([15])).rename(bandNames)
Map.addLayer(i, {min:0.03, max:0.25, bands:['red','green','blue']}, '15%')


var i = images
  .filterDate('2016-01-01', '2017-01-01')
  .reduce(ee.Reducer.intervalMean(0,30)).rename(bandNames)
Map.addLayer(i, {min:0.03, max:0.25, bands:['red','green','blue']}, 'mean')

Map.addLayer(geometry.buffer(200), {}, 'aoi')
