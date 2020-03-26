/**
 * Compute a cloud score.
 */
Algorithms.Aster.cloudScore = function (img, opt_skipBlue) {
    // Compute several indicators of cloudyness and take the minimum of them.
    let score = ee.Image(1.0);

    // TODO: compute DN > reflectance and add other bands

    // Clouds are reasonably bright in all visible bands.
    score = score.min(rescale(img, '(img.red + img.green)/2', [0.5, 1.0])).aside(show, 'score vis');

    // Clouds are reasonably bright in all infrared bands.
    //score = score.min(rescale(img, 'img.nir', [0.7, 1.0])).aside(show, 'score ir')

    // Clouds are reasonably cool in temperature.
    let t = Algorithms.AsterT.temperatureFromDN(img.multiply(255));
    //score = score.min(rescale(t, 'img.temp2', [300, 273.15])).aside(show, 'score temp')
    score = score.min(rescale(t, 'img.temp2', [293, 268])).aside(show, 'score temp');

    // However, clouds are not snow.
    //let ndsi = img.normalizedDifference(['red', 'swir']);
    //score = score.min(rescale(ndsi, 'img', [0.8, 0.6])).aside(show, 'score ndsi')

    return score;
};

/**
 * Compute a snow score.
 */
Algorithms.Aster.snowScore = function (img, opt_bands) {
    // Compute several indicators of snowyness and take the minimum of them.
    let score = ee.Image(1.0);

    // Snow is reasonably bright in all visible bands.
    score = score.min(rescale(img, 'img.red + img.green', [0.3, 0.8])).aside(show, 'score vis');

    // Excluded this for snow reasonably bright in all infrared bands.
    score = score.min(rescale(img, 'img.nir', [0.3, 0.7])).aside(show, 'score ir');

    // Snow is reasonably cool in temperature.
    // start from 0C
    let t = Algorithms.AsterT.temperatureFromDN(img.multiply(255));
    score = score.min(rescale(t, 'img.temp2', [300, 273.15])).aside(show, 'score temp');

    // Snow is high in ndsi.
    // TODO: generate reflectance or at least radiance
    //Map.addLayer(img.select('red'), {}, 'red', false)
    //Map.addLayer(img.select('nir'), {}, 'nir', false)
    //let ndsi = img.normalizedDifference(['red', 'nir']);
    //Map.addLayer(ndsi, {}, 'ndsi', false)
    //score = score.min(rescale(ndsi, 'img', [-1, -0.5])).aside(show, 'score ndsi')

    return score
};

Algorithms.Aster.detectClouds = function (image) {
    return image
};

Algorithms.Aster.detectSnow = function (image) {
    return image
};

// ASTER water detection from temperature band-only
Algorithms.Aster.detectWater = function (image, info, returnImage) {
    image = image
        .unitScale(info.unitScale[0], info.unitScale[1]) // TODO: fix temperature
        .copyProperties(image);

    image = ee.Image(image);

    let snow = Algorithms.Aster.snowScore(image);

    let clouds = Algorithms.Aster.cloudScore(image);

    let waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir']);

    let cloudThreshold = 0.1;
    let snowThreshold = 0.4;
    let cloudMask = clouds.gte(cloudThreshold);
    let snowMask = snow.gte(snowThreshold);
    let i = waterScore
        .updateMask(cloudMask.not().and(snowMask.not()))
        .clip(aoi);

    let th = computeThresholdUsingOtsu(i, 30, aoi, 0.3, 1, true, false);

    let water = i.gte(ee.Image.constant(th));

    let az = ee.Number(image.get('SOLAR_AZIMUTH'));
    let zen = ee.Number(image.get('SOLAR_ELEVATION'));
    let cloudShadows = projectClouds(az, zen, clouds, cloudThreshold);

    let mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask')
    })).product();

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
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

    return addProperties(ee.FeatureCollection(waterVector.copyProperties(image)))
};

Algorithms.Aster.getCloudPixelCount = (image, info) => {
    image = image
        .unitScale(info.unitScale[0], info.unitScale[1]) // TODO: fix temperature
        .copyProperties(image);

    image = ee.Image(image);

    let clouds = Algorithms.Aster.cloudScore(image);

    let cloudThreshold = 0.1;
    let cloudMask = clouds.gte(cloudThreshold);

    return ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

Algorithms.Aster.getSnowPixelCount = (image, info) => {
    image = image
        .unitScale(info.unitScale[0], info.unitScale[1]) // TODO: fix temperature
        .copyProperties(image);

    image = ee.Image(image);

    let snow = Algorithms.Aster.snowScore(image);

    let snowThreshold = 0.4;
    let snowMask = snow.gte(snowThreshold);

    return ee.Dictionary(snowMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

Algorithms.Aster.getNoDataPixelCount = (image, info) => {
    // TODO: check required bands only
    let mask = image.mask();//ee.ImageCollection(image.bandNames().map(function(b) { return image.select([b]).mask().rename('mask') })).product();

    return ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)
};

Algorithms.Aster.onLayerAdd = function (image, info) {
    image = image
        .unitScale(info.unitScale[0], info.unitScale[1]) // TODO: fix temperature
        .copyProperties(image);

    image = ee.Image(image);

    let snow = Algorithms.Aster.snowScore(image);
    Map.addLayer(snow.mask(snow), {palette: ['000000', 'FFFF00'], min: 0, max: 1}, 'snow score', false);

    let clouds = Algorithms.Aster.cloudScore(image);
    Map.addLayer(clouds.mask(clouds), {palette: ['000000', 'FF0000'], min: 0, max: 1}, 'cloud score', false);

    let cloudThreshold = 0.1;
    let snowThreshold = 0.4;
    let az = ee.Number(image.get('SOLAR_AZIMUTH'));
    let zen = ee.Number(image.get('SOLAR_ELEVATION'));
    let cloudShadows = projectClouds(az, zen, clouds, cloudThreshold);

    let vegetation = Algorithms.Landsat.vegetationScore(image);
    Map.addLayer(vegetation.mask(vegetation), {
        palette: ['000000', '00FF00'],
        min: 0,
        max: 1
    }, 'vegetation score', false);

    // NDWI
    let waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir']);
    //let waterScore = rescale(waterScore, 'img', [-0.2, 0.35])
    //waterScore = waterScore.mask(waterScore)

    Map.addLayer(waterScore, {palette: Palettes.water}, 'water score (NDWI)', false);

    Map.addLayer(cloudShadows.mask().not(), {}, 'cloud shadows mask', false);

    let i = waterScore
    //.updateMask(cloudShadows.mask().not().and(clouds.lt(cloudThreshold)).multiply(focusNearWater))
        .updateMask(clouds.lt(cloudThreshold))
        .clip(aoi);

    let th = computeThresholdUsingOtsu(i, 15, aoi, 0.3, 1, true, false, -0.1);

    let water = i.gte(ee.Image.constant(th));
    Map.addLayer(water.mask(water), {}, 'water mask (NDWI)', false);

    let waterVector = water.mask(water).reduceToVectors({geometry: analysisExtent, scale: errorMargin});
    //waterVector = filterToIntersection(waterVector, analysisExtent)
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

    Map.addLayer(waterVector, {color: '5050ff'}, 'water mask', false, 0.6)
};

