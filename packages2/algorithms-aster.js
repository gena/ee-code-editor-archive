var Algorithms = { 
  Aster: {}, 
  AsterT: require('users/gena/packages2:algorithms-asterT.js').Algorithms,
  Landsat: require('users/gena/packages2:algorithms-landsat.js').Algorithms
}

var utils = require('users/gena/packages2:utils.js')
var aoi = utils.getAoi()
var cannyTh = 0.4
var cannySigma = 0.6

var maskClouds = utils.getMaskClouds()
var maskSnow = utils.getMaskSnow()

Algorithms.Aster.radianceFromDN = function (image, opt_skipBlue) {
  // Gain coefficients are dynamic (i.e. can be high, normal, low_1 or low_2)
  var multiplier = ee.Image([
    ee.Number(image.get('GAIN_COEFFICIENT_B01')).float(),
    ee.Number(image.get('GAIN_COEFFICIENT_B02')).float(),
    ee.Number(image.get('GAIN_COEFFICIENT_B3N')).float()
    ])
  
  // Apply correction
  var radiance = image.select(['green', 'red', 'nir']).subtract(1).multiply(multiplier)
  
  // Define properties required for reflectance calculation
  var timeStamp = image.get('system:time_start')
  var solar_z = ee.Number(90).subtract(image.get('SOLAR_ELEVATION'))
  
  return radiance.set({
    'timeStamp':timeStamp,
    'solar_zenith':solar_z
  })
}

Algorithms.Aster.reflectanceFromRadiance = function (rad) {
  // calculate day of year from time stamp
  var date = ee.Date(rad.get('timeStamp'));
  var jan01 = ee.Date.fromYMD(date.get('year'),1,1);
  var doy = date.difference(jan01,'day').add(1);

  // Earth-Sun distance squared (d2) 
  var d = ee.Number(doy).subtract(4).multiply(0.017202).cos().multiply(-0.01672).add(1) // http://physics.stackexchange.com/questions/177949/earth-sun-distance-on-a-given-day-of-the-year
  var d2 = d.multiply(d)  
  
  // mean exoatmospheric solar irradiance (ESUN)
  var ESUN = [1847,1553,1118]//from Thome et al (A) see http://www.pancroma.com/downloads/ASTER%20Temperature%20and%20Reflectance.pdf
  
  // cosine of solar zenith angle (cosz)
  var solar_z = ee.Number(rad.get('solar_zenith'))
  var cosz = solar_z.multiply(Math.PI).divide(180).cos()

  // calculate reflectance
  var scalarFactors = ee.Number(Math.PI).multiply(d2).divide(cosz)
  var scalarApplied = rad.multiply(scalarFactors)
  var reflectance = scalarApplied.divide(ESUN)
  
  return reflectance
}
  
/**
 * Compute a cloud score.
 */
Algorithms.Aster.cloudScore = function (img, opt_skipBlue) {
    // Compute several indicators of cloudyness and take the minimum of them.
    var score = ee.Image(1.0);

    // TODO: compute DN > reflectance and add other bands

    // Clouds are reasonably bright in all visible bands.
    score = score.min(utils.rescale(img, '(img.red + img.green)/2', [0.5, 1.0])).aside(utils.show, 'score vis');

    // Clouds are reasonably bright in all infrared bands.
    //score = score.min(utils.rescale(img, 'img.nir', [0.7, 1.0])).aside(utils.show, 'score ir')

    // Clouds are reasonably cool in temperature.
    var t = Algorithms.AsterT.temperatureFromDN(img.multiply(255));
    //score = score.min(utils.rescale(t, 'img.temp2', [300, 273.15])).aside(utils.show, 'score temp')
    score = score.min(utils.rescale(t, 'img.temp2', [293, 268])).aside(utils.show, 'score temp');

    // However, clouds are not snow.
    //let ndsi = img.normalizedDifference(['red', 'swir']);
    //score = score.min(utils.rescale(ndsi, 'img', [0.8, 0.6])).aside(utils.show, 'score ndsi')

    return score;
};

/**
 * Compute a snow score.
 */
Algorithms.Aster.snowScore = function (img, opt_bands) {
    // Compute several indicators of snowyness and take the minimum of them.
    var score = ee.Image(1.0);

    // Snow is reasonably bright in all visible bands.
    score = score.min(utils.rescale(img, 'img.red + img.green', [0.3, 0.8])).aside(utils.show, 'score vis');

    // Excluded this for snow reasonably bright in all infrared bands.
    score = score.min(utils.rescale(img, 'img.nir', [0.3, 0.7])).aside(utils.show, 'score ir');

    // Snow is reasonably cool in temperature.
    // start from 0C
    var t = Algorithms.AsterT.temperatureFromDN(img.multiply(255));
    score = score.min(utils.rescale(t, 'img.temp2', [300, 273.15])).aside(utils.show, 'score temp');

    // Snow is high in ndsi.
    // TODO: generate reflectance or at least radiance
    //Map.addLayer(img.select('red'), {}, 'red', false)
    //Map.addLayer(img.select('nir'), {}, 'nir', false)
    //let ndsi = img.normalizedDifference(['red', 'nir']);
    //Map.addLayer(ndsi, {}, 'ndsi', false)
    //score = score.min(utils.rescale(ndsi, 'img', [-1, -0.5])).aside(utils.show, 'score ndsi')

    return score;
};

Algorithms.Aster.detectClouds = function (image) {
    return image;
};

Algorithms.Aster.detectSnow = function (image) {
    return image;
};

// ASTER water detection from temperature band-only
Algorithms.Aster.detectWater = function (image, info, returnImage) {
    var radiance = Algorithms.Aster.radianceFromDN(image)
    var reflectance = Algorithms.Aster.reflectanceFromRadiance(radiance)

    image = image.unitScale(info.unitScale[0], info.unitScale[1]) // TODO: fix temperature
    .copyProperties(image)
    .set('system:time_start', image.get('system:time_start'));

    image = ee.Image(image);

    var snow = Algorithms.Aster.snowScore(image);

    var clouds = Algorithms.Aster.cloudScore(image);

    var waterScore = reflectance.resample('bicubic').normalizedDifference(['green', 'nir']);

    var cloudThreshold = 0.1;
    var snowThreshold = 0.4;
    var cloudMask = clouds.gte(cloudThreshold);
    var snowMask = snow.gte(snowThreshold);
    
    i = waterScore.clip(aoi)
    
    if(maskClouds) {
      var i = i.updateMask(cloudMask.not());
    }

    if(maskSnow) {
      var i = i.updateMask(snowMask.not());
    }

    var results = utils.computeThresholdUsingOtsu(i, 30, aoi, cannyTh, cannySigma, false, true);
    var th = results.threshold;

    var water = i.gte(ee.Image.constant(th));

    var az = ee.Number(image.get('SOLAR_AZIMUTH'));
    var zen = ee.Number(image.get('SOLAR_ELEVATION'));
    var cloudShadows = utils.projectClouds(az, zen, clouds, cloudThreshold);

    var mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask');
    })).product();

    if (returnImage) {
        return water.set('system:time_start', image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        //.set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        .set('snow_pixels', ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('water_threshold', th);
    }

    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

    return {
      waterMask: ee.FeatureCollection(waterVector.copyProperties(image)).set('system:time_start', image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('snow_pixels', ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('water_threshold', th),
      snowMask: snowMask,
      cloudMask: cloudMask,
      imageMask: mask, // image.select(0).mask(),
      edges: results.edges
    }
};

Algorithms.Aster.getCloudPixelCount = function (image, info) {
    image = image.unitScale(info.unitScale[0], info.unitScale[1]) // TODO: fix temperature
    .copyProperties(image);

    image = ee.Image(image);

    var clouds = Algorithms.Aster.cloudScore(image);

    var cloudThreshold = 0.1;
    var cloudMask = clouds.gte(cloudThreshold);

    return ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

Algorithms.Aster.getSnowPixelCount = function (image, info) {
    image = image.unitScale(info.unitScale[0], info.unitScale[1]) // TODO: fix temperature
    .copyProperties(image);

    image = ee.Image(image);

    var snow = Algorithms.Aster.snowScore(image);

    var snowThreshold = 0.4;
    var snowMask = snow.gte(snowThreshold);

    return ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

Algorithms.Aster.getNoDataPixelCount = function (image, info) {
    // TODO: check required bands only
    var mask = image.mask(); //ee.ImageCollection(image.bandNames().map(function(b) { return image.select([b]).mask().rename('mask') })).product();

    return ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

Algorithms.Aster.onLayerAdd = function (image, info) {
    var radiance = Algorithms.Aster.radianceFromDN(image)
    var reflectance = Algorithms.Aster.reflectanceFromRadiance(radiance)

    image = image.unitScale(info.unitScale[0], info.unitScale[1]) // TODO: fix temperature
    .copyProperties(image)
    .set('system:time_start', image.get('system:time_start'));

    image = ee.Image(image);

    var snow = Algorithms.Aster.snowScore(image);
    Map.addLayer(snow.mask(snow), { palette: ['000000', 'FFFF00'], min: 0, max: 1 }, 'snow score', false);

    var clouds = Algorithms.Aster.cloudScore(image);
    Map.addLayer(clouds.mask(clouds), { palette: ['000000', 'FF0000'], min: 0, max: 1 }, 'cloud score', false);

    var cloudThreshold = 0.1;
    var snowThreshold = 0.4;
    var az = ee.Number(image.get('SOLAR_AZIMUTH'));
    var zen = ee.Number(image.get('SOLAR_ELEVATION'));
    var cloudShadows = utils.projectClouds(az, zen, clouds, cloudThreshold);

    var vegetation = Algorithms.Landsat.vegetationScore(image);
    Map.addLayer(vegetation.mask(vegetation), { palette: ['000000', '00FF00'], min: 0, max: 1 }, 'vegetation score', false);

    // NDWI
    var waterScore = reflectance.resample('bicubic').normalizedDifference(['green', 'nir']);

    //var waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir']);
    //let waterScore = utils.rescale(waterScore, 'img', [-0.2, 0.35])
    //waterScore = waterScore.mask(waterScore)

    Map.addLayer(waterScore, { palette: utils.Palettes.water }, 'water score (NDWI)', false);

    Map.addLayer(cloudShadows.mask().not(), {}, 'cloud shadows mask', false);

    var cloudMask = clouds.lt(cloudThreshold)

    i = waterScore.clip(aoi)
    
    if(maskClouds) {
      var i = i.updateMask(cloudMask.not());
    }

    var results = utils.computeThresholdUsingOtsu(i, 15, aoi, cannyTh, cannySigma, false, true, -0.1);
    var th = results.threshold;

    var water = i.gte(ee.Image.constant(th));
    Map.addLayer(water.mask(water), {}, 'water mask (NDWI)', false);

    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });
    //waterVector = filterToIntersection(waterVector, analysisExtent)
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);
    
    // print('Water area (vector): ', waterVector.geometry().area(1))
    
    var area = waterVector.geometry().area(1)

    // fill
    var waterImageVis = ee.Image(ee.Algorithms.If(
      ee.Algorithms.IsEqual(area, 0),
      ee.Image(),
      utils.fillMissingWater(water, snow, clouds, water.mask(), results.edges)
    ))
      
    Map.addLayer(waterImageVis, {}, 'water filled', false)

    Map.addLayer(waterVector, { color: '5050ff' }, 'water mask', false, 0.6);
};


exports.Algorithms = Algorithms.Aster