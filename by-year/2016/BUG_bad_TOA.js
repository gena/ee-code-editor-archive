var image = ee.Image('LANDSAT/LC8_L1T_TOA/LC80412262014168LGN00').select([5,4,3])

Map.addLayer(image, {min:0, max:50})

Map.centerObject(image, 9)

var reflectance = image
  .reduceRegion(ee.Reducer.first(), Map.getCenter()).values().get(0).getInfo()

if(reflectance > 1) {
  throw 'Bad reflectance value: ' + reflectance
}
