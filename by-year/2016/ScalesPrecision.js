var scale = 0.0333333333333333333333333333333333333333; // truncates to 17 digits precision (double)
print(scale)
print(ee.Number(scale).getInfo())

print(scale === ee.Number(scale).getInfo())

scale = ee.Number(scale)

var prj = ee.Projection('EPSG:4326').scale(scale, scale)

var scaleComputed = prj.nominalScale().divide(ee.Projection('EPSG:4326').nominalScale())

print('Original scale:', scale.format('%.25f'))
print('Computed scale:', scaleComputed.format('%.25f'))

print('Computed and original scales area equal: ', scaleComputed.eq(scale))

// SRTM
var dem = ee.Image('USGS/SRTMGL1_003')
var prj = dem.projection()
print(prj.transform())

print(prj.nominalScale().divide(ee.Projection('EPSG:4326').nominalScale()))

// HAND
var hand = ee.Image(ee.ImageCollection('users/gena/global-hand/hand-100').first())
var prj = hand.projection()
print(prj.transform())

print(prj.nominalScale().divide(ee.Projection('EPSG:4326').nominalScale()))
