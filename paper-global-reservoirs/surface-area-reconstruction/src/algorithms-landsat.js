/**
 * Compute a cloud score. Tuned for Landsat sensor.
 */
Algorithms.Landsat.cloudScore = function (img, opt_skipBlue) {
    // Compute several indicators of cloudyness and take the minimum of them.
    let score = ee.Image(1.0);

    // Clouds are reasonably bright in the blue band.
    score = score.min(rescale(img, 'img.blue', [0.1, 0.3])).aside(show, 'score blue');

    // Clouds are reasonably bright in all visible bands.
    score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.3, 0.8])).aside(show, 'score vis');

    // Clouds are reasonably bright in all infrared bands.
    score = score.min(rescale(img, 'img.nir + img.swir + img.swir2', [0.3, 0.8])).aside(show, 'score ir');

    // Clouds are reasonably cool in temperature.
    score = score.min(rescale(img, 'img.temp', [293, 268])).aside(show, 'score temp');

    // However, clouds are not snow.
    //let ndsi = img.normalizedDifference(['red', 'swir']);
    //score = score.min(rescale(ndsi, 'img', [0.2, 0.0])).aside(show, 'score ndsi')

    let ndsi = img.normalizedDifference(['green', 'swir']);
    return score.min(rescale(ndsi, 'img', [0.8, 0.6]));

    return score;
};

/**
 * Compute a snow score.
 */
Algorithms.Landsat.snowScore = function (img, opt_bands) {
    // Compute several indicators of snowyness and take the minimum of them.
    let score = ee.Image(1.0);

    // Snow is reasonably bright in the blue band.
    score = score.min(rescale(img, 'img.blue', [0.1, 0.3])).aside(show, 'score blue');

    // Snow is reasonably bright in all visible bands.
    score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8])).aside(show, 'score vis');

    // Excluded this for snow reasonably bright in all infrared bands.
    score = score.min(rescale(img, 'img.nir + img.swir + img.swir2', [0.2, 0.4])).aside(show, 'score ir');

    // Snow is reasonably cool in temperature.
    // start from 0C
    score = score.min(rescale(img, 'img.temp', [300, 273.15])).aside(show, 'score temp');

    // Snow is high in ndsi.
    let ndsi = img.normalizedDifference(['red', 'swir']);
    ndsi = rescale(ndsi, 'img', [0.3, 0.5]);
    score = score.min(ndsi).aside(show, 'score ndsi').aside(show, 'score ndsi');

    return rescale(score.clamp(0, 0.5), 'img', [0, 0.5]).toFloat()
};

Algorithms.Landsat.vegetationScore = function (i) {
    let ndvi = i.normalizedDifference(['nir', 'red']).rename('ndvi');
    return rescale(ndvi, 'img.ndvi', [0.3, 0.5])
};

Algorithms.Landsat.maskClouds = function (img) {
    let cloudThreshold = 0.5; // lower - more clouds
    return cloudScore(img).gt(Algorithms.Landsat.cloudThreshold).rename(['cloud'])
};

Algorithms.Landsat.maskSnow = function (img) {
    let snowThresh = 0.5; //Lower number masks more out (0-1)
    return snowScore(img).gt(Algorithms.Landsat.snowThresh).rename(['snow']);
    //return img.mask(img.mask().and(ss.lt(snowThresh)))
};

/***
 * Compute a water score using MNDWI and a few additional bands.
 */
Algorithms.Landsat.waterScore2 = function (img) {
    // Compute several indicators of water and take the minimum of them.
    let score = ee.Image(1.0);

    //Set up some params
    let darkBands = ['green', 'red', 'nir', 'swir2', 'swir'];//,'nir','swir','swir2'];
    let brightBand = 'blue';
    let shadowSumBands = ['nir', 'swir', 'swir2'];

    //Water tends to be dark
    let sum = img.select(shadowSumBands).reduce(ee.Reducer.sum());
    sum = rescale(sum, 'img', [0.35, 0.2]).clamp(0, 1);
    score = score.min(sum);

    //It also tends to be relatively bright in the blue band
    let mean = img.select(darkBands).reduce(ee.Reducer.mean());
    let std = img.select(darkBands).reduce(ee.Reducer.stdDev());
    let z = (img.select([brightBand]).subtract(std)).divide(mean);
    z = rescale(z, 'img', [0, 1]).clamp(0, 1);
    score = score.min(z);

    // Water is at or above freezing
    score = score.min(rescale(img, 'img.temp', [273, 275]));

    // Water is nigh in ndsi
    let ndsi = img.normalizedDifference(['red', 'swir']);
    ndsi = rescale(ndsi, 'img', [0.3, 0.8]);

    score = score.min(ndsi);

    return score.clamp(0, 1)
};

/***
 * Compute a water score using NDWI only
 */
Algorithms.Landsat.waterScore = function (image, bands) {
    return image.normalizedDifference(['green', 'swir'])
};

Algorithms.Landsat.onLayerAdd = function (image, info) {
    let snow = Algorithms.Landsat.snowScore(image);
    Map.addLayer(snow.mask(snow), {palette: ['000000', 'FFFF00'], min: 0, max: 1}, ' snow score', false);

    let clouds = Algorithms.Landsat.cloudScore(image);
    Map.addLayer(clouds.mask(clouds.unitScale(0.15, 0.25)), {
        palette: ['000000', 'FF0000'],
        min: 0,
        max: 1
    }, 'cloud score', false);

    let vegetation = Algorithms.Landsat.vegetationScore(image);
    Map.addLayer(vegetation.mask(vegetation), {
        palette: ['000000', '00FF00'],
        min: 0,
        max: 1
    }, 'vegetation score', false);

    let cloudThreshold = 0.35;
    let az = ee.Number(image.get('SUN_AZIMUTH'));
    let zen = ee.Number(image.get('SUN_ELEVATION'));
    let cloudShadows = projectClouds(az, zen, clouds, cloudThreshold);

    // MNDWI
    let mndwi = image.resample('bicubic').normalizedDifference(['green', 'swir']);
    //waterScore = rescale(waterScore, 'img', [-0.2, 0.35])
    //waterScore = waterScore.mask(waterScore)
    Map.addLayer(mndwi, {palette: Palettes.water}, 'water score (MNDWI)', false);

    // NDWI
    let ndwi = image.resample('bicubic').normalizedDifference(['green', 'nir']);
    //let waterScore = rescale(waterScore, 'img', [-0.2, 0.35])
    //waterScore = waterScore.mask(waterScore)

    Map.addLayer(ndwi, {palette: Palettes.water}, 'water score (NDWI)', false);

    let i = mndwi
    // .updateMask(cloudShadows.mask().not().and(clouds.lt(cloudThreshold)).multiply(focusNearWater))
        .updateMask(clouds.lt(cloudThreshold))
        .clip(aoi);

    let th = computeThresholdUsingOtsu(i, 30, aoi, 0.3, 2, false, false);

    let water = i.gte(ee.Image.constant(th));
    Map.addLayer(water.mask(water), {}, 'water mask (NDWI)', false);

    let waterVector = water.mask(water).reduceToVectors({geometry: analysisExtent, scale: errorMargin});
    waterVector = filterToIntersection(waterVector, analysisExtent);

    Map.addLayer(waterVector, {color: '5050ff'}, 'water mask', false, 0.6);

    print(Algorithms.Landsat.detectWater(image, info))
};

Algorithms.Landsat.detectWater = function (image, info, returnImage) {
    let snow = Algorithms.Landsat.snowScore(image);
    let clouds = Algorithms.Landsat.cloudScore(image);
    let vegetation = Algorithms.Landsat.vegetationScore(image);

    let waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir']);
    //let waterScore = image.resample('bicubic').normalizedDifference(['green', 'swir'])

    let cloudThreshold = 0.2;
    let snowThreshold = 0.5;
    let cloudMask = clouds.gte(cloudThreshold);
    let snowMask = snow.gte(snowThreshold);

    let i = waterScore
        .updateMask(cloudMask.not().and(snowMask.not()))
        .clip(aoi);

    let th = computeThresholdUsingOtsu(i, 30, aoi, 0.3, 2, false, false);

    let water = i.gte(ee.Image.constant(th));

    water = water.focal_max(15, 'circle', 'meters');

    let mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask')
    })).product();

    let az = ee.Number(image.get('SUN_AZIMUTH'));
    let zen = ee.Number(image.get('SUN_ELEVATION'));
    let cloudShadows = projectClouds(az, zen, clouds, cloudThreshold);

    function addProperties(element) {
        return element
            .set('system:time_start', image.get('system:time_start'))
            .set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
            .set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
            //.set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
            .set('snow_pixels', ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
            .set('water_threshold', th)
    }

    if (returnImage) {
        return addProperties(water);
    }

    let waterVector = water.mask(water).reduceToVectors({geometry: analysisExtent, scale: errorMargin});
    waterVector = filterToIntersection(waterVector, analysisExtent);

    return addProperties(ee.FeatureCollection(waterVector.copyProperties(image)))
};

Algorithms.Landsat.getCloudPixelCount = (image, info) => {
    let clouds = Algorithms.Landsat.cloudScore(image);

    let cloudThreshold = 0.2;
    let cloudMask = clouds.gte(cloudThreshold);

    return ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

Algorithms.Landsat.getSnowPixelCount = (image, info) => {
    let snow = Algorithms.Landsat.snowScore(image);

    let snowThreshold = 0.5;
    let snowMask = snow.gte(snowThreshold);

    return ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

Algorithms.Landsat.getNoDataPixelCount = (image, info) => {
    let mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask')
    })).product();
    return ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)
};
