var images = ee.ImageCollection('USDA/NAIP/DOQQ')
  //.filterDate('2013-01-01', '2014-12-01')
  .filterBounds(Map.getBounds(true))
print(images)

var size = images.size().getInfo()

images = images.toList(size)

for(var i=0; i<size; i++) {
  var image = ee.Image(images.get(i))
  Map.addLayer(image, {bands: ['N','N','G'], min:40, max:200}, i.toString(), i===0)
  var ndwi = image.divide(255).normalizedDifference(['G','N'])
  Map.addLayer(ndwi, {min:-0.1, max:0.6}, 'ndwi' + i.toString(), i===0)
}
