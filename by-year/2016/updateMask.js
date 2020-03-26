Map.setCenter(0, 0, 8)

// generate a new image, a few squares
var xy = ee.Image.pixelLonLat()
var original = xy.mask(xy.abs().lt(1)).gt(0) 

Map.addLayer(original, {}, 'original', false)

var mask1 = xy.abs()
var mask2 = ee.Image(1).subtract(xy.abs())

// apply mask1
var image1 = original.updateMask(mask1)
Map.addLayer(image1, {}, 'masked (mask1)', false)

// now apply mask2 on top of mask1, expected masks to be combined
var image2 = image1.updateMask(mask2)
Map.addLayer(image2, {}, 'masked (mask1, mask2)', false)

// generate expected image
var expected = original.updateMask(mask1.multiply(mask2))
Map.addLayer(expected, {}, 'expected')

