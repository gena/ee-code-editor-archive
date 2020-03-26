var bands8 = ['B3', 'B6', 'B5', 'B2'];
var bands7 = ['B2', 'B5', 'B4', 'B1'];
var bands = ['green', 'swir1', 'red', 'nir'];

var bounds = ee.Geometry(Map.getBounds(true))
var start = '2014-01-01'
var stop = '2015-01-01'

var images = new ee.ImageCollection([]);

var images_l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').select(bands8, bands).filterBounds(bounds);
images = new ee.ImageCollection(images.merge(images_l8));

var images_l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').select(bands7, bands).filterBounds(bounds);
images = new ee.ImageCollection(images.merge(images_l7));

var images_l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').select(bands7, bands).filterBounds(bounds);
images = new ee.ImageCollection(images.merge(images_l5));

var images_l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').select(bands7, bands).filterBounds(bounds);
images = new ee.ImageCollection(images.merge(images_l4));

images = images.filterDate(start, stop)

var step = 5
var percentiles = ee.List.sequence(0, 100, step)
var count = percentiles.length().getInfo()

var percentileImages = percentiles.map(function(p) {
  var image = images.reduce(ee.Reducer.percentile([p])).rename(bands);
  var ndwi = image.normalizedDifference(['green', 'nir']).rename('water')

  return image.addBands(ndwi)
})

for(var i = 0; i < count; i++) {
  var name = (step * i) + '%'
  var image = ee.Image(percentileImages.get(i))
  
  Map.addLayer(image, {bands: ['swir1', 'nir', 'green'], min: 0.03, max: 0.5}, name, false)
  Map.addLayer(image, {bands: ['water'], min: -0.5, max: 0.5}, 'NDWI ' + name, false)
}


