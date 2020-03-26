/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([-120.12871742248535, 39.38609027098774]),
    geometry2 = /* color: #98ff00 */ee.Geometry.LineString(
        [[-120.1485013961792, 39.37753221157824],
         [-120.14116287231445, 39.38317136088735]]),
    geometry3 = /* color: #0b4a8b */ee.Geometry.Point([-120.14382362365723, 39.380816241660135]),
    geometry4 = /* color: #d63000 */ee.Geometry.Point([-120.14678478240967, 39.37762620045832]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// var proj = ee.Projection('EPSG:3857', [15, 0, 0, 0, -15, 0])
var proj = ee.Projection('EPSG:3857', [30, 0, 0, 0, -30, 0])

/***
 * Generates image collection gallery.
 */
var gallery = function(images, region, rows, columns) {
  // var proj = ee.Image(images.first()).select(0).projection()

  var scale = proj.nominalScale()
  
  var e = ee.ErrorMargin(1)

  var bounds = region.transform(proj, e).bounds(e, proj)
  
  var count = ee.Number(columns * rows)
  
  // number of images is less than grid cells
  count = count.min(images.limit(count).size())
  
  images = images.limit(count)

  var indices = ee.List.sequence(0, count.subtract(1))
  
  var offsetsX = indices.map(function(i) { return ee.Number(i).mod(columns) })
  var offsetsY = indices.map(function(i) { return ee.Number(i).divide(columns).floor() })

  var offsets = offsetsX.zip(offsetsY)

  var ids = ee.List(images.aggregate_array('system:index'))
  var offsetByImage = ee.Dictionary.fromLists(ids, offsets)
  
  var coords = ee.List(bounds.coordinates().get(0))

  var w = ee.Number(ee.List(coords.get(1)).get(0)).subtract(ee.List(coords.get(0)).get(0)).floor()
  var h = ee.Number(ee.List(coords.get(2)).get(1)).subtract(ee.List(coords.get(0)).get(1)).floor()
  
  var boundsImage = ee.Image().toInt().paint(bounds, 1).reproject(proj)
  
  // new region
  var ll = ee.List(coords.get(0))
  var ur = [ee.Number(ll.get(0)).add(w.multiply(columns)), ee.Number(ll.get(1)).add(h.multiply(rows))]
  
  var regionNew = ee.Geometry.Rectangle([ll, ur], proj, false)
  
  var mosaic = images
    .map(function(i) {
      var offset = ee.List(offsetByImage.get(i.get('system:index')))
      var xoff = w.multiply(offset.get(0)).multiply(scale)
      var yoff = h.multiply(offset.get(1)).multiply(scale)
  
      i = i.updateMask(boundsImage)
      
      return i.translate(xoff, yoff, 'meters', proj)
  }).mosaic()
  
  return {image: mosaic, region: regionNew};
}

var region = geometry2

function addAny(i) {
  return i.set('any', i.select(0).mask().reduceRegion(ee.Reducer.anyNonZero(), region).values().get(0))
}

function addTemp(i) {
  return i.set('temp', i.select('temp').reduceRegion(ee.Reducer.median(), region).values().get(0))
}

function addSwir(i) {
  return i.set('swir1', i.select('swir1').reduceRegion(ee.Reducer.median(), region).values().get(0))
}

function addBlue(i) {
  return i.set('blue', i.select('blue').reduceRegion(ee.Reducer.median(), region).values().get(0))
}

function addNdsi(i) {
  return i.set('ndsi', i.normalizedDifference(['green', 'swir1']).reduceRegion(ee.Reducer.median(), region).values().get(0))
}

function addNdwi(i) {
  return i.set('ndwi', i.normalizedDifference(['green', 'nir']).reduceRegion(ee.Reducer.median(), region).values().get(0))
}

function addH(i) {
  var hsv = i.select(['swir1', 'nir', 'green']).rgbToHsv()
  var v = hsv.select('hue').multiply(hsv.select('value')).reduceRegion(ee.Reducer.median(), region).values().get(0)
  return i.set('HSV', v)
}

function addC(i) {
  var vis = ee.Number(2.4).subtract(ee.Number(i.get('vis')).min(2.4)).divide(2.4)
  var blue = ee.Number(0.76).subtract(ee.Number(i.get('blue')).min(0.76)).divide(0.76)
  var temp = ee.Number(1).subtract(ee.Number(300).subtract(i.get('temp')).divide(300))
  return i.set('c', vis.multiply(temp).multiply(blue))
}

function addVis(i) {
  return i.set('vis', 
    i.select('red').add(i.select('green')).add(i.select('blue'))
    .reduceRegion(ee.Reducer.median(), region.centroid(1).buffer(60)).values().get(0))
}

var bands = ['swir1', 'nir', 'green', 'red', 'blue', 'swir2', 'temp']

var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').select(['B6', 'B5', 'B3', 'B4', 'B2', 'B7', 'B10'], bands);
var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').select(['B5', 'B4', 'B2', 'B3', 'B1', 'B7', 'B6_VCID_1'], bands);
var l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').select(['B5', 'B4', 'B2', 'B3', 'B1', 'B7', 'B6'], bands);
var l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').select(['B5', 'B4', 'B2', 'B3', 'B1', 'B7', 'B6'], bands);

//var images = ee.ImageCollection(l4.merge(l5).merge(l7).merge(l8))
var images = ee.ImageCollection(l4.merge(l5).merge(l8))
//var images = l8

// Load a landsat 8 image, select the bands of interest.
var images = images.filterBounds(region.centroid(1))
  //.filterDate('2015-01-01', '2017-01-01')
  //.select(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11'])
  //.map(function(i) { return i
  //    .addBands(i.normalizedDifference(['B5', 'B4']).rename('NDVI'))
  //    .addBands(i.normalizedDifference(['B6', 'B3']).rename('MNDWI'))
  //    .addBands(i.normalizedDifference(['B5', 'B3']).rename('NDWI'))
  //})
  .map(addAny)
  .map(addTemp)
  .map(addSwir)
  .map(addVis)
  .map(addNdsi)
  .map(addNdwi)
  .map(addBlue)
  .map(addH)
  .map(addC)
  .filter(ee.Filter.eq('any', 1))
  //.sort('temp')
  //.sort('swir1')

var rows = 20
var columns = 30

var g = gallery(images.sort('vis'), region, rows, columns)
var image = g.image
Map.addLayer(image, {bands: ['swir1', 'nir', 'green'], min: 0.05, max: 0.4}, 'vis');

var g = gallery(images.sort('swir1'), region, rows, columns)
var image = g.image
Map.addLayer(image, {bands: ['swir1', 'nir', 'green'], min: 0.05, max: 0.4}, 'swir1');

var g = gallery(images.sort('temp', false), region, rows, columns)
var image = g.image
Map.addLayer(image, {bands: ['swir1', 'nir', 'green'], min: 0.05, max: 0.4}, 'temp');

var g = gallery(images.sort('blue'), region, rows, columns)
var image = g.image
Map.addLayer(image, {bands: ['swir1', 'nir', 'green'], min: 0.05, max: 0.4}, 'blue');

var g = gallery(images.sort('HSV'), region, rows, columns)
var image = g.image
Map.addLayer(image, {bands: ['swir1', 'nir', 'green'], min: 0.05, max: 0.4}, 'HSV');

var g = gallery(images.sort('c', false), region, rows, columns)
var image = g.image
Map.addLayer(image, {bands: ['swir1', 'nir', 'green'], min: 0.05, max: 0.4}, 'c=blue*temp*vis');

var g = gallery(images.sort('ndsi'), region, rows, columns)
var image = g.image
Map.addLayer(image, {bands: ['swir1', 'nir', 'green'], min: 0.05, max: 0.4}, 'ndsi');

var g = gallery(images.sort('ndwi', false), region, rows, columns)
var image = g.image
Map.addLayer(image, {bands: ['swir1', 'nir', 'green'], min: 0.05, max: 0.4}, 'ndwi');

print(ui.Chart.array.values(images.sort('vis').aggregate_array('vis'), 0).setOptions({title:'vis'}))
print(ui.Chart.array.values(images.sort('temp', false).aggregate_array('temp'), 0).setOptions({title:'temp'}))
print(ui.Chart.array.values(images.sort('blue').aggregate_array('blue'), 0).setOptions({title:'blue'}))
print(ui.Chart.array.values(images.sort('c').aggregate_array('c'), 0).setOptions({title:'c'}))
print(ui.Chart.array.values(images.sort('HSV').aggregate_array('HSV'), 0).setOptions({title:'c'}))

return

var g = gallery(images.filter(ee.Filter.lte('temp', 273.15)), region, rows, columns)
var image = g.image
Map.addLayer(image, {bands: ['swir1', 'nir', 'green'], min: 0.05, max: 0.4}, 'T<273.15');

var g = gallery(images.filter(ee.Filter.gt('temp', 273.15)), region, rows, columns)
var image = g.image
Map.addLayer(image, {bands: ['swir1', 'nir', 'green'], min: 0.05, max: 0.4}, 'T>273.15');
