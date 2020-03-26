/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l = /* color: d63000 */ee.Geometry.LineString(
        [[-115.51386952400208, 48.66187906841271],
         [-115.5066704750061, 48.661836549929696]]),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function sampleLinePoints(lineString, count) {
  var length = l.length();
  var step = l.length().divide(count);
  var distances = ee.List.sequence(0, length, step)

  function makePointFeature(coord, offset) {
    var pt = ee.Algorithms.GeometryConstructors.Point(coord);
    return new ee.Feature(pt).set('offset', offset)
  }
  
  var lines = l.cutLines(distances).geometries();

  var points =   lines.zip(distances).map(function(s) {
    var line = ee.List(s).get(0);
    var offset = ee.List(s).get(1)
    return makePointFeature(ee.Geometry(line).coordinates().get(0), offset)
  })
  
  points = points.add(makePointFeature(l.coordinates().get(-1), length))

  return new ee.FeatureCollection(points);
}

l8 = l8
  .filterBounds(Map.getBounds(true))
  .select(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', ])

Map.addLayer(ee.Image(l8.first()))

var scale = 20; // sampling scale

var segmentCount = l.length().divide(scale).round();
var points = sampleLinePoints(l, segmentCount);

Map.addLayer(points)

/*
// sample values along the line
var samples = l8.getRegion(l, scale)

print(samples)

var points = samples.slice(1).map(function(o) {
  var l = ee.List(o);
  var x = l.get(1);
  var y = l.get(2);

  var pt = ee.Algorithms.GeometryConstructors.Point(ee.List([x, y]));
  
  return new ee.Feature(pt)
})

Map.addLayer(ee.FeatureCollection(points))

*/

// spectrogram location
var bounds = ee.List(Map.getBounds())
var xmin = ee.Number(bounds.get(0))
var ymin = ee.Number(bounds.get(1))
var xmax = ee.Number(bounds.get(2))
var ymax = ee.Number(bounds.get(3))

var rect = ee.Geometry.Rectangle([
  xmax.subtract(xmax.subtract(xmin).multiply(0.3)),
  ymax.subtract(ymax.subtract(ymin).multiply(0.9)),
  xmax.subtract(xmax.subtract(xmin).multiply(0.01)),
  ymax.subtract(ymax.subtract(ymin).multiply(0.1))
])

Map.addLayer(rect)
