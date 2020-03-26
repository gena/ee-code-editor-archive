/***
 * Aster TOA reflectance and temperature from DN. This example is for the ASTER VNIR subsystem (i.e. bands 1,2,3N)
 * 
 * Algorithm: 
 *  http://www.pancroma.com/downloads/ASTER%20Temperature%20and%20Reflectance.pdf
 *  https://lpdaac.usgs.gov/sites/default/files/public/product_documentation/aster_l1t_users_guide.pdf
 * 
 * Authors: 
 *  Gennadii Donchyts (GD), gennadiy.donchyts@gmail.com
 *  Sam Murphy (SM), samsammurphy@gmail.com - DN > TOA
 * 
 * Changelog:
 *  GD 2016-06: DN > temperature
 *  SM 2016-06: DN > TOA
 *  GD 2017-06: added swir1
 * 
 * License: MIT, https://opensource.org/licenses/MIT
 */

/***
 * Rescales to given ranges
 */
var rescale = function(img, exp, thresholds) {
  return img.expression(exp, {img: img}).subtract(thresholds[0]).divide(thresholds[1] - thresholds[0]);
};

/*** 
 * Aster radiometric correction algorithms
 */
var Aster = {
  radiance: {
    fromDN: function(image) {
      // Gain coefficients are dynamic (i.e. can be high, normal, low_1 or low_2)
      var multiplier = ee.Image([
        ee.Number(image.get('GAIN_COEFFICIENT_B01')).float(),
        ee.Number(image.get('GAIN_COEFFICIENT_B02')).float(),
        ee.Number(image.get('GAIN_COEFFICIENT_B3N')).float(),
        ee.Number(image.get('GAIN_COEFFICIENT_B04')).float()
        ])
      
      // Apply correction
      var radiance = image.select(['B01', 'B02', 'B3N', 'B04'], ['green','red','nir','swir1'])
        .subtract(1).multiply(multiplier)
      
      // Define properties required for reflectance calculation
      var solar_z = ee.Number(90).subtract(image.get('SOLAR_ELEVATION'))
      
      return radiance.set({
        'system:time_start': image.get('system:time_start'),
        'solar_zenith':solar_z
      })
    }
  },
  
  reflectance: {
    fromRad: function(rad) {
      // calculate day of year from time stamp
      var date = ee.Date(rad.get('system:time_start'));
      var jan01 = ee.Date.fromYMD(date.get('year'),1,1);
      var doy = date.difference(jan01,'day').add(1);

      // Earth-Sun distance squared (d2) 
      var d = ee.Number(doy).subtract(4).multiply(0.017202).cos().multiply(-0.01672).add(1) // http://physics.stackexchange.com/questions/177949/earth-sun-distance-on-a-given-day-of-the-year
      var d2 = d.multiply(d)  
      
      // mean exoatmospheric solar irradiance (ESUN)
      var ESUN = [1847, 1553, 1118, 232.5] // from Thome et al (A) see http://www.pancroma.com/downloads/ASTER%20Temperature%20and%20Reflectance.pdf
      
      // cosine of solar zenith angle (cosz)
      var solar_z = ee.Number(rad.get('solar_zenith'))
      var cosz = solar_z.multiply(Math.PI).divide(180).cos()

      // calculate reflectance
      var scalarFactors = ee.Number(Math.PI).multiply(d2).divide(cosz)
      var scalarApplied = rad.multiply(scalarFactors)
      var reflectance = scalarApplied.divide(ESUN)
      
      return reflectance
    }
  },
  
  temperature: {
    fromDN: function(image) {
      var bands = ['B10', 'B11', 'B12', 'B13', 'B14']
      var multiplier = ee.Image([0.006822, 0.006780, 0.006590, 0.005693, 0.005225])
      var k1 = ee.Image([3040.136402, 2482.375199, 1935.060183, 866.468575, 641.326517])
      var k2 = ee.Image([1735.337945, 1666.398761, 1585.420044, 1350.069147, 1271.221673])
  
      var radiance = image.select(bands).subtract(1).multiply(multiplier)
      var t = k2.divide(k1.divide(radiance).add(1).log()).rename(bands)
      
      return t
    }
  },
  
  cloudScore: function(image) {
    // Compute several indicators of cloudyness and take the minimum of them.
    var score = ee.Image(1.0);

    // Snow is reasonably bright in all visible bands.
    score = score.min(rescale(image, 'img.red + img.green', [0.2, 0.8]))

    // Excluded this for snow reasonably bright in all infrared bands.
    score = score.min(rescale(image, 'img.nir + img.swir1', [0.2, 0.4]))

    // Clouds are reasonably cool in temperature.
    score = score.min(rescale(image.resample('bicubic'), '(img.B10 + img.B12 + img.B14) / 3.0', [293, 280]))

    // However, clouds are not snow.
    //let ndsi = img.normalizedDifference(['red', 'swir']);
    //score = score.min(rescale(ndsi, 'img', [0.8, 0.6])).aside(show, 'score ndsi')

    return score;
  },
  
  TOA: function(image) {
    var radiance = Aster.radiance.fromDN(image)
    var reflectance = Aster.reflectance.fromRad(radiance)
    var temperature = Aster.temperature.fromDN(image)

    var result = reflectance.addBands(temperature)
    result = result.set('system:time_start', image.get('system:time_start'))
    result = result.copyProperties(image)
    result = ee.Image(result)
    
    return result
  }
}


// ========EXAMPLE

var pt = ee.Geometry.Point(-157.816222, 21.297481)

// ASTER image collection with VNIR filter
var aster = ee.ImageCollection('ASTER/AST_L1T_003')
  .filterBounds(pt)
  .filterDate('2001-05-01', '2004-08-31')
  .filter(ee.Filter.and(
      ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B01'),
      ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B02'),
      ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B3N')
      ))
      
Map.centerObject(pt, 13)

var bounds = ee.Geometry(Map.getBounds(true))
var scale = Map.getScale()

var image = ee.Image(aster.first())

// radiance
var imageRAD = Aster.radiance.fromDN(image)
print(ui.Chart.image.histogram(imageRAD.select(0,1,2), bounds, scale, 100))
Map.addLayer(imageRAD.select(['swir1','nir','green']), {min:0, max:144}, 'radiance (swir1, nir, green)')

// reflectance
var imageTOA = Aster.TOA(image)
print(ui.Chart.image.histogram(imageTOA.select(0,1,2), bounds, scale, 100))
Map.addLayer(imageTOA.select(['swir1','nir','green']), {min:0, max:0.4}, 'reflectance (swir1, nir, green)')

// temperature
var temperaturePalette = ['0571b0', '92c5de', 'f7f7f7', 'f4a582', 'ca0020']
var temperature = imageTOA.select('B11')
print(ui.Chart.image.histogram(temperature, bounds, scale, 100))
Map.addLayer(temperature, {
  min: 273.15 - 20, max: 273.15 + 45, 
  palette: temperaturePalette
}, 'temperature', false)

// cloud score
var cloudScore = Aster.cloudScore(imageTOA)
Map.addLayer(cloudScore.mask(cloudScore), {min:0, max:0.5, palette: ['000000', 'ffff00']}, 'cloud score')

var cloudEdge =ee.Algorithms.CannyEdgeDetector(cloudScore.where(cloudScore.lt(0.05), 0.05), 0.5, 0.5)
Map.addLayer(cloudEdge.mask(cloudEdge), {palette: ['ff0000']}, 'cloud score edge')

