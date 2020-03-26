/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([7.422702312469482, 53.210376254302155]),
    jrc = ee.ImageCollection("JRC/GSW1_0/MonthlyHistory");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Sentinel-2
function processSentinelImage() {
  var images = ee.ImageCollection('COPERNICUS/S2')
  
  var image = ee.Image(images.filterBounds(geometry).toList(1,15).get(0))
    .resample('bicubic')
    .divide(10000)
    
  // add raw image for inspection
  Map.addLayer(image.select(['B2','B3','B4','B8','B12']), {}, 'image (raw)', false)    
  
  image = image.select(['B4','B3','B2', 'B8', 'B11'])  
    
  Map.addLayer(image.select(['B4','B3','B2']).subtract([0.02,0.02,0.05]), {min:0.02, max:[0.2, 0.2, 0.2]}, 'image')
  
  var ndwi = image.normalizedDifference(['B3', 'B8'])
  Map.addLayer(ndwi, {min:0, max:0.5}, 'ndwi [0, 0.5]', false)
  
  var ndwi = image.normalizedDifference(['B3', 'B8'])
  Map.addLayer(ndwi, {min:-0.2, max:-0.05}, 'ndwi [-0.2, -0.05]', false)

  var mndwi = image.normalizedDifference(['B3', 'B11'])
  Map.addLayer(mndwi, {min:0, max:0.5}, 'mndwi [0, 0.5]', false)

  var ndwiThreshold = 0
  var water = ndwi.gt(ndwiThreshold)
  Map.addLayer(water.mask(water), {palette:['ffff00']}, 'water?')
  
  // exclude urban areas when detecting threshold, should be also +clouds, etc.
  var urban = ee.Image('users/christinacorbane/MT_comp_proj')

  var mndwiNoUrban = mndwi.updateMask(urban.lt(4))

  var aoi = Map.getBounds(true)
  var cannyThreshold = 0.9
  var cannySigma = 0.7
  var minValue = -1
  var mndwiThreshold = computeThresholdUsingOtsu(mndwiNoUrban, 10, aoi, cannyThreshold, cannySigma, minValue, true) 
  print(mndwiThreshold)
  var water = mndwi.gt(mndwiThreshold)
  Map.addLayer(water.mask(water), {palette:['ffff00']}, 'water? (Canny + Otsu)', true, 0.9)
}


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
    bounds = ee.Geometry(bounds).bounds()
  
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

processSentinelImage()


// JRC monthly water occurrence for a few months
var water = jrc.filterDate('2014-05-01', '2014-07-01').map(function(i) { return i.eq(2).mask(i) }).mean()
Map.addLayer(water.mask(water), {palette:['3030aa']}, 'water (JRC, 2015)', false)