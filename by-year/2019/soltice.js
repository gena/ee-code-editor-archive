/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var dem = ee.Image("CPOM/CryoSat2/ANTARCTICA_DEM"),
    dem2 = ee.Image("NOAA/NGDC/ETOPO1");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var utils = require('users/gena/packages:utils')
var gl = require('users/gena/packages:gl').init()

Map.setCenter(0, 0, 5)

Map.addLayer(ee.Image(1), { palette: ['2b8cbe'] }, 'background')

var projPolar = ee.Projection('EPSG:3031')
var projWeb = ee.Projection('EPSG:3857')
var projGeo = ee.Projection('EPSG:4326')

dem = dem.select('elevation')
dem = dem
  .changeProj(projPolar, projWeb)

dem = dem2
  .resample('bicubic')
  .select('ice_surface')
  .reproject(projPolar.atScale(Map.getScale()))
  .changeProj(projPolar, projWeb)

var demMax = 4000
var demMin = 0
Map.addLayer(dem, { min: demMin, max: demMax }, 'dem')

dem = dem.clamp(demMin, demMax).unitScale(demMin, demMax)

// print(ui.Chart.image.histogram(dem, geom, Map.getScale()))
// dem = dem.blend(ee.Image.constant(0.763).clip(geom))

dem = dem.multiply(50)

function terrain(p) {
  //return gl.length(p).subtract(dem)
//  return gl.length(p.select([2])).subtract(dem)
  return p.select(2).subtract(dem)
}

function scene(p) {
  return terrain(p)
}

/***
 * Raymarching 
 * 
 * o - origin
 * r - ray
 */
function trace(o, r) {
  return terrain(o)
  
  var t = ee.Image.constant(0.0);
  
  var i = ee.List.sequence(0, 64, 1)
  
  t = i.iterate(function(i, prev) {
    prev = ee.Image(prev)
    var p = o.add(r.multiply(prev))
    var d = scene(p)
    prev = prev.add(d.multiply(0.1))
    return prev
  }, t)
  
  return ee.Image(t)
}

var EPSILON = 0.001

/**
* Using the gradient of the SDF, estimate the normal on the surface at point p.
*/
function estimateNormal(p) {
  return gl.normalize(dem.gradient().addBands(ee.Image.constant(EPSILON / 2)))
  
  var dx = scene(p.add(ee.Image.constant([EPSILON, 0, 0]))).subtract(scene(p.add(ee.Image.constant([-EPSILON, 0, 0]))))
  var dy = scene(p.add(ee.Image.constant([0, EPSILON, 0]))).subtract(scene(p.add(ee.Image.constant([0, -EPSILON, 0]))))
  var dz = scene(p.add(ee.Image.constant([0, 0, EPSILON]))).subtract(scene(p.add(ee.Image.constant([0, 0, -EPSILON]))))
  
  return gl.normalize(ee.Image([dx, dy, dz]))
}

/**
* Lighting contribution of a single point light source via Phong illumination.
* 
* The vec3 returned is the RGB color of the light's contribution.
*
* k_a: Ambient color
* k_d: Diffuse color
* k_s: Specular color
* alpha: Shininess coefficient
* p: position of point being lit
* eye: the position of the camera
* lightPos: the position of the light
* lightIntensity: color/intensity of the light
*
* See https://en.wikipedia.org/wiki/Phong_reflection_model#Description
*/
function phongContribForLight(k_d, k_s, alpha, p, eye, lightPos, lightIntensity, diffuseOnly) {  
    lightPos = lightPos.arrayProject([0]).arrayFlatten([['x', 'y', 'z']])

    var N = estimateNormal(p)
    var L = gl.normalize(lightPos.subtract(p))
    var V = gl.normalize(eye.subtract(p))
    var R = gl.normalize(gl.reflect(L.multiply(-1), N))
    
    var dotLN = gl.dot(L, N);
    var dotRV = gl.dot(R, V);

    // Light not visible from this point on the surface
    function lightNone() {
      return gl.vec3(0.0, 0.0, 0.0)
    }
    
    // Light reflection in opposite direction as viewer, apply only diffuse component
    function lightDiffuse() {
      return lightIntensity.multiply(k_d).multiply(dotLN)
    }
    
    // Phong
    function lightPhong() {
      return lightIntensity.multiply(k_d.multiply(dotLN).add(k_s.multiply(dotRV.pow(alpha))))
    }
    
    var result = lightDiffuse()
    
    if(!diffuseOnly) {
      var result = lightPhong()
    }
    
    // if(!diffuseOnly) {
    //   result = result.where(dotRV.gt(0), lightPhong())
    // }
    
    return result
}

/**
* Lighting via Phong illumination.
* 
* The vec3 returned is the RGB color of that point after lighting is applied.
* k_a: Ambient color
* k_d: Diffuse color
* k_s: Specular color
* alpha: Shininess coefficient
* p: position of point being lit
* eye: the position of the camera
*
* See https://en.wikipedia.org/wiki/Phong_reflection_model#Description
*/
function phongIllumination(k_a, k_d, k_s, alpha, p, eye, time) {
    var ambientLight = gl.vec3(1.0, 1.0, 1.0).multiply(0.2)
    var color = ambientLight.multiply(k_a)
    
    // var light1Pos = gl.vec3(time.sin().multiply(4.0), 2.0, time.cos().multiply(4.0))
    //var light1Pos = gl.vec3(time.sin().multiply(5.0), time.cos().multiply(5.0), -5)
    var f = 1000
    var light1Pos = gl.vec3(time.sin().multiply(f), time.cos().multiply(f), -0.4082 * f)
    var light1Intensity = gl.vec3(0.4, 0.4, 0.4).multiply(1.2)
    color = color.add(phongContribForLight(k_d, k_s, alpha, p, eye, light1Pos, light1Intensity))

    var light2Pos = gl.vec3(0, 0, -5)
    var light2Intensity = gl.vec3(0.2, 0.2, 0.2).multiply(3);
    color = color.add(phongContribForLight(k_d, k_s, alpha, p, eye, light2Pos, light2Intensity, true))
    
    return gl.toImage3(color)
}

/***
 * Main render function
 */
function render(time) {
  var uv = gl.fragCoord

  // make coordinates go from -1 to 1
  uv = uv.multiply(2).subtract(1)

  uv = uv.multiply(ee.Image.constant([gl.iResolution.x.divide(gl.iResolution.y), 1.0]))

  var z = -5

  var r = gl.normalize(uv.addBands(ee.Image.constant(1).rename('z')))
  var o = ee.Image([0, 0, z])
  var dist = trace(o, r)

  // The closest point on the surface to the eyepoint along the view ray
  var p = o.add(r.multiply(dist))
  
  //Map.addLayer(estimateNormal(p).select(2))
  
  // var K_a = gl.vec3(0.2, 0.2, 0.2)
  // var K_d = gl.vec3(0.7, 0.2, 0.2)
  // var K_s = gl.vec3(1.0, 1.0, 1.0)
  // var shininess = ee.Image(3.0)
  
  // var K_a = gl.vec3(0.12, 0.05, 0.21)
  // var K_d = gl.vec3(0.12, 0.15, 0.21)
  // var K_s = gl.vec3(1.0, 1.0, 1.0)
  // var shininess = ee.Image(5.0)

  var K_a = gl.vec3(0.7, 0.7, 0.7)
  var K_d = gl.vec3(0.1, 0.5, 0.8)
  var K_s = gl.vec3(1.0, 1.0, 1.0)
  var shininess = ee.Image(5.0)
  
  var color = phongIllumination(K_a, K_d, K_s, shininess, p, o, ee.Number(time))

  // var fog = ee.Image.constant(1).divide(ee.Image.constant(1.0).add(t.multiply(dist).multiply(0.1)))
  // var color = fog
 
  return color
}

// ==================================
// Map.setCenter(0, 0, 15)
// Map.setLocked(true)

var vis = { min: 0, max: 1 }

// var image = render(10)
// Map.addLayer(image, vis, 'image')

var animation = require('users/gena/packages:animation')
var tMax = Math.PI * 2
var tStep = 0.1
var images = ee.List.sequence(0, tMax, tStep).map(function(t) { return render(t) })
animation.animate(images, { vis: vis, timeStep: 50, maxFrames: Math.floor(tMax / tStep), width: '500px' })

