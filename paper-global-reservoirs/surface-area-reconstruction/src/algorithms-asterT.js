Algorithms.AsterT.temperatureFromDN = function(image) {
    //let bands = ['B10',  'B11',   'B12',   'B13',   'B14']
    let bands = ['temp', 'temp2', 'temp3', 'temp4', 'temp5'];
    let multiplier = ee.Image([0.006822, 0.006780, 0.006590, 0.005693, 0.005225]);
    let k1 = ee.Image([3040.136402, 2482.375199, 1935.060183, 866.468575, 641.326517]);
    let k2 = ee.Image([1735.337945, 1666.398761, 1585.420044, 1350.069147, 1271.221673]);

    let radiance = image.select(bands).subtract(1).multiply(multiplier);
    let t = k2.divide(k1.divide(radiance).add(1).log());

    return t.rename(bands)
};

Algorithms.AsterT.onLayerAdd = function(image, info) {
    let water = Algorithms.AsterT.detectWater(image.select('temp'), info);

    let waterEdge = water.subtract(water.focal_min(1));

    water = ee.ImageCollection([
        water.mask(water).visualize({palette:['5050ff'], opacity: 0.2}),
        waterEdge.mask(waterEdge).visualize({palette:['ffffff'], opacity: 0.9})
    ]).mosaic();

    Map.addLayer(water.mask(water), {}, 'water', false)
};

Algorithms.AsterT.detectWater = function(image, info, returnImage) {
    image = image.clip(aoi).resample('bicubic');

    let t = image.select('temp');

    let clipEdges = false;
    //let clipEdges = true
    let th = computeThresholdUsingOtsu(t, 90, aoi, 0.9, 4, clipEdges, false);

    // compute mode in the most probable center of the water and assume this value as water
    let waterPermanentCenter = analysisExtent.geometry().centroid(30).buffer(180).intersection(analysisExtent.geometry(), ee.ErrorMargin(errorMargin));

    let mode = ee.Number(ee.Dictionary(t.reduceRegion(ee.Reducer.mode(),
        waterPermanentCenter, errorMargin * 5)).get('temp'));

    if(debug) {
        print('Mode:', mode)
    }

    // detect water by taking mode and otsu threshold into account
    let water = ee.Algorithms.If(ee.Algorithms.IsEqual(mode, null), ee.Image().byte(),
        t.gt(th).multiply(mode.gt(th))
            .add(t.lte(th).multiply(mode.lte(th)))
    );

    water = ee.Image(water);

    function addProperties(element) {
        return element
            .set('system:time_start', image.get('system:time_start'))
            .set('nodata_pixels', 0)
            .set('cloud_pixels', 0)
            .set('cloud_shadow_pixels', 0)
            .set('snow_pixels', 0)
            .set('water_threshold', th)

    }

    if(returnImage) {
        return addProperties(water)
    }

    // vectorize
    let waterVector = water.mask(water).reduceToVectors({geometry: analysisExtent, scale: errorMargin});

    // filter to overlaps met permanent water center
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

    return addProperties(waterVector)
};
