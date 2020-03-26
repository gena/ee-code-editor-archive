/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var g = /* color: #d63000 */ee.Geometry.Polygon(
        [[[-117.61692690871007, 38.669476623395376],
          [-117.54278154941619, 38.808706050947066],
          [-117.55925853747448, 38.97755748210618],
          [-117.6691036688025, 39.09913740598754],
          [-117.92449322152027, 39.1204456660515],
          [-118.10848361595464, 39.07995466355973],
          [-117.87506303844981, 39.03730707414261],
          [-117.98355308164446, 38.99138520360931],
          [-117.87158049222802, 38.966314825243614],
          [-117.92136048589185, 38.888612221148044],
          [-117.78717251923979, 38.87715235679408],
          [-117.7871870485364, 38.750905187733295]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var b = g.bounds()

Map.addLayer(g, {}, 'shape')
Map.addLayer(b, {}, 'bounds')

var image = ee.Image().byte().paint(b, 0).paint(g, 1)

var s = Map.getScale()

// use Monte Carlo to find area of the shape

var crs = 'EPSG:3857'
var points = image.addBands(ee.Image.pixelCoordinates(crs)).sample({ 
  region: b, 
  seed: Math.floor(Math.random() * 10000),
  projection: crs, 
  scale: s, 
  numPixels: 10000 })

var sum = ee.Number(points.aggregate_sum('constant'))
var count = points.size()

var ratio = sum.divide(count)

var area = g.area(s)
var areaSampled = b.area(s).multiply(ratio)

print('area: ', area)
print('ratio (sampled): ', areaSampled)

print('error: ', areaSampled.subtract(area).abs().divide(area).multiply(100).format('%.2f').cat('%'))

points = points.map(function(f) {
  return f.setGeometry(ee.Algorithms.GeometryConstructors.Point([f.get('x'), f.get('y')], crs))
})

Map.addLayer(ee.Image().byte().paint(points, 'constant').focal_max(0.1), {min:0, max: 1, palette: ['yellow', 'green']}, 'points')
