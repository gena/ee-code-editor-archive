/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var g = /* color: d63000 */ee.Geometry.LineString(
        [[-124.1019058227539, 38.36804051336673],
         [-120.849609375, 38.61687046392973],
         [-118.388671875, 39.842286020743394],
         [-114.697265625, 39.842286020743394],
         [-111.533203125, 39.3002991861503]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function makeOrthogonalLine(points, length) {
  var pt1 = ee.List(ee.List(points).get(0))
  var pt2 = ee.List(ee.List(points).get(1))
  
  var x1 = ee.Number(pt1.get(0))
  var y1 = ee.Number(pt1.get(1))
  var x2 = ee.Number(pt2.get(0))
  var y2 = ee.Number(pt2.get(1))
  
  // c - hypothenuse, wx, wy - lengths of adjacent and opposite legs
  var wx = x1.subtract(x2).abs()
  var wy = y1.subtract(y2).abs()
  var c = wx.multiply(wx).add(wy.multiply(wy)).sqrt()
  
  var sin = x2.subtract(x1).divide(c)
  var cos = y2.subtract(y1).divide(c)
  
  var pt = ee.List(points.get(0))
  var ptx = ee.Number(pt.get(0))
  var pty = ee.Number(pt.get(1))
  
  var pt1x = ptx.subtract(cos.multiply(length).multiply(0.5));
  var pt1y = pty.add(sin.multiply(length).multiply(0.5));
  var pt2x = ptx.add(cos.multiply(length).multiply(0.5));
  var pt2y = pty.subtract(sin.multiply(length).multiply(0.5));
  
  return ee.Algorithms.GeometryConstructors.LineString(ee.List([pt1x, pt1y, pt2x, pt2y]))
}

var b = g.buffer(100000)

Map.addLayer(b, {opacity: 0.5}, 'buffer')

var coords = g.coordinates()

var bufferSize = 4
var begin = makeOrthogonalLine(coords, bufferSize)
Map.addLayer(begin)

var end = makeOrthogonalLine(coords.slice(-2).reverse(), bufferSize)
Map.addLayer(end)

var cap1 = ee.Geometry(b.difference(begin.buffer(1)).geometries().get(1))
Map.addLayer(cap1, {}, 'cap1', false)

var cap2 = ee.Geometry(cap1.difference(end.buffer(1)).geometries().get(1))
Map.addLayer(cap2, {}, 'cap2')
