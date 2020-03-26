/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Polygon(
        [[[-116.38641357421875, 40.8871408472591],
          [-116.15020751953125, 41.148251985853236],
          [-116.25457763671875, 41.42480515689558],
          [-116.46881103515625, 41.43304245448662],
          [-116.6748046875, 41.3320635533681],
          [-116.53472900390625, 41.16272780428282]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/***
 * https://en.wikipedia.org/wiki/Eikonal_equation
 * 
 * Solve eikonal equation: |∇Z| = v(x, y)
 * 
 * A discritized form using central differences scheme is:
 * 
 * (Z(i, j) - Zxmin)(+)² + (Z(i,j) - Zymin)(+)² = d² v²(i, j)
 * 
 * Zxmin = min(Z(i-1, j), Z(i+1, j))
 * Zymin = min(Z(i, j-1), Z(i, j+1))
 * 
 * d = dx = dy
 * 
 * Z(i, j) = min(Zxmin, Zxmax) + d * v(x, y)
 * 
 */
 
function solveEikonal(z, v) {
  var m = z.rename('z').neighborhoodToBands(ee.Kernel.square(1, 'pixels'))

  var Zx = m.select('z_-1_0').min(m.select('z_1_0'))
  var Zy = m.select('z_0_-1').min(m.select('z_0_1'))
  
  z = Zx.add(Zy).divide(2)
    .add(Zx.add(Zy).pow(2).subtract(Zx.pow(2).add(Zy.pow(2)).subtract(Zx.pow(2).add(Zy.pow(2)).subtract(v.pow(2).multiply(d.pow(2)))).multiply(2))
    .sqrt().divide(2)
    )
  
  //return ee.Algorithms.If(Zx.subtract(Zy).abs().gte(v.multiply(d)), Zx.min(Zy).add(v.multiply(d).pow(2)))
  
  return z
}

var zero = ee.Image(0).float()

var v = zero.paint(geometry, 0.000001)
var z0 = zero.paint(geometry, 1)

var d = ee.Number(0.00001)

var z = ee.List.sequence(0, 10).iterate(function(current, prev) {
  return solveEikonal(ee.Image(prev), v, d)
}, z0)

z = ee.Image(z).reproject(ee.Projection('EPSG:3857').atScale(Map.getScale()*5))

Map.addLayer(v, {min: 0, max: 1}, 'v', false)
Map.addLayer(z0, {min: 0, max: 1}, 'z0', false)
Map.addLayer(z, {min: 0, max: 1}, 'z')
