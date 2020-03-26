var geometry = /* color: #d63000 */ee.Geometry.Polygon(
        [[[30.18745093218422, 51.350799696741404],
          [30.188137577692032, 51.36709290020106],
          [30.17474799028969, 51.39987611559026],
          [30.12427954546547, 51.418292973638856],
          [30.054928349176407, 51.393235661731374],
          [30.130116032281876, 51.351442959381615]]]);
          
var bounds = ee.Geometry(Map.getBounds(true))

Map.setOptions('HYBRID')

Map.centerObject(geometry)

var images2 = ee.ImageCollection('LANDSAT/LT04/C01/T1_TOA').select(['B5', 'B4', 'B3'], ['swir', 'nir', 'red']).filterBounds(bounds.centroid(1))
var images3 = ee.ImageCollection('LANDSAT/LT04/C01/T2_TOA').select(['B5', 'B4', 'B3'], ['swir', 'nir', 'red']).filterBounds(bounds.centroid(1))
var images4 = ee.ImageCollection('LANDSAT/LT05/C01/T1_TOA').select(['B5', 'B4', 'B3'], ['swir', 'nir', 'red']).filterBounds(bounds.centroid(1))
var images5 = ee.ImageCollection('LANDSAT/LT05/C01/T2_TOA').select(['B5', 'B4', 'B3'], ['swir', 'nir', 'red']).filterBounds(bounds.centroid(1))


var images = images2.merge(images3).merge(images4).merge(images5)
  .filterDate('1986-03-01', '1987-01-01')

print(images.size())

// LANDSAT/LT05/C01/T1_TOA 
// LANDSAT/LT05/C01/T2_TOA 
// LANDSAT/LE07/C01/T1_TOA 
// LANDSAT/LE07/C01/T2_TOA 

// var assets = require('users/gena/packages:assets')
// images = assets.getMostlyCleanImages(images, geometry, {
//   cloudFrequencyThresholdDelta: 0.15
// })

print(images.size())

images = images.sort('system:time_start')

images = images.map(function(i) { 
  var label = i.date().format()
  var s = Map.getScale()
  var r = s * 4
  var ss = s * 2
  i = i.resample('bicubic')
  i = i.subtract(i.convolve(ee.Kernel.gaussian(r, ss, 'meters')).convolve(ee.Kernel.laplacian8(2))) // LoG

  return i.set({ label: label }) 
})

var animation = require('users/gena/packages:animation')
animation.animate(images, { vis: { min: 0.05, max: 0.4, gamma: 1.5 }, label: 'label', maxFrames: 150 })
