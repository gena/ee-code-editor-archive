//var white = ee.Image(1).visualize({palette:['ffffff']})
//Map.addLayer(white, {}, 'white')

// visualize 100k points
var image = ee.Image.pixelLonLat()

var points = image.sample({
  region: ee.Geometry(Map.getBounds(true)), 
  scale: Map.getScale(), 
  numPixels: 1000
}).map(function(f) {
  return ee.Feature(ee.Algorithms.GeometryConstructors.Point([f.get('longitude'), f.get('latitude')]))
})

Map.addLayer(points, {color: 'yellow'}, 'points', false)

var pointsImage = ee.Image(0).int().paint(points, 1, 1).focal_max(1)
Map.addLayer(pointsImage, {min: 0, max: 1, palette: ['000000', 'ffff00']}, 'points (image)')
