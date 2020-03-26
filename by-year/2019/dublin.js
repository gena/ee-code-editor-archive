var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')

var images = assets.getImages(Map.getCenter(), {
  missions: [
    'S2',
    'L8',
    //'L7'
  ]
})

var bounds = Map.getCenter().buffer(3000)

images = assets.getMostlyCleanImages(images, bounds, {
  cloudFrequencyThresholdDelta: 0.35,
  percentile: 0.85,
  qualityBand: 'swir',
  scale: Map.getScale()
})


// images = images.sort('system:time_start')
images = images.sort('quality_score')

images = images.map(function(i) {
  return i.visualize({bands: ['red', 'green', 'blue'], min: 0.05, max: 0.4})
    .set({label: i.date().format().cat(' ').cat(ee.Number(i.get('quality_score')).format('%.3f'))})
})

animation.animate(images, {maxFrames: 80})
  .then(function() {
    Map.addLayer(ee.Image().paint(bounds, 1, 3), {palette: ['ffff00']}, 'aoi')
  })

