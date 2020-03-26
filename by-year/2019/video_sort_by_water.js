var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')
var utils = require('users/gena/packages:utils')

var scale = Map.getScale()
var bounds = ee.Geometry(Map.getBounds(true))
var images = assets.getImages(bounds)
images = assets.getMostlyCleanImages(images, bounds, {cloudFrequencyThresholdDelta: 0.45})

print(images.size())

images = images.map(function(i) {
  var area = i.normalizedDifference(['green', 'swir'])
    .gt(0)
    .reduceRegion(ee.Reducer.sum(), bounds, scale * 5).values().get(0)
    
  return i.visualize({min:0, max: 0.45})
    .set({area: area})
}).sort('area')

images = ee.ImageCollection(images)

animation.animate(images)
