/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var proba100 = ee.ImageCollection("VITO/PROBAV/S1_TOC_100M");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var bands = ['SWIR', 'NIR', 'BLUE']

proba100 = proba100.select(bands).map(function(i) { return i.resample('bicubic')})

Map.addLayer(proba100, {}, 'proba 100m raw', false)

var percentiles = [1,2,3,4,5,10,15,20,25,30,35,40,45,50,55,60,65,70]

percentiles.map(function(p) {
  var image = proba100.reduce(ee.Reducer.percentile([p])).rename(bands)
  Map.addLayer(image, {min:50, max:800}, p, false)
})


var collection = proba100.map(function(i) { 
  return i.normalizedDifference(['SWIR', 'BLUE'])})

// Total number of values at each pixel.
var total = collection.reduce('count')
Map.addLayer(total, {}, 'count', false)

// Make histogram bins
var bins = [];
var binsCount = 100
var step = 1 / binsCount
print('Step: ' + step)

function addBin(i) {
  var b = ee.Image(i * step).select([0], ["bin_" + i]);
  bins.push(b);
}

for (var i = 0; i <= binsCount; i++) {
  addBin(i)
}


// Combine all the bins into 1 image.
bins = ee.Image(bins);

// Compute the normalized counts.
var cdf = collection.map(function(img) {
  return img.lte(bins);
}).sum().divide(total)


Map.addLayer(cdf, {}, 'CDF', false);

Map.addLayer(cdf.log(), {}, 'CDF (log)', false);

// integrate CDF to obtain PDF
var pdf = cdf.slice(1).subtract(cdf.slice(0,-1)).divide(step)
Map.addLayer(pdf, {}, 'PDF', false)

/*

Map.addLayer(ee.Image(1), {palette: ['000000']}, 'black', true, 0.5)

var cdfSlope = cdf.normalizedDifference(waterBins)//.unitScale(0.1, 0.5)

var scale = Map.getScale();

// find thresholds
var cdfSlopeEdge = ee.Algorithms.CannyEdgeDetector(cdfSlope, 0.3, 0.5)
  
// buffer around NDWI edges
var cdfSlopeEdgeBuffer = cdfSlope.mask(cdfSlopeEdge.focal_max(ee.Number(scale).multiply(1.5), 'square', 'meters'))

// compute threshold using Otsu thresholding
var hist = ee.Dictionary(cdfSlopeEdgeBuffer.reduceRegion(ee.Reducer.histogram(255), bounds, scale).get('nd'))
var cdfSlopeThreshold = ee.Number(ee.Algorithms.If(hist.contains('bucketMeans'), otsu(hist), 0));
print('Threshold: ', cdfSlopeThreshold)
print('Scale: ', scale)

// histogram stretching
var histAll = ee.Dictionary(cdfSlope.reduceRegion(ee.Reducer.percentile([1, 98]), bounds, scale))
var cdfSlopeP1 = histAll.get('nd_p1')
var cdfSlopeP98 = histAll.get('nd_p98')

// compute mask for water
var cdfSlopeMask = cdfSlope.unitScale(cdfSlopeThreshold, cdfSlopeThreshold.add(0.2))

// add to map
Map.addLayer(cdfSlope.mask(cdfSlopeMask), {palette: ['ffffff', '0083ee']}, 'CDF (percentile slope)', true, 0.9)

var cdfSlopeStretched = cdfSlope.unitScale(cdfSlopeP1, cdfSlopeP98)
Map.addLayer(cdfSlopeStretched.mask(cdfSlopeStretched), {palette: ['ffffff', '0083ee']}, 'CDF (percentile slope, unmasked)', true, 0.9)

var waterEdge = ee.Algorithms.CannyEdgeDetector(cdfSlope, 0.4, 1)
Map.addLayer(waterEdge.mask(waterEdge), {palette: ['ffffff']}, 'CDF (percentile slope edge)', true)

// show edges on the percentile slope
print(ui.Chart.image.histogram(cdfSlopeEdgeBuffer, bounds, scale))

*/