var Algorithms = { Sentinel1: {} }

var utils = require('users/gena/packages2:utils.js')
var aoi = utils.getAoi()

Algorithms.Sentinel1.detectWater = function (image, info, returnImage) {
    image = image.select(0);
    
    image = image.updateMask(image.mask().focal_min(60, 'square', 'meters'))

    var entropy = image.multiply(10).int()
      .entropy(ee.Kernel.square(3));
    var lowEntropy = entropy.lt(0.05)
      .focal_min(90, 'circle', 'meters',1)
      .focal_max(90, 'circle', 'meters',4)
      //.reproject(image.projection().scale(3,3));

    image = image.updateMask(lowEntropy.not());

    var K = 50; //3.5
    var iterations = 10;
    var method = 2;

    image = image.clip(aoi);
    //.updateMask(image.select(0).gt(-24))

    image = utils.removeSpeckleNoisePeronaMalik(image, iterations, K, method);

    var scale = image.projection().nominalScale();

    //var clipEdges = false;
    var clipEdges = true
    var results = utils.computeThresholdUsingOtsu(image.select(0), scale, aoi, 0.6, 2, clipEdges, true, null, true);
    var th = results.threshold;

    // detect water by taking darker pixels
    // hack :(, TODO: parametrize Otsu function to get min/max
    var water = ee.Image(ee.Algorithms.If(th.eq(0.3), image.lt(-20), image.lt(th)));

    // vectorize
    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });

    // filter to overlaps met permanent water center
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

    var mask = image.mask()


    // take the largest
    var features = ee.FeatureCollection(waterVector.map(function (f) {
        return f.set('area', f.geometry().area(ee.ErrorMargin(scale)));
    }).sort('area', false))

    function toVector() {
        var waterVector = features.limit(1)

        water = ee.Image(0).byte().paint(waterVector, 1).rename('water')
          //.max(lowEntropy.clip(waterVector.convexHull(ee.ErrorMargin(errorMargin)))); // fill-in smooth areas within detected water
    
        waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });
        
        return waterVector
    }

    waterVector = ee.FeatureCollection(ee.Algorithms.If(ee.Algorithms.IsEqual(features.size(), 0),
      ee.FeatureCollection([]),
      toVector()
      ));
      
    return {
      waterMask: ee.FeatureCollection(waterVector.copyProperties(image)).set('system:time_start', 
        image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(water.mask().not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('cloud_pixels', 0).set('cloud_shadow_pixels', 0).set('snow_pixels', 0).set('water_threshold', th),
      snowMask: ee.Image(),
      cloudMask: ee.Image(),
      imageMask: image.mask(),
      edges: results.edges
    }
}

Algorithms.Sentinel1.onLayerAdd = function (image, info) {
    image = image.select(0);

    Map.addLayer(image, { min: info.visual.min, max: info.visual.max }, 'original', false);

/*    var glcm = image.multiply(10).toInt().glcmTexture({ size: 4 }).reproject(image.projection());
*/
    // remove bad pixel by detecting low entropy areas

    //Map.addLayer(entropy, {}, 'entropy', false);

    Map.addLayer(
        image.reduceNeighborhood(ee.Reducer.stdDev(), ee.Kernel.square(4))
        .lt(1)
        , {}, 'stdev', false);


    var entropy = image.multiply(10).int()
      .entropy(ee.Kernel.square(3));
    
    var lowEntropy = entropy.lt(0.05)
      .focal_min(90, 'square', 'meters',1)
      .focal_max(90, 'square', 'meters',4)
      //.reproject(image.projection().scale(3,3))

    image = image.updateMask(lowEntropy.not());

    Map.addLayer(entropy, {}, 'entropy', false);
    Map.addLayer(lowEntropy.mask(lowEntropy), {}, 'low entropy mask', false);

    Map.addLayer(aoi, {}, 'aoi', false);

    var K = 50; //3.5
    var iterations = 10;
    var method = 2;

    image = image.clip(aoi);
    //.updateMask(image.select(0).gt(-24))

    image = utils.removeSpeckleNoisePeronaMalik(image, iterations, K, method);

    Map.addLayer(image, { min: info.visual.min, max: info.visual.max }, 'smooth', false);

    var scale = image.projection().nominalScale();

    //var clipEdges = false;
    var clipEdges = true
    var results = utils.computeThresholdUsingOtsu(image, scale, aoi, 0.6, 2, clipEdges, true, null, true);
    var th = results.threshold;

    // detect water by taking darker pixels
    //var water = image.lt(th);

    // hack :(, TODO: parametrize Otsu function to get min/max
    var water = ee.Image(ee.Algorithms.If(th.eq(0.3), image.lt(-20), image.lt(th)));

    // vectorize
    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });


    // filter to overlaps met permanent water center
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

    var mask = image.mask()

    // take the largest
    var features = ee.FeatureCollection(waterVector.map(function (f) {
        return f.set('area', f.geometry().area(ee.ErrorMargin(scale)));
    }).sort('area', false))

    function toVector() {
        var waterVector = ee.Feature(features.first())

        water = ee.Image(0).byte().paint(waterVector, 1).rename('water')
          //.max(lowEntropy.clip(waterVector.convexHull(ee.ErrorMargin(errorMargin)))); // fill-in smooth areas within detected water
    
        waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });
        
        return waterVector
    }

    waterVector = ee.FeatureCollection(ee.Algorithms.If(ee.Algorithms.IsEqual(features.size(), 0),
      ee.FeatureCollection([]),
      toVector()
      ));

    print('Water vector: ', waterVector)

    var waterImage = ee.Image(0).byte().paint(waterVector, 1)
    //waterImage = waterImage.updateMask(water.mask())
    
    // fill
    var area = waterVector.geometry().area(1)
    var waterImageVis = ee.Image(ee.Algorithms.If(
      ee.Algorithms.IsEqual(area, 0),
      ee.Image(),
      utils.fillMissingWater(waterImage, ee.Image(), ee.Image(), image.mask(), results.edges)
    ))


    Map.addLayer(waterImageVis, {}, 'water filled', false)


/*    return {
      waterMask: ee.FeatureCollection(waterVector.copyProperties(image)).set('system:time_start', 
        image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(water.mask().not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('cloud_pixels', 0).set('cloud_shadow_pixels', 0).set('snow_pixels', 0).set('water_threshold', th),
      snowMask: ee.Image(),
      cloudMask: ee.Image(),
      imageMask: water.mask(),
      edges: results.edges
    }
*/
    return image;

/*
    // detect water by taking darker pixels
    var water = image.lt(th);
    
    // vectorize
    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });

    // filter to overlaps met permanent water center
    //waterVector = filterToIntersection(waterVector, ee.FeatureCollection([waterPermanentCenter]))
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

    // take the largest
    waterVector = ee.Feature(waterVector.map(function (f) {
        return f.set('area', f.geometry().area(ee.ErrorMargin(scale)));
    }).sort('area', false).first());

    water = ee.Image(0).byte().paint(waterVector, 1).rename('water')
      .max(lowEntropy.clip(waterVector.convexHull(ee.ErrorMargin(errorMargin)))); // fill-in smooth areas within detected water

    //water = water.focal_mode(scale, 'circle', 'meters', 3);

    Map.addLayer(water.mask(water), { palette: ['ffffff'] }, 'water', false);

    var waterEdge = water.subtract(water.focal_min(1));

    // fill
    var waterImageVis = fillMissingWater(water, ee.Image(), ee.Image(), water.mask(), results.edges)
    Map.addLayer(waterImageVis, {}, 'water filled', false)

    water = ee.ImageCollection([water.mask(water).visualize({ palette: ['5050ff'], opacity: 0.2 }), waterEdge.mask(waterEdge).visualize({ palette: ['ffffff'], opacity: 0.9 })]).mosaic();
    Map.addLayer(water.mask(water), {}, 'water (vector)', false);


    return image;
*/    
}

exports.Algorithms = Algorithms.Sentinel1
