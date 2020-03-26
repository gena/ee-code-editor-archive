function sigmoid(x) {
  return x.multiply(-1).exp().add(1).pow(-1)
}


Map.setCenter(0,0,7)

var image = ee.Image([0,0]).mask(sigmoid(ee.Image.pixelLonLat().select(0)))
Map.addLayer(image)
