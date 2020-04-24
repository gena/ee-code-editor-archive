/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.MultiPolygon(
        [[[[128.01689987856423, 41.994474830748324],
           [128.01668530184304, 41.99488946550275],
           [128.0155265875486, 41.993549866562],
           [128.015955740991, 41.99329470166225]]],
         [[[89.7707225345157, 27.65412507248287],
           [89.77115168795808, 27.651160023550982],
           [89.77303996310457, 27.651160023550982],
           [89.7721816562198, 27.654277124107054]]],
         [[[89.77827563510164, 27.656633897243665],
           [89.78067889437898, 27.656633897243665],
           [89.77999224887117, 27.658534483737114],
           [89.7776748202823, 27.657698229750512]]],
         [[[89.78342547641023, 27.65556955437569],
           [89.78145137057527, 27.655113404260582],
           [89.7820521853946, 27.653896994650154],
           [89.7835113070987, 27.652832625140555],
           [89.78445544467195, 27.653820968600193]]]]),
    demALOS = ee.Image("JAXA/ALOS/AW3D30_V1_1");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// advection.js

var utils = require('users/gena/packages:utils')

function Terrain(elevation) {
  var step = ee.Image.pixelArea().sqrt()
  
  function radians(img) { 
    return img.toFloat().multiply(Math.PI).divide(180); 
  }
  
  var k_dx = ee.Kernel.fixed(3, 3,
                         [[ 1/8,  0,  -1/8],
                          [ 2/8,  0,  -2/8],
                          [ 1/8,  0,  -1/8]]);
  
  var k_dy = ee.Kernel.fixed(3, 3,
                         [[ -1/8, -2/8,  -1/8],
                          [ 0,    0,    0],
                          [ 1/8, 2/8,   1/8]]);
  
  
  var dx = elevation.convolve(k_dx)
  var dy = elevation.convolve(k_dy)
  
  var slope = ee.Image().expression("sqrt((x*x + y*y)/(step*step))", {x: dx, y: dy, step: step}).atan()
  
  var aspect = dx.atan2(dy).add(Math.PI)
  
  return {aspect: aspect, slope: slope}
}

var colorsRainbow = [
'F26C4F', // Light Red
'F68E55', // Light Red Orange	
'FBAF5C', // Light Yellow Orange
'FFF467', // Light Yellow
'ACD372', // Light Pea Green
'7CC576', // Light Yellow Green
'3BB878', // Light Green
'1ABBB4', // Light Green Cyan
'00BFF3', // Light Cyan
'438CCA', // Light Cyan Blue
'5574B9', // Light Blue
'605CA8', // Light Blue Violet
'855FA8', // Light Violet
'A763A8', // Light Violet Magenta
'F06EA9', // Light Magenta
'F26D7D'  // Light Magenta Red
];

var ex = 4

var p = ['040613', '292851', '3f4b96', '427bb7', '61a8c7', '9cd4da', 'eafdfd']

var dem = demALOS.select('MED').resample('bicubic')

dem = dem.convolve(ee.Kernel.gaussian(2, 1))

Map.addLayer(Terrain(dem).aspect, {min:0, max:2*Math.PI, palette:colorsRainbow}, 'aspect', false)
Map.addLayer(ee.Terrain.hillshade(dem.multiply(ex).resample('bicubic'), 315, 40).resample('bicubic'), {min:0, max:250, palette: p }, 'hillshade', false)

var demRGB = dem.visualize({min: 0, max: 2500, palette: p})
var contrast = 0
var brightness = 0
var saturation = 1
var castShadows = true
var azimuth = 315
var elevation = 55
var hs = utils.hillshadeRGB(demRGB, dem, 1, ex, azimuth, elevation, contrast, brightness, saturation, castShadows)
Map.addLayer(hs, {}, 'DEM')

// upwind
var dE = ee.Kernel.fixed(3, 3,
                       [[ 0,  0,  0],
                        [ 0, 1,  -1],
                        [ 0,  0,  0]]);

var dW = ee.Kernel.fixed(3, 3,
                       [[ 0,  0,  0],
                        [ -1,  1, 0],
                        [ 0,  0,  0]]);

var dS = ee.Kernel.fixed(3, 3,
                       [[ 0,  0,  0],
                        [ 0,  1,  0],
                        [ 0,  -1,  0]]);

var dN = ee.Kernel.fixed(3, 3,
                       [[ 0,  -1,  0],
                        [ 0,  1,  0],
                        [ 0,  0,  0]]);

/***
 * f = v * c
 * 
 * dc/dt + df(c)/dx + df(c)/dy = 0
 * 
 * c(n+1, i, j) = c(n, i, j) - dt/dx * (F(n, i+1/2, j) - F(n, i-1/2, j)) - dt/dy * (F(n, i, j+1/2) - F(n, i, j-1/2))
 *
 * Riemann solver, 1st order numerical scheme for advection equation (Godunov-type)
 * 
 * FE = F(n, i+1/2, j) = dE vx * dE c, vx > 0
 * FW = F(n, i-1/2, j) = dW vx * dW c, vx < 0
 * FN = F(n, i, j+1/2) = dN vy * dN c, vy > 0
 * FS = F(n, i, j-1/2) = dS vy * dS c, vy < 0
 *  
 * e.g.: http://yyy.rsmas.miami.edu/users/miskandarani/Courses/MSC321/lectfv2d.pdf
 * 
 */
function advect(c, vx, vy, dt, dx, dy, direction) {
  var fluxE = c.convolve(dE).multiply(vx).multiply(vx.gt(0))
  var fluxW = c.convolve(dW).multiply(vx).multiply(vx.lt(0))
  var fluxN = c.convolve(dN).multiply(vy).multiply(vy.gt(0))
  var fluxS = c.convolve(dS).multiply(vy).multiply(vy.lt(0))

  var dtdx = dt.divide(dx)
  var dtdy = dt.divide(dy)
  
  var Fx = function() {
    c = c.subtract(dtdx.multiply(fluxE.subtract(fluxW)))
  }
  
  var Fy = function() {
    c = c.subtract(dtdy.multiply(fluxN.subtract(fluxS)))
  }
  
  // alternate directions for gradients, for example, as in http://hipacc.ucsc.edu/html/HIPACCLectures/lecture_hydro.pdf
  if(direction) {
    Fx()
    Fy()
  } else {
    Fy()
    Fx()
  }

  return c
}

var ds = Map.getScale()
var dt = 1

var dx = ds
var dy = ds

print('dx, dy: ', ds)

var demGradient = dem.multiply(ex).gradient().resample('bicubic')

var vx = demGradient.select(0)
var vy = demGradient.select(1)

// compute maximum velocity
var vMax = ee.List(demGradient.reduceRegion(ee.Reducer.minMax(), Map.getBounds(true), Map.getScale()).values())
  .map(function(c) { return ee.Number(c).abs() }).reduce(ee.Reducer.max())

print('Maximum velocity: ', vMax)

// estimate time step
// we use explicit finite-difference scheme, should be <= 1
// values < 1 result in numerical diffusion, we use explicit 1st order Godunov-like numerical scheme here
// C = v * dt / dx
var dt = ee.Number(dx).divide(vMax)
print('Time step: ', dt)

// switch to image
dx = ee.Image.constant(dx)
dy = ee.Image.constant(dy)
dt = ee.Image.constant(dt)

// initial conditions
//geometry = geometry.buffer(Map.getScale() * 10)
var c = ee.Image(0).float().paint(geometry, 1)

// Create a 0/1 checkerboard on a lon/lat grid: take the floor of lon and
// lat, add them together, and take the low-order bit.
var lon_lat_checks = ee.Image.pixelLonLat().multiply(150).floor().toInt()
      .reduce(ee.Reducer.sum()).bitwiseAnd(1);
var c = lon_lat_checks

var paletteSubstance = ["ffffcc","ffeda0","fed976","feb24c","fd8d3c","fc4e2a","e31a1c","bd0026","800026"].reverse().slice(1)

// solve
var N = 300
var visStep = 10
var results = ee.ImageCollection([])
for(var n=0; n<N; n++) {
  var c_next = advect(c, vx, vy, dt, dx, dy, n % 2 === 0)
  c = c_next
  
  if(n % visStep === 0) {
    var image = c.mask(c).visualize({
      min: 0, max: 1,
      palette: paletteSubstance
    })
    
    image = utils.hillshadeRGB(image, dem, 1.0, ex, azimuth, elevation, contrast, brightness, saturation)
    
    // speed-up, forct output to be coarser
    // var outputScaleFactor = 5
    // image = image
    //   .reproject(ee.Projection('EPSG:3857').atScale(Map.getScale() * outputScaleFactor))
    //   .resample('bicubic')

    results = results.merge([image])
  }
}

// show results every 10th step
var animation = require('users/gena/packages:animation') 

animation.animate(results, { 
  maxFrames: N / visStep
})
