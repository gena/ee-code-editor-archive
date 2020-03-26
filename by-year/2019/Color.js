/***
 * Converts a given wavelength of light to an approximate RGB color value. 
 * The wavelength must be given in nanometers in the range from 380 nm through 750 nm.
 * 
 * Ported from http://www.noah.org/wiki/Wavelength_to_RGB_in_Python
 */
function wavelengthToRgb(wavelength, opt_gamma) {
  // TODO: how to make this work for ageneric ee.Image?!?
  
  var gamma = opt_gamma || 0.8
  
  var R = 0
  var G = 0
  var B = 0
  
  var attenuation = 0
  
  if(wavelength >= 380 && wavelength <= 440) {
    attenuation = 0.3 + 0.7 * (wavelength - 380) / (440 - 380)
    R = Math.pow((-(wavelength - 440) / (440 - 380)) * attenuation, gamma)
    G = 0.0
    B = Math.pow(1.0 * attenuation, gamma)
  } else if(wavelength >= 440 && wavelength <= 490) {
    R = 0.0
    G = Math.pow((wavelength - 440) / (490 - 440), gamma)
    B = 1.0
  } else if(wavelength >= 490 && wavelength <= 510) {
    R = 0.0
    G = 1.0
    B = Math.pow(-(wavelength - 510) / (510 - 490), gamma)
  } else if (wavelength >= 510 && wavelength <= 580) {
    R = Math.pow((wavelength - 510) / (580 - 510), gamma)
    G = 1.0
    B = 0.0
  } else if (wavelength >= 580 && wavelength <= 645) {
    R = 1.0
    G = Math.pow(-(wavelength - 645) / (645 - 580), gamma)
    B = 0.0
  } else if(wavelength >= 645 && wavelength <= 750) {
    attenuation = 0.3 + 0.7 * (750 - wavelength) / (750 - 645)
    R = Math.pow(1.0 * attenuation, gamma)
    G = 0.0
    B = 0.0
  } else {
    R = 0.0
    G = 0.0
    B = 0.0
  }

  return [R, G, B]
}

function wavelengthToRgbImage(opt_gamma) {
  var gamma = opt_gamma || 0.8
  
  var R = ee.Image.constant(0)
  var G = ee.Image.constant(0)
  var B = ee.Image.constant(0)
  
  function value_380_440(wavelength) {
    var attenuation = ee.Image.constant(0.3).add(ee.Image.constant(0.7).multiply(wavelength.subtract(380)).divide(440 - 380))
    
    var R = wavelength.subtract(440).multiply(-1).divide(440 - 380).multiply(attenuation).pow(gamma)
    var G = ee.Image.constant(0.0)
    var B = attenuation.pow(gamma)

    return ee.Image([R, G, B])
  }

  function value_440_490(wavelength) {
    var R = ee.Image.constant(0.0)
    var G = wavelength.subtract(440).divide(490 - 440).pow(gamma)
    var B = ee.Image.constant(1.0)

    return ee.Image([R, G, B])
  }

  function value_490_510(wavelength) {
    var R = ee.Image.constant(0.0)
    var G = ee.Image.constant(1.0)
    var B = wavelength.subtract(510).multiply(-1).divide(510 - 490).pow(gamma)

    return ee.Image([R, G, B])
  }

  function value_510_580(wavelength) {
    var R = wavelength.subtract(510).divide(580 - 510).pow(gamma)
    var G = ee.Image.constant(1.0)
    var B = ee.Image.constant(0.0)

    return ee.Image([R, G, B])
  }

  function value_580_645(wavelength) {
    var R = ee.Image.constant(1.0)
    var G = wavelength.subtract(645).multiply(-1).divide(645 - 580).pow(gamma)
    var B = ee.Image.constant(0.0)

    return ee.Image([R, G, B])
  }

  function value_645_750(wavelength) {
    var attenuation = ee.Image.constant(0.3).add(ee.Image.constant(0.7).multiply(ee.Image.constant(750).subtract(wavelength).divide(750 - 645)))
    var R = attenuation.pow(gamma)
    var G = ee.Image.constant(0.0)
    var B = ee.Image.constant(0.0)

    return ee.Image([R, G, B])
  }
  
  return function(wavelength) {
    var a2 = ee.Image.constant(0.3).add(ee.Image.constant(0.7).multiply(ee.Image.constant(750).subtract(wavelength))).divide(750 - 645)

    return ee.Image([R, G, B])
      .where(wavelength.gte(380).and(wavelength.lte(440)), value_380_440(wavelength))
      .where(wavelength.gte(440).and(wavelength.lte(490)), value_440_490(wavelength))
      .where(wavelength.gte(490).and(wavelength.lte(510)), value_490_510(wavelength))
      .where(wavelength.gte(510).and(wavelength.lte(580)), value_510_580(wavelength))
      .where(wavelength.gte(580).and(wavelength.lte(645)), value_580_645(wavelength))
      .where(wavelength.gte(645).and(wavelength.lte(750)), value_645_750(wavelength))
  }
}

var scale = ee.Image.pixelLonLat().select(0)
var bounds = Map.getBounds()
var min = bounds[0]
var max = bounds[2]
var range = max - min

scale = scale.subtract(min).divide(range)

Map.addLayer(scale, {}, 'scale')


// show RGB colors for wavelengths 380-750
var wmin = 380
var wmax = 750
// var wmin = 180
// var wmax = 1750
var wrange = wmax - wmin
var wstep = 10


var w = scale.multiply(wrange).add(wmin)
Map.addLayer(w, { min: wmin, max: wmax }, 'wavelength')

var rgb = wavelengthToRgbImage(1)(w)
Map.addLayer(rgb, {}, 'RGB')

Map.addLayer(rgb.rgbToHsv().select('hue'), { min: 0, max: 1 }, 'HUE')


/*var wavelenghts = ee.List.sequence(wmin, wmax, wstep).getInfo()

var images = ee.List(wavelenghts.map(wavelengthToRgb)).map(function(rgb) {
  return ee.Image.constant(rgb)
})

print(images)
images = ee.ImageCollection.fromImages(images)


var animation = require('users/gena/packages:animation')
animation.animate(images, { vis: { min: 0, max: 1 } })

*/