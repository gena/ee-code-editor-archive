var Algorithms = { AsterT: {} }

var utils = require('users/gena/packages2:utils.js')
var aoi = utils.getAoi()

Algorithms.AsterT.temperatureFromDN = function (image) {
    //let bands = ['B10',  'B11',   'B12',   'B13',   'B14']
    var bands = ['temp', 'temp2', 'temp3', 'temp4', 'temp5'];
    var multiplier = ee.Image([0.006822, 0.006780, 0.006590, 0.005693, 0.005225]);
    var k1 = ee.Image([3040.136402, 2482.375199, 1935.060183, 866.468575, 641.326517]);
    var k2 = ee.Image([1735.337945, 1666.398761, 1585.420044, 1350.069147, 1271.221673]);

    var radiance = image.select(bands).subtract(1).multiply(multiplier);
    var t = k2.divide(k1.divide(radiance).add(1).log());

    return t.rename(bands);
};


Algorithms.AsterT.onLayerAdd = function (image, info) {
    var water = Algorithms.AsterT.detectWater(image.select('temp'), info);

    var waterEdge = water.subtract(water.focal_min(1));

    water = ee.ImageCollection([water.mask(water).visualize({ palette: ['5050ff'], opacity: 0.2 }), waterEdge.mask(waterEdge).visualize({ palette: ['ffffff'], opacity: 0.9 })]).mosaic();

    Map.addLayer(water.mask(water), {}, 'water', false);
};

Algorithms.AsterT.detectWater = function (image, info, returnImage) {
    image = image.clip(aoi).resample('bicubic');

    var t = image.select('temp');

    var clipEdges = false;
    //let clipEdges = true
    var th = utils.computeThresholdUsingOtsu(t, 90, aoi, 0.9, 4, clipEdges, false);

    // compute mode in the most probable center of the water and assume this value as water
    var waterPermanentCenter = analysisExtent.geometry().centroid(30).buffer(180).intersection(analysisExtent.geometry(), ee.ErrorMargin(errorMargin));

    var mode = ee.Number(ee.Dictionary(t.reduceRegion(ee.Reducer.mode(), waterPermanentCenter, errorMargin * 5)).get('temp'));

    if (debug) {
        print('Mode:', mode);
    }

    // detect water by taking mode and otsu threshold into account
    var water = ee.Algorithms.If(ee.Algorithms.IsEqual(mode, null), ee.Image().byte(), t.gt(th).multiply(mode.gt(th)).add(t.lte(th).multiply(mode.lte(th))));

    water = ee.Image(water);

    if (returnImage) {
        return water.set('system:time_start', image.get('system:time_start')).set('nodata_pixels', 0).set('cloud_pixels', 0).set('cloud_shadow_pixels', 0).set('snow_pixels', 0).set('water_threshold', th);
    }

    // vectorize
    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });

    // filter to overlaps met permanent water center
    waterVector = filterToMaximumAreaFraction(waterVector, analysisExtent);

    var snowMask = ee.Image()
    var cloudMask = ee.Image()

    return {
      waterMask: waterVector.set('system:time_start', image.get('system:time_start')).set('nodata_pixels', 0).set('cloud_pixels', 0).set('cloud_shadow_pixels', 0).set('snow_pixels', 0).set('water_threshold', th),
      snowMask: snowMask,
      cloudMask: cloudMask,
      imageMask: image.mask()
    }
    
};


exports.Algorithms = Algorithms.AsterT