var Algorithms = { Landsat: {} }

var utils = require('users/gena/packages2:utils.js')
var aoi = utils.getAoi()
var maskClouds = utils.getMaskClouds()
var maskSnow = utils.getMaskSnow()
var cannyTh = 0.4
var cannySigma = 0.6

/**
 * Compute a cloud score. Tuned for Landsat sensor.
 */
Algorithms.Landsat.cloudScore = function (img, opt_skipBlue) {
    // Compute several indicators of cloudyness and take the minimum of them.
    var score = ee.Image(1.0);

    // Clouds are reasonably bright in the blue band.
    score = score.min(utils.rescale(img, 'img.blue', [0.1, 0.3])).aside(utils.show, 'score blue');

    // Clouds are reasonably bright in all visible bands.
    score = score.min(utils.rescale(img, 'img.red + img.green + img.blue', [0.3, 0.8])).aside(utils.show, 'score vis');

    // Clouds are reasonably bright in all infrared bands.
    score = score.min(utils.rescale(img, 'img.nir + img.swir + img.swir2', [0.3, 0.8])).aside(utils.show, 'score ir');

    // Clouds are reasonably cool in temperature.
    score = score.min(utils.rescale(img, 'img.temp', [293, 268])).aside(utils.show, 'score temp');

    // However, clouds are not snow.
    //let ndsi = img.normalizedDifference(['red', 'swir']);
    //score = score.min(utils.rescale(ndsi, 'img', [0.2, 0.0])).aside(utils.show, 'score ndsi')

    var ndsi = img.normalizedDifference(['green', 'swir']);
    return score.min(utils.rescale(ndsi, 'img', [0.8, 0.6]));

    return score;
};

/**
 * Compute a snow score.
 */
Algorithms.Landsat.snowScore = function (img, opt_bands) {
    // Compute several indicators of snowyness and take the minimum of them.
    var score = ee.Image(1.0);

    // Snow is reasonably bright in the blue band.
    score = score.min(utils.rescale(img, 'img.blue', [0.1, 0.3])).aside(utils.show, 'score blue');

    // Snow is reasonably bright in all visible bands.
    score = score.min(utils.rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8])).aside(utils.show, 'score vis');

    // Excluded this for snow reasonably bright in all infrared bands.
    score = score.min(utils.rescale(img, 'img.nir + img.swir + img.swir2', [0.2, 0.4])).aside(utils.show, 'score ir');

    // Snow is reasonably cool in temperature.
    // start from 0C
    score = score.min(utils.rescale(img, 'img.temp', [300, 273.15])).aside(utils.show, 'score temp');

    // Snow is high in ndsi.
    var ndsi = img.normalizedDifference(['red', 'swir']);
    ndsi = utils.rescale(ndsi, 'img', [0.3, 0.5]);
    score = score.min(ndsi).aside(utils.show, 'score ndsi').aside(utils.show, 'score ndsi');

    return utils.rescale(score.clamp(0, 0.5), 'img', [0, 0.5]).toFloat();
};

Algorithms.Landsat.vegetationScore = function (i) {
    var ndvi = i.normalizedDifference(['nir', 'red']).rename('ndvi');
    return utils.rescale(ndvi, 'img.ndvi', [0.3, 0.5]);
};

Algorithms.Landsat.maskClouds = function (img) {
    var cloudThreshold = 0.5; // lower - more clouds
    return cloudScore(img).gt(Algorithms.Landsat.cloudThreshold).rename(['cloud']);
};

Algorithms.Landsat.maskSnow = function (img) {
    var snowThresh = 0.5; //Lower number masks more out (0-1)
    return snowScore(img).gt(Algorithms.Landsat.snowThresh).rename(['snow']);
    //return img.mask(img.mask().and(ss.lt(snowThresh)))
};

/***
 * Compute a water score using MNDWI and a few additional bands.
 */
Algorithms.Landsat.waterScore2 = function (img) {
    // Compute several indicators of water and take the minimum of them.
    var score = ee.Image(1.0);

    //Set up some params
    var darkBands = ['green', 'red', 'nir', 'swir2', 'swir']; //,'nir','swir','swir2'];
    var brightBand = 'blue';
    var shadowSumBands = ['nir', 'swir', 'swir2'];

    //Water tends to be dark
    var sum = img.select(shadowSumBands).reduce(ee.Reducer.sum());
    sum = utils.rescale(sum, 'img', [0.35, 0.2]).clamp(0, 1);
    score = score.min(sum);

    //It also tends to be relatively bright in the blue band
    var mean = img.select(darkBands).reduce(ee.Reducer.mean());
    var std = img.select(darkBands).reduce(ee.Reducer.stdDev());
    var z = img.select([brightBand]).subtract(std).divide(mean);
    z = utils.rescale(z, 'img', [0, 1]).clamp(0, 1);
    score = score.min(z);

    // Water is at or above freezing
    score = score.min(utils.rescale(img, 'img.temp', [273, 275]));

    // Water is nigh in ndsi
    var ndsi = img.normalizedDifference(['red', 'swir']);
    ndsi = utils.rescale(ndsi, 'img', [0.3, 0.8]);

    score = score.min(ndsi);

    return score.clamp(0, 1);
};

/***
 * Compute a water score using NDWI only
 */
Algorithms.Landsat.waterScore = function (image, bands) {
    return image.normalizedDifference(['green', 'swir']);
};

Algorithms.Landsat.onLayerAdd = function (image, info) {
    var snow = Algorithms.Landsat.snowScore(image);
    Map.addLayer(snow.mask(snow), { palette: ['000000', 'FFFF00'], min: 0, max: 1 }, ' snow score', false);

    var snowThreshold = 0.5;
    var snowMask = snow.gte(snowThreshold);

    Map.addLayer(snowMask.mask(snowMask), { palette: ['000000', 'FFFF00'], min: 0, max: 1 }, ' snow mask', false);

    var clouds = Algorithms.Landsat.cloudScore(image);
    Map.addLayer(clouds.mask(clouds.unitScale(0.15, 0.25)), { palette: ['000000', 'FF0000'], min: 0, max: 1 }, 'cloud score', false);
    
    var cloudThreshold = 0.35; 
    var cloudMask = clouds.gte(cloudThreshold)
    Map.addLayer(cloudMask.mask(cloudMask), { palette: ['000000', 'FFFF00'], min: 0, max: 1 }, ' cloud mask', false);

    var vegetation = Algorithms.Landsat.vegetationScore(image);
    Map.addLayer(vegetation.mask(vegetation), { palette: ['000000', '00FF00'], min: 0, max: 1 }, 'vegetation score', false);

    var az = ee.Number(image.get('SUN_AZIMUTH'));
    var zen = ee.Number(image.get('SUN_ELEVATION'));
    var cloudShadows = utils.projectClouds(az, zen, clouds, cloudThreshold);

    // MNDWI
    var mndwi = image.resample('bicubic').normalizedDifference(['green', 'swir']);
    //waterScore = utils.rescale(waterScore, 'img', [-0.2, 0.35])
    //waterScore = waterScore.mask(waterScore)
    Map.addLayer(mndwi, { palette: utils.Palettes.water }, 'water score (MNDWI)', false);

    // NDWI
    var ndwi = image.resample('bicubic').normalizedDifference(['green', 'nir']);
    //let waterScore = utils.rescale(waterScore, 'img', [-0.2, 0.35])
    //waterScore = waterScore.mask(waterScore)

    Map.addLayer(ndwi, { palette: utils.Palettes.water }, 'water score (NDWI)', false);
    
    var waterScore = ndwi

    //var i = waterScore
    // .updateMask(cloudShadows.mask().not().and(clouds.lt(cloudThreshold)).multiply(focusNearWater))
    //  .updateMask(cloudMask.not()).clip(added);

    i = waterScore.clip(aoi)
    
    if(maskClouds) {
      var i = i.updateMask(cloudMask.not());
    }

    if(maskSnow) {
      var i = i.updateMask(snowMask.not());
    }


    var results = utils.computeThresholdUsingOtsu(i, 30, aoi, cannyTh, cannySigma, false, true);

    print("Added")
    print(i, aoi, cannyTh, cannySigma)
    print(results)
    return

    var th = results.threshold;

    var water = i.gte(ee.Image.constant(th));


    // bias correction for LANDSAT
    water = water.focal_max(15, 'circle', 'meters');

    var mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask');
    })).product();

    Map.addLayer(water.mask(water), {}, 'water mask (NDWI)', false);

    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });
    waterVector = filterToIntersection(waterVector, analysisExtent);

    Map.addLayer(waterVector, { color: '5050ff' }, 'water mask', false, 0.6);


    // fill
    var area = waterVector.geometry().area(1)
    var waterImageVis = ee.Image(ee.Algorithms.If(
      ee.Algorithms.IsEqual(area, 0),
      ee.Image(),
      utils.fillMissingWater(water, snow, clouds, mask, results.edges)
    ))
    Map.addLayer(waterImageVis, {}, 'water filled', false)

    print(Algorithms.Landsat.detectWater(image, info));
};

Algorithms.Landsat.detectWater = function (image, info, returnImage) {
    var snow = Algorithms.Landsat.snowScore(image);
    var clouds = Algorithms.Landsat.cloudScore(image);
    var vegetation = Algorithms.Landsat.vegetationScore(image);

    var waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir']);
    //let waterScore = image.resample('bicubic').normalizedDifference(['green', 'swir'])

    var cloudThreshold = 0.35;
    var cloudMask = clouds.gte(cloudThreshold);

    var snowThreshold = 0.5;
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

    // bias correction for LANDSAT
    water = water.focal_max(15, 'circle', 'meters');

    var mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask');
    })).product();

    var az = ee.Number(image.get('SUN_AZIMUTH'));
    var zen = ee.Number(image.get('SUN_ELEVATION'));
    var cloudShadows = utils.projectClouds(az, zen, clouds, cloudThreshold);

    if (returnImage) {
        return water.set('system:time_start', image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        //.set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        .set('snow_pixels', ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('water_threshold', th);
    }

    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });
    waterVector = filterToIntersection(waterVector, analysisExtent);

    return {
      waterMask: ee.FeatureCollection(waterVector.copyProperties(image))
        .set('system:time_start', image.get('system:time_start'))
        .set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        .set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        .set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        .set('snow_pixels', ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        .set('water_threshold', th),
      snowMask: snowMask,
      cloudMask: cloudMask,
      imageMask: mask, //image.select(0).mask(),
      edges: results.edges
    }
};

Algorithms.Landsat.getCloudPixelCount = function (image, info) {
    var clouds = Algorithms.Landsat.cloudScore(image);

    var cloudThreshold = 0.2;
    var cloudMask = clouds.gte(cloudThreshold);

    return ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

Algorithms.Landsat.getSnowPixelCount = function (image, info) {
    var snow = Algorithms.Landsat.snowScore(image);

    var snowThreshold = 0.5;
    var snowMask = snow.gte(snowThreshold);

    return ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

Algorithms.Landsat.getNoDataPixelCount = function (image, info) {
    var mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask');
    })).product();
    return ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};


exports.Algorithms = Algorithms.Landsat