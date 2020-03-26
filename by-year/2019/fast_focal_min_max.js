var utils = require('users/gena/packages:utils')

var geometry = ee.Geometry(Map.getCenter()).buffer(Map.getScale()*100).bounds()
var image = ee.Image().int().paint(geometry, 1)

Map.addLayer(image, {min: 0, max: 1}, 'original')

Map.addLayer(ee.Image(1).mask(utils.FastMorphology.focalMax(image, 60)), {min: 0, max: 1, palette: ['00ff00'], opacity: 0.5}, 'max')

Map.addLayer(ee.Image(1).mask(utils.FastMorphology.focalMin(image, 60)), {min: 0, max: 1, palette: ['0000ff'], opacity: 0.5}, 'min')

Map.addLayer(image.focal_max(60), {min: 0, max: 1, palette: ['00ff00'], opacity: 0.5}, 'max (slow)', false)

Map.addLayer(image.focal_min(60), {min: 0, max: 1, palette: ['0000ff'], opacity: 0.5}, 'min (slow)', false)

Map.addLayer(ee.Image(1).mask(utils.FastMorphology.focalMaxWeight(image, 60)), {min: 0, max: 1, palette: ['00ff00']}, 'max weight')

