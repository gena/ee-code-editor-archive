var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')

var coords = ee.Geometry.Point([114.0822, 30.5291])

Map.centerObject(coords, 16)
Map.setOptions('SATELLITE')

var bounds = Map.getBounds(true)

var images = assets.getImages(bounds, {
  missions: ['S2'],
  resample: true,
  filter: ee.Filter.date('2019-09-01', '2020-09-01')
})

images = assets.getMostlyCleanImages(images, bounds)

images = images.sort('system:time_start').map(function(i) {
  return i.set({ label: ee.String(i.get('MISSION')).cat(' ').cat(i.date().format('YYYY-MM-dd')) })
})

images = ee.ImageCollection(images.distinct(['label'])) // remove some duplicates over a single day
var mean = images.reduce(ee.Reducer.mean()).rename(images.first().bandNames())
var std = images.reduce(ee.Reducer.stdDev()).rename(images.first().bandNames())

images = images.map(function(i) {
  return i.subtract(i.convolve(ee.Kernel.gaussian(Map.getScale()*3, Map.getScale()*2, 'meters')).convolve(ee.Kernel.laplacian8(2))) // LoG
    .copyProperties(i)
})


animation.animate(images, {
  label: 'label',
  maxFrames: 100,
  vis: {
    min: 0.05, max: 0.5
  }
})