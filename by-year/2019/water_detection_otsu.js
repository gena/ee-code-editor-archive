/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/*** 
 * The script computes surface water mask using Canny Edge detector and Otsu thresholding
 * See the following paper for details: http://www.mdpi.com/2072-4292/8/5/386
 * 
 * Author: Gennadii Donchyts (gennadiy.donchyts@gmail.com)
 * Contributors: Nicholas Clinton (nclinton@google.com) - re-implemented otsu() using ee.Array
 */ 
 
 
print(Map.getCenter())
Map.setCenter(64.80, 38.96, 16)

/***
 * Return the DN that maximizes interclass variance in B5 (in the region).
 */
var otsu = function(histogram) {
    histogram = ee.Dictionary(histogram);

    var counts = ee.Array(histogram.get('histogram'));
    var means = ee.Array(histogram.get('bucketMeans'));
    var size = means.length().get([0]);
    var total = counts.reduce(ee.Reducer.sum(), [0]).get([0]);
    var sum = means.multiply(counts).reduce(ee.Reducer.sum(), [0]).get([0]);
    var mean = sum.divide(total);

    var indices = ee.List.sequence(1, size);

    // Compute between sum of squares, where each mean partitions the data.
    var bss = indices.map(function(i) {
        var aCounts = counts.slice(0, 0, i);
        var aCount = aCounts.reduce(ee.Reducer.sum(), [0]).get([0]);
        var aMeans = means.slice(0, 0, i);
        var aMean = aMeans.multiply(aCounts)
            .reduce(ee.Reducer.sum(), [0]).get([0])
            .divide(aCount);
        var bCount = total.subtract(aCount);
        var bMean = sum.subtract(aCount.multiply(aMean)).divide(bCount);
        return aCount.multiply(aMean.subtract(mean).pow(2)).add(
            bCount.multiply(bMean.subtract(mean).pow(2)));
    });

    // Return the mean value corresponding to the maximum BSS.
    return means.sort(bss).get([-1]);
};


/***
 * Compute a threshold using Otsu method (bimodal)
 */
function computeThresholdUsingOtsu(image, scale, bounds, cannyThreshold, cannySigma, minValue, debug) {
    // clip image edges
    var mask = image.mask().gt(0).focal_min(ee.Number(scale).multiply(3), 'circle', 'meters');

    // detect sharp changes
    var edge = ee.Algorithms.CannyEdgeDetector(image, cannyThreshold, cannySigma);
    edge = edge.multiply(mask);

    // buffer around NDWI edges
    var edgeBuffer = edge.focal_max(ee.Number(scale).multiply(1), 'square', 'meters');
    var imageEdge = image.mask(edgeBuffer);

    // compute threshold using Otsu thresholding
    var buckets = 100;
    var hist = ee.Dictionary(ee.Dictionary(imageEdge.reduceRegion(ee.Reducer.histogram(buckets), bounds, scale)).values().get(0));

    var threshold = ee.Algorithms.If(hist.contains('bucketMeans'), otsu(hist), 0.3);
    threshold = ee.Number(threshold)//.add(0.05)

    if(debug) {
        Map.addLayer(edge.mask(edge), {palette:['ff0000']}, 'edges', false);

        print('Threshold: ', threshold);

        print(ui.Chart.image.histogram(image, bounds, scale, buckets));
        print(ui.Chart.image.histogram(imageEdge, bounds, scale, buckets));
        Map.addLayer(mask.mask(mask), {palette:['000000']}, 'image mask', false);
    }

    return minValue !== 'undefined' ? threshold.max(minValue) : threshold;
}

var bounds = ee.Geometry(Map.getBounds(true))

var image = ee.Image(s2.filterBounds(bounds.centroid(10)).filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 5)).first())
print(image)
Map.addLayer(image, {bands: ['B3', 'B8', 'B3'], min:500, max:3000}, 'image')

var ndwi = image.normalizedDifference(['B3', 'B8'])

var debug = true
var scale = 10
var cannyThreshold = 0.9
var cannySigma = 1
var minValue = -0.1
var th = computeThresholdUsingOtsu(ndwi, scale, bounds, cannyThreshold, cannySigma, minValue, debug)

print(th)

function getEdge(mask) {
  return mask.subtract(mask.focal_min(1))
}

Map.addLayer(ndwi.mask(ndwi.gt(th)), {palette:'0000ff'}, 'water (th=' + th.getInfo() + ')')
Map.addLayer(ndwi.mask(getEdge(ndwi.gt(th))), {palette:'ffffff'}, 'water edge (th=' + th.getInfo() + ')')

Map.addLayer(ndwi.mask(getEdge(ndwi.gt(0))), {palette:'ff0000'}, 'water edge (th=0)')