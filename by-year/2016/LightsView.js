var countries = ee.FeatureCollection("ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw");
var lights = ee.ImageCollection("NOAA/DMSP-OLS/NIGHTTIME_LIGHTS").select('stable_lights')

var palette = ['000000', '08012d', '000058', '2322df', '8f95c7', 'd4e5ee']

var countriesMask = ee.Image().toInt().paint(countries, 1).focal_mode(2);

print(lights)

var lightsVis = lights.map(function(i) {
  return i.mask(countriesMask).visualize({min: 1, max: 60, palette: palette, forceRgbOutput: true})
})

var list = lightsVis.toList(35, 0);

var image = ee.Image(list.get(0))
print(image)
Map.addLayer(image, {})

var image = ee.Image(list.get(1))
print(image)
Map.addLayer(image, {})

var image = ee.Image(list.get(2))
print(image)
Map.addLayer(image, {})

Export.video.toDrive({
  collection: lightsVis,
  description: 'LightsHD',
  fileNamePrefix: 'LightsHD', 
  framesPerSecond: 10, 
  dimensions: '1920x1080', 
  region: ee.Geometry.Rectangle([-180, -55, 180, 85])
})