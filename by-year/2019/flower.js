Map.setCenter(0, 0, 6)

var xy = ee.Image.pixelLonLat().rename(['x', 'y'])

// switch to map projection to avoid reprojects
xy = xy.changeProj('EPSG:4326', ee.Projection('EPSG:3857').scale(100000, 100000))

var x = xy.select(0)
var y = xy.select(1)

/***
 * Draws a flower
 */
function f(n, offsetX) {
  offsetX = ee.Image.constant(offsetX)
  n = ee.Image.constant(n)
  
  // switch to polar
  var r = x.add(offsetX).pow(2).add(y.pow(2)).sqrt()
  var theta = y.atan2(x.add(offsetX))

  // paint
  var flower = r.subtract(theta.multiply(n).sin().divide(Math.PI))
  
  return flower.mask(ee.Image.constant(1).subtract(flower)).visualize({forceRgbOutput: true})
}

var animation = require('users/gena/packages:animation')

var images = ee.ImageCollection(ee.List.sequence(0, 20).map(function(i) { return f(i, -4) }))

print(images)

animation.animate(images)

