var bounds = ee.Geometry(Map.getBounds(true))
var scale = Map.getScale()
var buffer = function(radius) { return function(f) { return f.buffer(radius) } }
var points = ee.FeatureCollection.randomPoints(bounds).map(buffer(5 * scale))
var image = ee.Image().int().paint(points, 1)

var utils = require('users/gena/packages:utils')

var weight = utils.focalMaxWeight(image, 100)

//Map.addLayer(image, {}, 'points')
Map.addLayer(weight.mask(weight), {palette:['000000']}, 'weight')

