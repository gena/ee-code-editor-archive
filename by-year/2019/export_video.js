var assets = require('users/gena/packages:assets')
var utils = require('users/gena/packages:utils')

var bounds = ee.Geometry(Map.getBounds(true))
var scale = Map.getScale()

var images = assets.getImages(bounds.centroid(scale), {missions: ['L5', 'L7', 'L8', 'S2']})

images = assets.getMostlyCleanImages(images, bounds)

//images = images.filterDate('1989-01-01', '1990-01-01').select(['swir', 'nir', 'blue'])
//images = images.filterDate('2018-01-01', '2018-02-01').select(['swir', 'nir', 'blue'])

print('Number of images: ', images.size())

var params = utils.generateExportParameters(bounds, 1920, 1080, 'EPSG:3857')

print(params)

var min = 0.05
var max = 0.6
var gamma = 1.5

images = images.sort('system:time_start')

print(images.first())

var frames = images.map(function(i) {
  return i.visualize({min: min, max: max, gamma: gamma})
})

Map.addLayer(images.reduce(ee.Reducer.percentile([50])), {min: min, max: max, gamma: gamma}, '50%', true)
Map.addLayer(images.reduce(ee.Reducer.percentile([5])), {min: min, max: max, gamma: gamma}, '5%')

var name = 'reservoir1'

for(var i=0; i<10; i++) {
  var image = ee.Image(frames.toList(1, i).get(0))
  Map.addLayer(image, {}, 'frame ' + i.toString(), i == 0)
}

Export.video.toDrive({
  collection: frames, 
  description: name, 
  folder: 'Sudan', 
  fileNamePrefix: name, 
  framesPerSecond: 12, 
  dimensions: 1920, 
  region: params.bounds, 
  scale: params.scale.getInfo()
})
