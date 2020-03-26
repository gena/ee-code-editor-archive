/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s1 = ee.ImageCollection("COPERNICUS/S1_GRD");
/***** End of imports. If edited, may not auto-convert in the playground. *****/


/***
 * Detect water in Sentinel1 image. Method is adopted from Donchyts et. al., 2016 (http://www.mdpi.com/2072-4292/8/5/386)
 */
function detectWaterSentinel1(image, aoi) {
  image = image.select(0);

  // remove bad pixel by detecting low entropy areas
  var glcm = image.multiply(10).toInt().glcmTexture({ size: 4 });
  var lowEntropy = glcm.select(0).lt(0.1);
  //image = image.updateMask(lowEntropy);

  image = image.clip(aoi);

  var scale = image.projection().nominalScale();

  // remove specke noise usign Perona-Malik filter
  var K = 4.5; //3.5
  var iterations = 10;
  var method = 1;
  //var image2 = removeSpeckleNoisePeronaMalik(image, iterations, K, method);
  //var cannySigma = 4
  //var cannyThreshold = 0.6

  // remove specke noise usign median filter
  var image2 = image.reduceNeighborhood(ee.Reducer.median(), ee.Kernel.circle(4, 'pixels'));
  var cannySigma = 0
  var cannyThreshold = 0.3

  var skipShort = true;
  var edgeGradient = true;
  Map.addLayer(image2, {min:-25, max:10}, 'image (smoothed)', false)
  var th = computeThresholdUsingOtsu(image2.select(0), scale, aoi, cannyThreshold, cannySigma, skipShort, edgeGradient);

  // detect water by taking darker pixels
  var water = image.lt(th);
  
  // remove small blobs
  var connected = water.mask(water).connectedPixelCount(20, true);
  water = connected.gte(20);

  return water;  
}

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
    var edgeBuffer = edge.focal_max(ee.Number(scale).multiply(1), 'square', 'meters');
    var imageEdge = image.mask(edgeBuffer);

    // compute threshold using Otsu thresholding
    var buckets = 100;
    var hist = ee.Dictionary(ee.Dictionary(imageEdge.reduceRegion(ee.Reducer.histogram(buckets), bounds, scale)).values().get(0));

    var threshold = ee.Algorithms.If(hist.contains('bucketMeans'), otsu(hist), 0.3);
    threshold = ee.Number(threshold); //.add(0.05)

    if (debug) {
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

/***
 * Return the DN that maximizes interclass variance in B5 (in the region).
 */
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
 * Anisotrophic diffusion (Perona-Malik filter). * Solves diffusion equation numerically using convolution:
 * I(n+1, i, j) = I(n, i, j) + lambda * (cN * dN(I) + cS * dS(I) + cE * dE(I), cW * dW(I))
 */
var removeSpeckleNoisePeronaMalik = function removeSpeckleNoisePeronaMalik(I, iter, K, opt_method) {
    var method = opt_method || 1;

    var dxW = ee.Kernel.fixed(3, 3, [[0, 0, 0], [1, -1, 0], [0, 0, 0]]);

    var dxE = ee.Kernel.fixed(3, 3, [[0, 0, 0], [0, -1, 1], [0, 0, 0]]);

    var dyN = ee.Kernel.fixed(3, 3, [[0, 1, 0], [0, -1, 0], [0, 0, 0]]);

    var dyS = ee.Kernel.fixed(3, 3, [[0, 0, 0], [0, -1, 0], [0, 1, 0]]);

    var lambda = 0.2;

    var k1 = ee.Image(-1.0 / K);
    var k2 = ee.Image(K).multiply(ee.Image(K));

    for (var i = 0; i < iter; i++) {
        var dI_W = I.convolve(dxW);
        var dI_E = I.convolve(dxE);
        var dI_N = I.convolve(dyN);
        var dI_S = I.convolve(dyS);

        var cW = void 0;
        var cE = void 0;
        var cN = void 0;
        var cS = void 0;
        if (method === 1) {
            cW = dI_W.multiply(dI_W).multiply(k1).exp();
            cE = dI_E.multiply(dI_E).multiply(k1).exp();
            cN = dI_N.multiply(dI_N).multiply(k1).exp();
            cS = dI_S.multiply(dI_S).multiply(k1).exp();
            I = I.add(ee.Image(lambda).multiply(cN.multiply(dI_N).add(cS.multiply(dI_S)).add(cE.multiply(dI_E)).add(cW.multiply(dI_W))));
        } else if (method === 2) {
            cW = ee.Image(1.0).divide(ee.Image(1.0).add(dI_W.multiply(dI_W).divide(k2)));
            cE = ee.Image(1.0).divide(ee.Image(1.0).add(dI_E.multiply(dI_E).divide(k2)));
            cN = ee.Image(1.0).divide(ee.Image(1.0).add(dI_N.multiply(dI_N).divide(k2)));
            cS = ee.Image(1.0).divide(ee.Image(1.0).add(dI_S.multiply(dI_S).divide(k2)));
            I = I.add(ee.Image(lambda).multiply(cN.multiply(dI_N).add(cS.multiply(dI_S)).add(cE.multiply(dI_E)).add(cW.multiply(dI_W))));
        }
    }

    return I;
};


// detect
var debug = true
var errorMargin = 10

var aoi = ee.Geometry(Map.getBounds(true))

var image = ee.Image(s1.filterBounds(aoi.centroid(10)).first()).select(0)

Map.addLayer(image, {min:-25, max:10}, 'image')

var water = detectWaterSentinel1(image, aoi)

Map.addLayer(water.mask(water), {palette:['0000ff']}, 'water')