/***
 * Cloud masking algorithm for Sentinel2.
 */
Algorithms.Sentinel2.cloudScore = function (img) {
    // Compute several indicators of cloudyness and take the minimum of them.
    let score = ee.Image(1);

    // Clouds are reasonably bright in the blue and cirrus bands.
    score = score.min(rescale(img, 'img.blue', [0.1, 0.5])).aside(show, 'score blue');
    score = score.min(rescale(img, 'img.coastal', [0.1, 0.3])).aside(show, 'score coastal');
    score = score.min(rescale(img, 'img.coastal + img.cirrus', [0.15, 0.2])).aside(show, 'score cirrus');

    // Clouds are reasonably bright in all visible bands.
    score = score.min(rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8])).aside(show, 'score visible');

    // Clouds are reasonably bright in all infrared bands.
    // score = score.min(rescale(img, 'img.nir2+img.nir + img.swir + img.swir2', [0.3, 0.4]));
    // Map.addLayer(img.select('cb').add(img.select('cirrus')),{'min':0.15,'max':0.25},'cbCirrusSum')
    // Map.addLayer(img.select('cirrus'),{'min':0,'max':0.1},'cirrus')
    // score = score.min(rescale(img, 'img.cirrus', [0.06, 0.09]))

    // score = score.max(rescale(img, 'img.cb', [0.4, 0.6]))
    // score = score.min(rescale(img,'img.re1+img.re2+img.re3',[0.6,2]))
    // Map.addLayer(rescale(img,'img.re1+img.re2+img.re3',[0.6,2]),{'min':0,'max':1},'re1')
    // Clouds are reasonably cool in temperature.
    // score = score.min(rescale(img, 'img.temp', [300, 290]));

    // However, clouds are not snow.
    let ndsi = img.normalizedDifference(['red', 'swir']);
    // Map.addLayer(ndsi,{'min':0.6,'max':0.8},'ndsi')
    // score=score.min(rescale(ndsi, 'img', [0.8, 0.6]))

    return score;
};

Algorithms.Sentinel2.onLayerAdd = function (image, info) {
    image = image
        .unitScale(info.unitScale[0], info.unitScale[1])
        .copyProperties(image);

    image = ee.Image(image);

    //let snow = Landsat.snowScore(image2);
    //Map.addLayer(snow.mask(snow), {palette:['000000', 'FFFF00'], min:0, max:1}, ' snow score', false);

    let clouds = Algorithms.Sentinel2.cloudScore(image);
    Map.addLayer(clouds.mask(clouds), {palette: ['000000', 'FF0000'], min: 0, max: 1}, 'cloud score', false);

    //let vegetation = Sentinel2.vegetationScore(image2);
    //Map.addLayer(vegetation.mask(vegetation), {palette:['000000', '00FF00'], min:0, max:1}, 'vegetation score', false);

    let cloudThreshold = 0.1;
    let az = ee.Number(image.get('MEAN_SOLAR_AZIMUTH_ANGLE'));
    let zen = ee.Number(image.get('MEAN_SOLAR_ZENITH_ANGLE'));
    let cloudShadows = projectClouds(az, zen, clouds, cloudThreshold);

    // MNDWI (20m)
    let mndwi = image.normalizedDifference(['green', 'swir']);
    //waterScore = rescale(waterScore, 'img', [-0.2, 0.35])
    //waterScore = waterScore.mask(waterScore)
    Map.addLayer(mndwi, {palette: Palettes.water}, 'water score (MNDWI)', false);

    // NDWI (10m)
    let ndwi = image.resample('bicubic').normalizedDifference(['green', 'nir']);
    //let waterScore = rescale(waterScore, 'img', [-0.2, 0.35])
    //waterScore = waterScore.mask(waterScore)

    Map.addLayer(ndwi, {palette: Palettes.water}, 'water score (NDWI)', false);

    let i = ndwi
    // .updateMask(cloudShadows.mask().not().and(clouds.lt(cloudThreshold)).multiply(focusNearWater))
        .updateMask(clouds.lt(cloudThreshold))
        .clip(aoi);

    let th = computeThresholdUsingOtsu(i, 30, aoi, 0.3, 2, false, false);

    let water = i.gte(ee.Image.constant(th));
    Map.addLayer(water.mask(water), {}, 'water mask (NDWI)', false);

    let waterVector = water.mask(water).reduceToVectors({geometry: analysisExtent, scale: errorMargin});
    waterVector = filterToIntersection(waterVector, analysisExtent);

    Map.addLayer(waterVector, {color: '5050ff'}, 'water mask', false, 0.6)
};

Algorithms.Sentinel2.detectWater = function (image, info, returnImage) {
    image = image
        .unitScale(info.unitScale[0], info.unitScale[1])
        .copyProperties(image);

    image = ee.Image(image);

    let clouds = Algorithms.Sentinel2.cloudScore(image);

    let waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir']);

    let cloudThreshold = 0.1;
    let cloudMask = clouds.gte(cloudThreshold);
    let i = waterScore
        .updateMask(cloudMask.not())
        .clip(aoi);

    let th = computeThresholdUsingOtsu(i, 30, aoi, 0.3, 2, false, false);

    let water = i.gte(ee.Image.constant(th));

    let az = ee.Number(image.get('MEAN_SOLAR_AZIMUTH_ANGLE'));
    let zen = ee.Number(image.get('MEAN_SOLAR_ZENITH_ANGLE'));
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
            .set('snow_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
            .set('water_threshold', th)
    }

    if (returnImage) {
        return addProperties(water)
    }

    let waterVector = water.mask(water).reduceToVectors({geometry: analysisExtent, scale: errorMargin});
    waterVector = filterToIntersection(waterVector, analysisExtent);

    return addProperties(ee.FeatureCollection(waterVector.copyProperties(image)))
};

Algorithms.Sentinel2.getCloudPixelCount = (image, info) => {
    image = image.unitScale(info.unitScale[0], info.unitScale[1])

    let clouds = Algorithms.Sentinel2.cloudScore(image);

    let cloudThreshold = 0.1;
    let cloudMask = clouds.gte(cloudThreshold);

    return ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

Algorithms.Sentinel2.getSnowPixelCount = (image, info) => {
    return ee.Number(0);
};

Algorithms.Sentinel2.getNoDataPixelCount = (image, info) => {
    let mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask')
    })).product();
    return ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)
};
