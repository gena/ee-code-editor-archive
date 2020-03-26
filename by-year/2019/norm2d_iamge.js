var u1 = ee.Image.random(1000)
var u2 = ee.Image.random(2000)

Map.addLayer(u1, {}, 'u1')
Map.addLayer(u2, {}, 'u2')

// https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
var n = u1.log().multiply(-2).sqrt().multiply(u2.multiply(2 * Math.PI).cos())

Map.addLayer(n, {}, 'n')

var region = ee.Geometry(Map.getBounds(true))
var scale = Map.getScale()
var maxBuckets = 150

print(ui.Chart.image.histogram(u1, region, scale, maxBuckets))
print(ui.Chart.image.histogram(n, region, scale, maxBuckets))