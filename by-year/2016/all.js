/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    s2 = ee.ImageCollection("COPERNICUS/S2"),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA"),
    aster = ee.ImageCollection("ASTER/AST_L1T_003");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
print(Map.getCenter())

var count = 30
var start = '2016-10-01'
var stop = '2016-11-30'

// ASTER
var images = aster.filterBounds(Map.getBounds(true)).filterDate(start, stop)
  .sort('system:time_start', false).toList(count, 0)

for (var i = 0; i < images.length().getInfo(); i++) {
  var image = ee.Image(images.get(i))
  print(image)
  var name = image.getInfo().id
  Map.addLayer(image.select(['B1', 'B2', 'B3N']), {min:400, max:5000}, name, i == 0)
}

// SENTINEL-1
var images = s1.filterBounds(Map.getBounds(true)).filterDate(start, stop)
  .sort('system:time_start', false).toList(count, 0)

for (var i = 0; i < images.length().getInfo(); i++) {
  var image = ee.Image(images.get(i))
  print(image)
  var name = image.getInfo().id
  Map.addLayer(image.select(0), {min:-25, max:-1}, name, i == 0)
}

// SENTINEL-2
var images = s2.filterBounds(Map.getBounds(true)).filterDate(start, stop)
  .sort('system:time_start', false).toList(count, 0)

for (var i = 0; i < images.length().getInfo(); i++) {
  var image = ee.Image(images.get(i))
  print(image)
  var name = image.getInfo().id
  Map.addLayer(image.select(['B12', 'B8', 'B3']), {min:400, max:5000}, name, i == 0)
}

var images = l8.filterBounds(Map.getBounds(true)).filterDate(start, stop)
  .sort('system:time_start', false).toList(count, 0)

for (var i = 0; i < images.length().getInfo(); i++) {
  var image = ee.Image(images.get(i))
  print(image)
  var name = image.getInfo().id + ' ' + ee.Date(image.get('system:time_start')).format('YYYY-MM-dd HH:MM:SS').getInfo()
  Map.addLayer(image.select(['B6', 'B5', 'B3']), {min:0.04, max:0.6}, name, i == 0)
  
  var rgb = image.select(['B4','B3','B2'])
  var pan = image.select('B8')
  var hsv  = rgb.rgbtohsv();
  var huesat = hsv.select('hue', 'saturation');
  var pansharpened = ee.Image.cat(huesat, pan).hsvtorgb();

  Map.addLayer(pansharpened, {min:0.02, max:0.14}, name + ' pan', i == 0)
}

var images = l7.filterBounds(Map.getBounds(true)).filterDate(start, stop)
  .sort('system:time_start', false).toList(count, 0)

for (var i = 0; i < images.length().getInfo(); i++) {
  var image = ee.Image(images.get(i))
  print(image)
  var name = image.getInfo().id + ' ' + ee.Date(image.get('system:time_start')).format('YYYY-MM-dd HH:MM:SS').getInfo()
  Map.addLayer(image.select(['B5', 'B4', 'B2']), {min:0.04, max:0.6}, name, i == 0)
}
