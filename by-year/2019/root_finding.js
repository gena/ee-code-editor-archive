var utils = require('users/gena/packages:utils')

var region = ee.Geometry(Map.getBounds(true))
var scale = Map.getScale()
var vis = {min: 0, max: 1, forceRgbOutput: true}

// add ll-lr line
var coords = ee.Array(region.coordinates()).slice(1, 0, 2).project([1, 2]).toList()
var line = ee.Geometry.LineString(coords)
Map.addLayer(line, {}, 'line')

// generate an image
function f() {
  var x = ee.Image.pixelLonLat().select(0).sin()
  var a = -0.8
  var b = -0.2
  var c = 0.9
  var d = 0.5
  
  return x.pow(3).multiply(a).add(x.pow(2).multiply(b)).add(x.multiply(c)).add(d)
}

var image = f()

Map.addLayer(image, vis, 'f', true)

var image_D2 = image.convolve(ee.Kernel.laplacian8()).zeroCrossing()
var roots = image.mask(image_D2)
Map.addLayer(roots, {palette: ['ff0000']}, 'laplacian = 0')

var profile1 = utils.reduceImageProfile(image, line, ee.Reducer.first(), scale * 5).map(function(f) { return f.set('series', 'image')})
var profile2 = utils.reduceImageProfile(roots, line, ee.Reducer.first(), scale * 5).map(function(f) { return f.set('series', 'roots')})

var series = profile1.merge(profile2)

print(ui.Chart.feature.groups(series, 'distance', 'first', 'series').setOptions({
  series: {
    1: {
      lineWidth: 0,
      pointSize: 3,
      pointColor: 'red'
    }
  }
}))

