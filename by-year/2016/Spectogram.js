/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var hyperion = ee.ImageCollection("EO1/HYPERION"),
    point = /* color: d63000 */ee.Geometry.Point([-93.58527660369873, 30.2532843662835]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/***
 * Generates spectrogram features using given bounds, image and point.
 */
var generateSpectrogram = function(bounds, images, point) {
  var values = images.getRegion(point, 30)

  var lon0 = ee.Number(bounds[0][0]);
  var lon1 = ee.Number(bounds[1][0]);
  var lat0 = ee.Number(bounds[0][1]);
  var lat1 = ee.Number(bounds[2][1]);

  var nx = ee.Number(values.length().subtract(1))
  var ny = ee.Number(ee.List(values.get(0)).length().subtract(4))

  var w = lon1.subtract(lon0)
  var h = lat1.subtract(lat0)
  var dx = w.divide(nx)
  var dy = h.divide(ny)

  var lons = ee.List.sequence(lon0, lon1.subtract(dx), dx)
  var lats = ee.List.sequence(lat0, lat1.subtract(dy), dy)
  
  var polys = lons.zip(ee.List.sequence(0, lons.length())).map(function(olon) {
    var l = ee.List(olon)
    var lon = ee.Number(l.get(0))
    var index1 = ee.Number(l.get(1))
    var imageValues = ee.List(values.get(index1.add(1)));
    var id = imageValues.get(0)
    var time = ee.Date(imageValues.get(3))
    var headers = ee.List(values.get(0))
    return lats.zip(ee.List.sequence(0, lats.length())).map(function(olat) {
      var l = ee.List(olat)
      var lat = ee.Number(l.get(0))
      var index2 = ee.Number(l.get(1))
      var value = ee.Number(imageValues.get(index2.add(4)))
      var band = headers.get(index2.add(4))

      var x1 = lon
      var x2 = lon.add(dx)
      var y1 = lat
      var y2 = lat.add(dy)
      
      var coords = ee.List([x1, y1, x2, y2]);
      var rect = ee.Algorithms.GeometryConstructors.Rectangle(coords);
      return ee.Feature(rect).set('value', value).set('id', id).set('band', band).set('time', time)
    })
  }).flatten();

  return ee.FeatureCollection(polys);
}

Map.centerObject(point, 13)

//var palette = ['008744', '0057e7', 'd62d20', 'ffa700']; // http://www.color-hex.com/color-palette/1872
//var palette = ['ffffcc', 'c7e9b4', '7fcdbb', '41b6c4', '2c7fb8', '253494']
var palette = ['006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027', 'a50026'];

Map.addLayer(hyperion.select(0).count(), {min:1, max:30}, 'count', false)

// Map.addLayer(hyperion, {}, 'raw', false)  

var count = 5
var images = hyperion.filterBounds(point).toList(count, 0)
for(var i = 0; i < count; i++) {
  var image = ee.Image(images.get(i))
  var time = ee.Date(image.get('system:time_start')).format('YYYY-MM-dd').getInfo()

  var image = image.divide(40) // DN => W/m^2/µm/sr
  Map.addLayer(image, {bands:['B029', 'B023', 'B016'], min:20, max:[150,150,200]}, time, i === 0)
}

var bounds = ee.List(Map.getBounds())
var xmin = ee.Number(bounds.get(0))
var ymin = ee.Number(bounds.get(1))
var xmax = ee.Number(bounds.get(2))
var ymax = ee.Number(bounds.get(3))

var rect = ee.Geometry.Rectangle([
  xmax.subtract(xmax.subtract(xmin).multiply(0.3)),
  ymax.subtract(ymax.subtract(ymin).multiply(0.95)),
  xmax.subtract(xmax.subtract(xmin).multiply(0.01)),
  ymax.subtract(ymax.subtract(ymin).multiply(0.1))
])

var bounds = rect.bounds().getInfo().coordinates[0]


var spectrogramFeatures = generateSpectrogram(bounds, hyperion, point)

Map.addLayer(spectrogramFeatures, {}, 'spectrogram features', false)

var spectrogram = spectrogramFeatures.reduceToImage(['value'], ee.Reducer.first());
Map.addLayer(spectrogram.mask(ee.Image().toByte().paint(spectrogramFeatures, 1)), {
  palette:palette, min:0, max:4000}, 'spectrogram', true)

var outline = ee.Image().toByte().paint(spectrogramFeatures, 1, 1);
Map.addLayer(outline.mask(outline), {palette:['000000'], opacity: 0.4}, 'outline', true)

// l8

var l8 = ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
  .select(['B1','B2','B3','B4','B5','B6','B7','B8','B9'])
  //.filterMetadata('CLOUD_COVER', 'less_than', 30)
  .filterBounds(point)

var rect = ee.Geometry.Rectangle([
  xmax.subtract(xmax.subtract(xmin).multiply(0.97)),
  ymax.subtract(ymax.subtract(ymin).multiply(0.95)),
  xmax.subtract(xmax.subtract(xmin).multiply(0.7)),
  ymax.subtract(ymax.subtract(ymin).multiply(0.1))
])

var bounds = rect.bounds().getInfo().coordinates[0]

var spectrogramFeatures = generateSpectrogram(bounds, l8, point)
Map.addLayer(spectrogramFeatures, {}, 'spectrogram features', false)

var spectrogram = spectrogramFeatures.reduceToImage(['value'], ee.Reducer.first());
Map.addLayer(spectrogram.mask(ee.Image().toByte().paint(spectrogramFeatures, 1)), {
  palette:palette, min:0, max:1}, 'spectrogram (l8)', true)

var outline = ee.Image().toByte().paint(spectrogramFeatures, 1, 1);
Map.addLayer(outline.mask(outline), {palette:['000000'], opacity: 0.4}, 'outline', true)
