var animation = require('users/gena/packages:animation')

var point = Map.getCenter()

Map.addLayer(point)

var e = Map.getScale()

// Map.addLayer(ee.Image().paint(rect, 1, 3), {palette: ['brown']})

var s = ee.Number(Map.getScale())

var frames = ee.List.sequence(0, 50).map(function(t) {
  var size = ee.Number(150).subtract(t)

  var coords = point.buffer(s.multiply(size)).bounds().coordinates().get(0)
  var rect = ee.Algorithms.GeometryConstructors.LineString(coords, null, false)
    .difference(point.buffer(s.multiply(size).multiply(1.1)), e)

  return ee.Image().paint(rect, 1, 3).visualize({palette: ['brown']})
})

print(frames)
frames = ee.ImageCollection(frames)

animation.animate(frames, {maxFrames: 50})
