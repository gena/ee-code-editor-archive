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
  // switch to polar
  var r = x.add(offsetX).pow(2).add(y.pow(2)).sqrt()
  var theta = y.atan2(x.add(offsetX))

  // paint
  var flower = r.subtract(theta.multiply(n).sin().divide(Math.PI))
  
  return flower.mask(ee.Image(1).subtract(flower)).visualize({forceRgbOutput: true})
}

Map.addLayer(f(0, -4))
Map.addLayer(f(2, 0))
Map.addLayer(f(3, 4))
Map.addLayer(f(5, 8))
Map.addLayer(f(8, 12))
Map.addLayer(f(13, 16))

// add a sphere
y = y.add(4)
x = x.add(-8)

// switch to polar
var r = x.pow(2).add(y.pow(2)).sqrt()
var theta = y.atan2(x)

// draw a circle in polar
var circle = r.lt(1)

// draw a shadow in cartesian
var shadow = x.add(0.2).pow(2).add(y.add(0.3).pow(2))

// draw a sphere
var sphere = ee.Image().mask(circle).updateMask(shadow).visualize({forceRgbOutput: true})
Map.addLayer(sphere)

