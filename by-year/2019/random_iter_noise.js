var utils = require('users/gena/packages:utils')
var animation = require('users/gena/packages:animation')
var colorbrewer = require('users/gena/packages:colorbrewer')

var region = ee.Geometry(Map.getBounds(true))
var scale = Map.getScale()
var vis = {min: 0, max: 1, forceRgbOutput: true}

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

var max = 50
var images = ee.List.sequence(0, max).iterate(function(current, previous) {
  var images = ee.List(previous)
  var image = ee.Image(images.get(-1))

  // add some normally distributed noise
  var noise = utils.norm(ee.Number(current).multiply(1000)).multiply(0.1)
  
  return images.add(image.add(noise))
}, [image])


images = ee.ImageCollection.fromImages(images)

animation.animate(images, {maxFrames: max})