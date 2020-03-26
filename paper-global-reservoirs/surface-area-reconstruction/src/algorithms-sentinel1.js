Algorithms.Sentinel1.detectWater = function (image, info, returnImage) {
    image = image.select(0);

    // remove bad pixel by detecting low entropy areas
    let glcm = image.multiply(10).toInt().glcmTexture({size: 4});
    let lowEntropy = glcm.select(0).lt(0.1);
    image = image.updateMask(lowEntropy);

    let K = 4.5; //3.5
    let iterations = 10;
    let method = 1;

    image = image.clip(aoi);

    image = removeSpeckleNoisePeronaMalik(image, iterations, K, method);

    let scale = image.projection().nominalScale();

    let clipEdges = false;
    let th = computeThresholdUsingOtsu(image.select(0), scale, aoi, 0.6, 2, clipEdges, true);

    // detect water by taking darker pixels
    let water = image.lt(th);

    // vectorize
    let waterVector = water.mask(water).reduceToVectors({geometry: analysisExtent, scale: errorMargin});

    // filter to overlaps met permanent water center
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

    // take the largest
    waterVector = ee.Feature(waterVector.map(function (f) {
        return f.set('area', f.geometry().area(ee.ErrorMargin(scale)))
    }).sort('area', false).first());

    water = ee.Image(0).byte().paint(waterVector, 1).rename('water')
        .max(lowEntropy.not().clip(waterVector.convexHull(ee.ErrorMargin(errorMargin)))); // fill-in smooth areas within detected water

    let mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask')
    })).product();

    function addProperties(element) {
        return element
            .set('system:time_start', image.get('system:time_start'))
            .set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
            .set('cloud_pixels', 0)
            .set('cloud_shadow_pixels', 0)
            .set('snow_pixels', 0)
            .set('water_threshold', th)
    }

    if (returnImage) {
        return addProperties(water)
    }

    waterVector = water.mask(water).reduceToVectors({geometry: analysisExtent, scale: errorMargin});

    return addProperties(ee.FeatureCollection(waterVector.copyProperties(image)))
};
;

Algorithms.Sentinel1.onLayerAdd = function (image, info) {
    image = image.select(0);

    Map.addLayer(image, {min: info.visual.min, max: info.visual.max}, 'original', false);

    // remove bad pixel by detecting low entropy areas
    let glcm = image.multiply(10).toInt().glcmTexture({size: 4}).reproject(image.projection());

    let asmBandName = ee.String(image.bandNames().get(0)).cat('_asm');

    // Homogeneity, Angular Second Moment (ASM)
    Map.addLayer(glcm.select(asmBandName), {}, 'homogeneity', false);

    let homogene = glcm.select(asmBandName).lt(0.1);
    image = image.updateMask(homogene);

    Map.addLayer(homogene.mask(homogene), {}, 'homogeneity mask', false);

    Map.addLayer(aoi, {}, 'aoi', false);

    let K = 4.5; //3.5
    let iterations = 10;
    let method = 1;

    image = image.clip(aoi);
    //.updateMask(image.select(0).gt(-24))

    image = removeSpeckleNoisePeronaMalik(image, iterations, K, method);

    Map.addLayer(image, {min: info.visual.min, max: info.visual.max}, 'smooth', false);

    let scale = image.projection().nominalScale();

    let clipEdges = false;
    //let clipEdges = true
    let th = computeThresholdUsingOtsu(image.select(0), scale, aoi, 0.6, 2, clipEdges, true);

    // detect water by taking darker pixels
    let water = image.lt(th);

    // vectorize
    let waterVector = water.mask(water).reduceToVectors({geometry: analysisExtent, scale: errorMargin});

    // filter to overlaps met permanent water center
    //waterVector = filterToIntersection(waterVector, ee.FeatureCollection([waterPermanentCenter]))
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

    // take the largest
    waterVector = ee.Feature(waterVector.map(function (f) {
        return f.set('area', f.geometry().area(ee.ErrorMargin(scale)));
    }).sort('area', false).first());

    water = ee.Image(0).byte().paint(waterVector, 1).rename('water').max(homogene.not().clip(waterVector.convexHull(ee.ErrorMargin(errorMargin)))); // fill-in smooth areas within detected water

    Map.addLayer(homogene.mask(homogene.not()), {palette: ['ffffff']}, 'smooth mask', false);

    water = water.focal_mode(scale, 'circle', 'meters', 3);

    Map.addLayer(water.mask(water), {palette: ['ffffff']}, 'water', false);

    let waterEdge = water.subtract(water.focal_min(1));

    water = ee.ImageCollection([water.mask(water).visualize({
        palette: ['5050ff'],
        opacity: 0.2
    }), waterEdge.mask(waterEdge).visualize({palette: ['ffffff'], opacity: 0.9})]).mosaic();

    Map.addLayer(water.mask(water), {}, 'water (vector)', false);

    return image
};
;
