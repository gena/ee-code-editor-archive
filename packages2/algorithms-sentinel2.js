var Algorithms = { Sentinel2: {} }

var utils = require('users/gena/packages2:utils.js')
var aoi = utils.getAoi()
var maskClouds = utils.getMaskClouds()
var cannyTh = 0.4
var cannySigma = 0.6


/***
 * Cloud masking algorithm for Sentinel2.
 */
Algorithms.Sentinel2.cloudScore = function (img) {
    // Compute several indicators of cloudyness and take the minimum of them.
    var score = ee.Image(1);

    // Clouds are reasonably bright in the blue and cirrus bands.
    score = score.min(utils.rescale(img, 'img.blue', [0.1, 0.5])).aside(utils.show, 'score blue');
    score = score.min(utils.rescale(img, 'img.coastal', [0.1, 0.3])).aside(utils.show, 'score coastal');
    score = score.min(utils.rescale(img, 'img.coastal + img.cirrus', [0.15, 0.2])).aside(utils.show, 'score cirrus');

    // Clouds are reasonably bright in all visible bands.
    score = score.min(utils.rescale(img, 'img.red + img.green + img.blue', [0.2, 0.8])).aside(utils.show, 'score visible');

    // Clouds are reasonably bright in all infrared bands.
    // score = score.min(utils.rescale(img, 'img.nir2+img.nir + img.swir + img.swir2', [0.3, 0.4]));
    // Map.addLayer(img.select('cb').add(img.select('cirrus')),{'min':0.15,'max':0.25},'cbCirrusSum')
    //Map.addLayer(img.select('nir'),{'min':0,'max':0.1},'nir')
    // score = score.min(utils.rescale(img, 'img.cirrus', [0.06, 0.09]))

    // score = score.max(utils.rescale(img, 'img.cb', [0.4, 0.6]))
    // score = score.min(utils.rescale(img,'img.re1+img.re2+img.re3',[0.6,2]))
    // Map.addLayer(utils.rescale(img,'img.re1+img.re2+img.re3',[0.6,2]),{'min':0,'max':1},'re1')
    // Clouds are reasonably cool in temperature.
    // score = score.min(utils.rescale(img, 'img.temp', [300, 290]));

    // However, clouds are not snow.
    var ndsi = img.normalizedDifference(['red', 'swir']);
    // Map.addLayer(ndsi,{'min':0.6,'max':0.8},'ndsi')
    // score=score.min(utils.rescale(ndsi, 'img', [0.8, 0.6]))

    return score;
};

Algorithms.Sentinel2.onLayerAdd = function (image, info) {
    image = image.unitScale(info.unitScale[0], info.unitScale[1]).copyProperties(image);

    image = ee.Image(image);

    //let snow = Landsat.snowScore(image2);
    //Map.addLayer(snow.mask(snow), {palette:['000000', 'FFFF00'], min:0, max:1}, ' snow score', false);

    var clouds = Algorithms.Sentinel2.cloudScore(image);
    Map.addLayer(clouds.mask(clouds), { palette: ['000000', 'FF0000'], min: 0, max: 1 }, 'cloud score', false);

    //let vegetation = Sentinel2.vegetationScore(image2);
    //Map.addLayer(vegetation.mask(vegetation), {palette:['000000', '00FF00'], min:0, max:1}, 'vegetation score', false);

    var cloudThreshold = 0.1;
    var az = ee.Number(image.get('MEAN_SOLAR_AZIMUTH_ANGLE'));
    var zen = ee.Number(image.get('MEAN_SOLAR_ZENITH_ANGLE'));
    var cloudShadows = utils.projectClouds(az, zen, clouds, cloudThreshold);

    // MNDWI (20m)
    var mndwi = image.normalizedDifference(['green', 'swir']);
    //waterScore = utils.rescale(waterScore, 'img', [-0.2, 0.35])
    //waterScore = waterScore.mask(waterScore)
    Map.addLayer(mndwi, { palette: utils.Palettes.water }, 'water score (MNDWI)', false);

    // NDWI (10m)
    var ndwi = image.resample('bicubic').normalizedDifference(['green', 'nir']);
    //let waterScore = utils.rescale(waterScore, 'img', [-0.2, 0.35])
    //waterScore = waterScore.mask(waterScore)

    Map.addLayer(ndwi, { palette: utils.Palettes.water }, 'water score (NDWI)', false);

    var i = ndwi
    
    var cloudMask = clouds.lt(cloudThreshold)

    i = i.clip(aoi)
    
    if(maskClouds) {
      var i = i.updateMask(cloudMask.not());
    }

    var results = utils.computeThresholdUsingOtsu(i, 10, aoi, cannyTh, cannySigma, false, true);
    var th = results.threshold

    var water = i.gte(ee.Image.constant(th));
    Map.addLayer(water.mask(water), {}, 'water mask (NDWI)', false);

    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });
    waterVector = utils.filterToIntersection(waterVector, analysisExtent);

    Map.addLayer(waterVector, { color: '5050ff' }, 'water mask', false, 0.6);

    // fill
    var area = waterVector.geometry().area(1)
    var waterImageVis = ee.Image(ee.Algorithms.If(
      ee.Algorithms.IsEqual(area, 0),
      ee.Image(),
      utils.fillMissingWater(water, clouds, ee.Image(), water.mask(), results.edges)
    ))

    Map.addLayer(waterImageVis, {}, 'water filled', false)
  
};

Algorithms.Sentinel2.detectWater = function (image, info, returnImage) {
    image = image.unitScale(info.unitScale[0], info.unitScale[1]).copyProperties(image);

    image = ee.Image(image);

    var clouds = Algorithms.Sentinel2.cloudScore(image);

    var waterScore = image.resample('bicubic').normalizedDifference(['green', 'nir']);

    var cloudThreshold = 0.1;
    var cloudMask = clouds.gte(cloudThreshold);

    var i = waterScore.clip(aoi)
    
    if(maskClouds) {
      var i = i.updateMask(cloudMask.not());
    }

    var results = utils.computeThresholdUsingOtsu(i, 10, aoi, cannyTh, cannySigma, false, true);
    var th = results.threshold;

    var water = i.gte(ee.Image.constant(th));

    var az = ee.Number(image.get('MEAN_SOLAR_AZIMUTH_ANGLE'));
    var zen = ee.Number(image.get('MEAN_SOLAR_ZENITH_ANGLE'));
    var cloudShadows = utils.projectClouds(az, zen, clouds, cloudThreshold);

    var mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask');
    })).product();

    if (returnImage) {
        return water.set('system:time_start', image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        //.set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
        .set('snow_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('water_threshold', th);
    }

    var waterVector = water.mask(water).reduceToVectors({ geometry: analysisExtent, scale: errorMargin });
    waterVector = filterToIntersection(waterVector, analysisExtent);

    var waterMask = ee.FeatureCollection(waterVector.copyProperties(image)).set('system:time_start', image.get('system:time_start')).set('nodata_pixels', ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('cloud_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
    //.set('cloud_shadow_pixels', ee.Dictionary(cloudShadows.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0))
    .set('snow_pixels', ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0)).set('water_threshold', th);

    return {
      waterMask: waterMask,
      snowMask: ee.Image(),
      cloudMask: clouds,
      imageMask: mask, // image.select(0).mask(),
      edges: results.edges
    }
};

Algorithms.Sentinel2.getCloudPixelCount = function (image, info) {
    image = image.unitScale(info.unitScale[0], info.unitScale[1]);

    var clouds = Algorithms.Sentinel2.cloudScore(image);

    var cloudThreshold = 0.1;
    var cloudMask = clouds.gte(cloudThreshold);

    return ee.Dictionary(cloudMask.reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

Algorithms.Sentinel2.getSnowPixelCount = function (image, info) {
    return ee.Number(0);
};

Algorithms.Sentinel2.getNoDataPixelCount = function (image, info) {
    var mask = ee.ImageCollection(image.bandNames().map(function (b) {
        return image.select([b]).mask().rename('mask');
    })).product();
    return ee.Dictionary(mask.not().reduceRegion(ee.Reducer.sum(), analysisExtent, scale)).values().get(0);
};

exports.Algorithms = Algorithms.Sentinel2
