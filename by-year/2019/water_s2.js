/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2"),
    jrc = ee.Image("JRC/GSW1_0/GlobalSurfaceWater"),
    hand1000 = ee.Image("users/gena/GlobalHAND/30m/hand-1000");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var occurrence = jrc.select('occurrence')
Map.addLayer(occurrence, {palette:['ffff00']}, 'water (JRC)', false)

Map.setOptions('SATELLITE')

/***
 * Compute water mask from S2 according to: http://www.mdpi.com/2072-4292/8/5/386
 */
  
/***
 * Return the DN that maximizes interclass variance in B5 (in the region).
 * Author: Nicolac Clinton (nclinton@google.com)
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

function getEdge(mask) {
  return ee.Algorithms.CannyEdgeDetector(mask, 0.99,0)
}

var bounds = ee.Geometry(Map.getBounds(true))

var debug = true
var scale = 30
var cannyThreshold = 0.9
var cannySigma = 0.5
var minValue = -0.1

var image = s2
  .filterBounds(bounds)
  .select(['B3', 'B8', 'B11'])
  .map(function(i) { return i.resample('bicubic') })
  .reduce(ee.Reducer.percentile([15])).rename(['B3', 'B8', 'B11'])
  .divide(10000)
  .clip(bounds)
  
  
var ndwi1 = image
  .normalizedDifference(['B3', 'B8'])
  
//ndwi1 = ndwi1.updateMask(hand1000.resample('bicubic').lt(30))
//ndwi1 = ndwi1.updateMask(occurrence.gt(0).focal_max(150, 'circle', 'meters'))
  
var ndwi2 = image
  .normalizedDifference(['B3', 'B11'])

Map.addLayer(image, {bands: ['B11','B8','B3'], min: 0.02, max: 0.25}, 'image')

Map.addLayer(ndwi1.mask(ndwi1.multiply(3)), {min:0, max:0.3, palette:['0000aa','0000ff']}, 'water')

var ndwi1Edge = ee.Algorithms.CannyEdgeDetector(ndwi1, 0.9, 0.5)
Map.addLayer(ndwi1Edge.mask(ndwi1Edge), {palette:['ffffff']}, 'water (edge)')


var ndwi = ndwi1

var th = computeThresholdUsingOtsu(ndwi, scale, bounds, cannyThreshold, cannySigma, minValue, debug)
print(th)

var water = ndwi.gt(th)

// mixed pixels are understimated
//water = water.focal_max(15, 'circle', 'meters')

var waterEdge = getEdge(water.mask(water))
  
Map.addLayer(water, {}, 'water', false)
Map.addLayer(waterEdge.mask(waterEdge), {palette:['ff0000']}, 'water (edge)')

var scale = Map.getScale()

var vector = water.mask(water).reduceToVectors({geometry: bounds, scale: scale * 0.5 })
var vector = vector.map(function(f) { return f.simplify(scale*2)})

Map.addLayer(vector, {color:'blue'}, 'water (vector)')


