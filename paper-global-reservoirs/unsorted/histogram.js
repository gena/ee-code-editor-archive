/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var water = /* color: d63000 */ee.Feature(
        ee.Geometry.Point([-120.1585066713867, 39.382809252057946]),
        {
          "class": "water",
          "system:index": "0"
        }),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA"),
    l5 = ee.ImageCollection("LANDSAT/LT5_L1T_TOA"),
    hill = /* color: 98ff00 */ee.Feature(
        ee.Geometry.Point([-120.17257690429688, 39.37989020473583]),
        {
          "class": "hill",
          "system:index": "0"
        }),
    l8_fmask = ee.ImageCollection("LANDSAT/LC8_L1T_TOA_FMASK");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var start = '2014-01-01'
//var start = '1980-01-01'
var stop = '2017-01-01'

var bounds = ee.Geometry(Map.getBounds(true))

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

// Return the DN that maximizes interclass variance in B5 (in the region).
var otsu = function(histogram) {
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

            
var L5_BANDS =  ['B1',   'B2',    'B3',  'B4',  'B5',   'B5',    'B1',  'B6',        'B6']
var L7_BANDS =  ['B1',   'B2',    'B3',  'B4',  'B5',   'B5',    'B8',  'B6_VCID_2', 'B6_VCID_2']
var L8_BANDS =  ['B2',   'B3',    'B4',  'B5',  'B6',   'B7',    'B8',  'B10',       'B11']
var STD_BANDS = ['blue', 'green', 'red', 'nir', 'swir', 'swir2', 'pan', 'temp',      'temp2']

l8 = l8.filterDate(start, stop).filterBounds(bounds).select(L8_BANDS, STD_BANDS)
l7 = l7.filterDate(start, stop).filterBounds(bounds).select(L7_BANDS, STD_BANDS)
l5 = l5.filterDate(start, stop).filterBounds(bounds).select(L5_BANDS, STD_BANDS)
l8_fmask = l8_fmask.filterDate(start, stop).filterBounds(bounds).select(L8_BANDS.concat(['fmask']), STD_BANDS.concat(['fmask']))

var images = ee.ImageCollection(l8.merge(l7).merge(l5))
  //.filter(ee.Filter.dayOfYear(120, 300))
  //.filter(ee.Filter.gt('SUN_ELEVATION', 45))
  //.map(function(i) { return i.resample('bicubic') })

print(ui.Chart.feature.histogram(ee.FeatureCollection(images), 'SUN_ELEVATION', 100))

Map.addLayer(images.reduce('count'), {}, 'count', false)

Map.addLayer(l8_fmask.reduce('count'), {}, 'count (FMASK)', false)

print(l8_fmask.first())

var binsCount = 100
var step = 1 / binsCount

var binValues = ee.List.sequence(0, 1, step).getInfo()

function toCdf(collection) {
  // Make histogram bins
  var bins = [];

  function addBin(i) {
    var b = ee.Image(i * step).select([0], ["bin_" + pad(i,3)]);
    bins.push(b);
  }
  
  for (var i = 0; i <= binsCount; i++) {
    addBin(i)
  }

  // Combine all the bins into 1 image.
  bins = ee.Image(bins);
  
  // Total number of values at each pixel.
  var total = collection.reduce('count')

  // Compute the normalized counts.
  var cdf = collection.map(function(img) {
    return img.lte(bins);
  }).sum().divide(total)
  
  return cdf
}

var cdfs = {
  nir: toCdf(images.select('nir')),
  swir: toCdf(images.select('swir')),
  green: toCdf(images.select('green')),
  temp: toCdf(images.select('temp').map(function(i) { return i.unitScale(273.15 - 35, 273.15 + 35) })),

  //swir_clouds: toCdf(l8_fmask.map(function(i) { return i.select('swir').multiply(i.select('fmask').eq(4)) })),
  //nir_clouds: toCdf(l8_fmask.map(function(i) { return i.select('nir').multiply(i.select('fmask').eq(4)) })),
  //green_clouds: toCdf(l8_fmask.map(function(i) { return i.select('green').multiply(i.select('fmask').eq(4)) })),
  //temp_clouds: toCdf(l8_fmask.map(function(i) { return i.select('temp').multiply(i.select('fmask').eq(4)).unitScale(273.15 - 35, 273.15 + 35) })),

  ndwi: toCdf(images.map(function(i) { 
    return i.normalizedDifference(['green', 'nir']).unitScale(-1, 1)
  })),
  mndwi: toCdf(images.map(function(i) { 
    return i.normalizedDifference(['green', 'swir']).unitScale(-1, 1)
  }))
}

/*
Map.addLayer(l8_fmask.map(function(i) { 
  return i.select('temp').mask(i.select('fmask').eq(4)) }).max(),
  {}, 'max temp FMASK', false);

Map.addLayer(l8_fmask.map(function(i) { 
  return i.select('temp').mask(i.select('fmask').eq(4)) }).min(),
  {}, 'min temp FMASK', false);

return 
*/

Map.addLayer(cdfs.nir, {}, 'CDF nir', false);
Map.addLayer(cdfs.swir, {}, 'CDF swir', false);
Map.addLayer(cdfs.green, {}, 'CDF green', false);
Map.addLayer(cdfs.temp, {}, 'CDF temp', false);

Map.addLayer(cdfs.ndwi, {}, 'CDF NDWI', false);
Map.addLayer(cdfs.mndwi, {}, 'CDF MNDWI', false);

// print charts
var printChart = function(image, title) {
  var chart = ui.Chart.image.regions({
    image: image, 
    regions: ee.FeatureCollection([water, hill]), 
    reducer: ee.Reducer.mean(), 
    seriesProperty: 'class',
    scale: 10,
    xLabels: binValues
  })
  
  chart.setOptions({title: title})
  
  print(chart)
}

Object.keys(cdfs).map(function(k) { 
  printChart(cdfs[k], k)
})

// compute NDWI for every bin
printChart(cdfs.ndwi, 'CDF of NDWI')

// compute percentiles manually
var getPercentile = function(cdf, p) {
  return cdf.lte(p).reduce(ee.Reducer.sum()).multiply(step)
}

Map.addLayer(ee.Image([getPercentile(cdfs.swir, 0.15), getPercentile(cdfs.nir, 0.15), getPercentile(cdfs.green, 0.15)]), 
  {min:0.03, max:0.3}, '15%', false);

Map.addLayer(images.select(['swir', 'nir', 'green']).reduce(ee.Reducer.percentile([15])), 
  {min:0.03, max:0.3}, '15% (ee.Reducer.percentile)', false);

Map.addLayer(ee.Image([cdfs.swir.select('bin_020'), cdfs.nir.select('bin_020'), cdfs.green.select('bin_020')]), 
  {min:0.03, max:0.3}, '20%', false);


Map.addLayer(cdfs.ndwi, {bands:'bin_060'}, 'CDF NDWI 60', false);
Map.addLayer(cdfs.mndwi, {bands:'bin_060'}, 'CDF MNDWI 60', false);


// ================================= compute CDF/PDF for NDWI

var waterBins = [
    'bin_095', // should be clouds
    'bin_060'  // should be water
]

// PDF
var pdf = cdfs.ndwi.slice(1).subtract(cdfs.ndwi.slice(0,-1)).divide(step)
Map.addLayer(pdf, {}, 'PDF NDWI', false)

Map.addLayer(ee.Image(1), {palette: ['000000']}, 'black', true, 0.7)

// detect permanent water using CDF bin slope
var cdfSlope = cdfs.ndwi.normalizedDifference(waterBins) //.unitScale(0.1, 0.5)

//var maxValueP1 = 0.2
//cdfSlope = cdfSlope.mask(cdf.select('bin_1').lt(maxValueP1))

//cdfSlope = cdfSlope.mask(cdf.select('bin_60').lt(1))

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
Map.addLayer(cdfSlopeStretched.mask(cdfSlopeStretched), {palette: ['ffffff', '0083ee']}, 'CDF (percentile slope, stretched)', false, 0.9)

var waterEdge = ee.Algorithms.CannyEdgeDetector(cdfSlope, 0.4, 1)
Map.addLayer(waterEdge.mask(waterEdge), {palette: ['ffffff']}, 'CDF (percentile slope edge)', true)

// show edges on the percentile slope
//print(ui.Chart.image.histogram(cdfSlopeEdgeBuffer, bounds, scale))

Map.setOptions('HYBRID')