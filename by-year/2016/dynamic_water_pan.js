/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA"),
    planet_2016_07_14 = ee.Image("users/gena/PlanetLabs/20160714_175654_0e14_analytic"),
    planet_2016_06_24 = ee.Image("users/gena/PlanetLabs/20160624_161527_0c53_analytic");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var debug = true
var errorMargin = 2
var scale = 30

var Palettes = {
    water: ['f7fbff', 'deebf7', 'c6dbef', '9ecae1', '6baed6', '4292c6', '2171b5', '08519c', '08306b']
};

/***
 * Filters feature collection to filterCollection
 */
function filterToIntersection(featureCollection, filterCollection) {
    return featureCollection.map(function (f) {
        return f.set('intersects', f.intersects(filterCollection.geometry(ee.ErrorMargin(errorMargin)), ee.ErrorMargin(errorMargin)));
    }).filter(ee.Filter.eq('intersects', true));
}

// Return the DN that maximizes interclass variance in B5 (in the region).
var otsu = function otsu(histogram) {
    histogram = ee.Dictionary(histogram);

    var counts = ee.Array(histogram.get('histogram'));
    var means = ee.Array(histogram.get('bucketMeans'));
    var size = means.length().get([0]);
    var total = counts.reduce(ee.Reducer.sum(), [0]).get([0]);
    var sum = means.multiply(counts).reduce(ee.Reducer.sum(), [0]).get([0]);
    var mean = sum.divide(total);

    var indices = ee.List.sequence(1, size);

    // Compute between sum of squares, where each mean partitions the data.
    var bss = indices.map(function (i) {
        var aCounts = counts.slice(0, 0, i);
        var aCount = aCounts.reduce(ee.Reducer.sum(), [0]).get([0]);
        var aMeans = means.slice(0, 0, i);
        var aMean = aMeans.multiply(aCounts).reduce(ee.Reducer.sum(), [0]).get([0]).divide(aCount);
        var bCount = total.subtract(aCount);
        var bMean = sum.subtract(aCount.multiply(aMean)).divide(bCount);
        return aCount.multiply(aMean.subtract(mean).pow(2)).add(bCount.multiply(bMean.subtract(mean).pow(2)));
    });

    // Return the mean value corresponding to the maximum BSS.
    return means.sort(bss).get([-1]);
};

/***
 * Compute a threshold using Otsu method (bimodal)
 */
function computeThresholdUsingOtsu(image, scale, bounds, th, g, skipShort, weightGradient, minValue) {
    // clip image edges
    var mask = image.mask().gt(0).focal_min(ee.Number(scale).multiply(3), 'circle', 'meters');

    // detect sharp changes
    var edge = ee.Algorithms.CannyEdgeDetector(image, th, g);
    edge = edge.multiply(mask);

    // take the largest changes, estimate gradient around edge and use that as a weight
    if (weightGradient) {
        var gradient = image.gradient().abs();
        var edgeGradient = gradient.select(0).max(gradient.select(1)).mask(edge.gt(th)).reproject(image.projection().scale(2, 2));

        // take the upper percentiles only
        var mode = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.mode(), bounds, scale)).values().get(0));
        var σ = ee.Number(ee.Dictionary(edgeGradient.reduceRegion(ee.Reducer.stdDev(), bounds, scale)).values().get(0));
        var _buckets = 50;
        var significantEdgesMask = edgeGradient.gt(mode);

        edge = edge.updateMask(significantEdgesMask);

        if (debug) {
            // gradient around edges
            if (edgeGradient) {
                print(ui.Chart.image.histogram(edgeGradient, bounds, scale, _buckets));
                Map.addLayer(edgeGradient, {}, 'edge gradient', false);
                Map.addLayer(significantEdgesMask.mask(significantEdgesMask), {}, 'significant edges', false);

                print('Mode: ', mode);
                print('Sigma: ', σ);
                //Map.addLayer(edgeGradient.updateMask(significantEdgesMask), {min:0, max:mode.add(σ.multiply(2)), palette:['ffffff', 'ff0000']}, 'edge gradient, upper percentiles', false)
            }
        }
    }

    // advanced, detect edge lengths
    var coonnectedVis = void 0;
    if (skipShort) {
        var connected = edge.mask(edge).lt(0.8).connectedPixelCount(50, true);

        var edgeLong = connected.gte(50);

        edge = edgeLong;

        coonnectedVis = connected.updateMask(edgeLong).visualize({ palette: ['ffffff', 'ff0000'], min: 0, max: 50 });
    }

    // buffer around NDWI edges
    var bufferMultiplier = 1
    var edgeBuffer = edge.focal_max(ee.Number(scale).multiply(bufferMultiplier), 'square', 'meters');
    var imageEdge = image.mask(edgeBuffer).reproject(image.projection());

    // compute threshold using Otsu thresholding
    var buckets = 100;
    var hist = ee.Dictionary(ee.Dictionary(imageEdge.reduceRegion(ee.Reducer.histogram(buckets), bounds, scale)).values().get(0));

    var threshold = ee.Algorithms.If(hist.contains('bucketMeans'), otsu(hist), 0.3);
    threshold = ee.Number(threshold); //.add(0.05)

    if (debug) {
        Map.addLayer(edgeBuffer.mask(edgeBuffer), { palette: ['ffff00'], opacity: 0.5 }, 'buffer', false);

        Map.addLayer(edge.mask(edge), { palette: ['ff0000'] }, 'edges', false);

        if (skipShort) {
            Map.addLayer(coonnectedVis, {}, 'edges (connected)', false);
        }

        print('Threshold: ', threshold);

        print(ui.Chart.image.histogram(image, bounds, scale, buckets));
        print(ui.Chart.image.histogram(imageEdge, bounds, scale, buckets));

        Map.addLayer(mask.mask(mask), { palette: ['000000'] }, 'image mask', false);
    }

    return minValue ? threshold.max(minValue) : threshold;
}


var bounds = ee.FeatureCollection(ee.Geometry(Map.getBounds(true)))

// var image = ee.Image(l8.filter(ee.Filter.dayOfYear(200, 250)).filterBounds(bounds).first())

var image = ee.Image(l8.filter(ee.Filter.date('2016-07-06', '2016-07-07')).filterBounds(bounds).first())
image = image.select(
  ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9'],//, 'B10', 'B11', 'BQA'],
  ['coastal', 'blue', 'green', 'red', 'nir', 'swir', 'swir2', 'pan', 'cirrus']//, 'temp', 'temp2', 'BQA']
)

/*
var image = ee.Image(l7.filter(ee.Filter.date('2016-07-14', '2016-07-15')).filterBounds(bounds).first())
image = image.select(
  ['B1', 'B2', 'B3', 'B4', 'B5', 'B5', 'B8'], // 'B6_VCID_2', 'B6_VCID_2']
  ['blue', 'green', 'red', 'nir', 'swir', 'swir2', 'pan'] //  'temp', 'temp2']
)
*/        

Map.addLayer(image, {bands: ['swir', 'nir', 'green'], min: 0.03, max: 0.3}, 'image')

Map.addLayer(image, {bands: ['pan'], min: 0.03, max: 0.3}, 'image (pan)', false)

Map.addLayer(planet_2016_06_24, {min:0, max:1000}, 'Planet 2016-06-24', false)


// detect water using multispectral bands

// MNDWI
var mndwi = image
  .resample('bicubic')
  .normalizedDifference(['green', 'swir']);

//waterScore = rescale(waterScore, 'img', [-0.2, 0.35])
//waterScore = waterScore.mask(waterScore)

Map.addLayer(mndwi, { palette: Palettes.water }, 'water score (MNDWI)', false);

// NDWI
var ndwi = image
  .resample('bicubic')
  .normalizedDifference(['green', 'nir']);
//let waterScore = rescale(waterScore, 'img', [-0.2, 0.35])
//waterScore = waterScore.mask(waterScore)



Map.addLayer(ndwi, { palette: Palettes.water }, 'water score (NDWI)', false);

var i = mndwi
  // .updateMask(cloudShadows.mask().not().and(clouds.lt(cloudThreshold)).multiply(focusNearWater))
  //.updateMask(clouds.lt(cloudThreshold)).clip(aoi);

var cannyTh = 0.3
var cannySigma = 2
// var cannyTh = 0.3
// var cannySigma = 2
var skipShort = false
var weightGradient = false
var minValue = -0.1
var scale = 30
var th = computeThresholdUsingOtsu(i, scale, bounds, cannyTh, cannySigma, skipShort, weightGradient, minValue)

var water = i.gte(ee.Image.constant(th));
Map.addLayer(water.mask(water), {}, 'water mask (NDWI)', false);

var waterVector = water.mask(water).reduceToVectors({ geometry: bounds, scale: errorMargin });
waterVector = filterToIntersection(waterVector, bounds);

Map.addLayer(waterVector, { color: '5050ff' }, 'water mask', false, 0.6);


var water = ndwi.gte(0);
Map.addLayer(water.mask(water), {palette:['aa0000']}, 'water mask (NDWI > 0)', false);

var water = mndwi.gte(0);
Map.addLayer(water.mask(water), {palette:['00aa00']}, 'water mask (MNDWI > 0)', false);
