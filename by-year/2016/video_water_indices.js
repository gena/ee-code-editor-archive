/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    proba = ee.ImageCollection("VITO/PROBAV/S1_TOC_100M"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA"),
    s2 = ee.ImageCollection("COPERNICUS/S2"),
    jrc = ee.Image("JRC/GSW1_0/GlobalSurfaceWater");
/***** End of imports. If edited, may not auto-convert in the playground. *****/

Map.addLayer(ee.Image(1), {palette:['000000']}, 'black')
Map.addLayer(jrc.select('occurrence').divide(100), {palette:['000033', '5050ff']}, 'water')

l8 = l8
  .filterBounds(Map.getBounds(true))
  .select(['B6','B5','B3'], ['swir', 'nir', 'green'])
  
l7 = l7
  .filterBounds(Map.getBounds(true))
  .select(['B5','B4','B2'], ['swir', 'nir', 'green'])

s2 = s2
  .filterBounds(Map.getBounds(true))
  .select(['B11','B8','B3'], ['swir', 'nir', 'green']).map(function(i) { return i.multiply(0.001)})
  
var images = ee.ImageCollection(l8.merge(s2).merge(l7))
  .map(function(i) { return i.resample('bicubic')})

var vis = {min:0.1, max:0.4, gamma: 1.5}
var vis = {min:0, max:0.3, gamma: 1.5}

/*var images = proba
  //.filterBounds(Map.getBounds(true))
  .select(['SWIR','NIR','BLUE'])
  .map(function(i) {return i.multiply(0.001)})
*/
//var vis = {min:0.1, max:0.4, gamma: 1.5}
var vis2 = {min:0.1, max:0.4, gamma: 1.5}

var times = ee.List.sequence(0, 365 * 2, 10)
var start = ee.Date('2015-01-01')

var interval = 90

var collections = times.map(function(i) {
  var from = start.advance(ee.Number(-interval).add(i), 'day')
  var to = start.advance(ee.Number(interval).add(i), 'day')
  
  return images.filterDate(from, to)
})


var percentile = 15
var rendered = collections.map(function(ic) {
  var image = ee.ImageCollection(ic).reduce(ee.Reducer.percentile([percentile])).rename(['swir', 'nir', 'green'])
  var r = image.normalizedDifference(['green', 'swir'])
  var g = image.normalizedDifference(['green', 'nir'])
  var b = image.select('green').multiply(0.3)
  
  return ee.Image([r, g, b]).mask(r.multiply(5)).visualize(vis)
})

Export.video.toDrive({
  collection: ee.ImageCollection(rendered), 
  region: Map.getBounds(true),
  dimensions: 1024,
  framesPerSecond: 5,
})

var count = 20
var list = ee.ImageCollection(rendered).toList(count)

ee.List.sequence(0, count - 1).getInfo(function(indices) {
  indices.map(function(i) {
    Map.addLayer(ee.Image(rendered.get(i)), {}, i.toString(), i === 0)
  })
})



/*
var image = images.reduce(ee.Reducer.percentile([35]))
Map.addLayer(image, vis)
*/