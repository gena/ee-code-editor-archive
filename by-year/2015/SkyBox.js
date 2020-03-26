var image = ee.Image('GME/images/00979750194450688595-15376670774087721723')
Map.addLayer(image)
Map.addLayer(image.select('b4'), {opacity: 0.5})
Map.centerObject(image)