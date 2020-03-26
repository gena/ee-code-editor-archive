/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Polygon(
        [[[5.570068359375, 52.61972527267027],
          [5.9490966796875, 52.61972527267027],
          [5.9490966796875, 52.8492298820527],
          [5.5645751953125, 52.8459123539017]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Savitzky Golay smoothing
//  
// Transcribed from:
//
// http://www2.geog.ucl.ac.uk/~plewis/eoldas/plot_directive/savitzky_golay.py
//
// Author: Guido Lemoine - EC JRC, 2017-02-23  transcribed from python library
//                                 2018-06-17  modified to compare to matrixSolve solution
//                                 2018-06-19  adapted to run on image collections

// Part 1: Set up a S1 collection that covers the aoi consistently.
// Best to select a limited area that is covered by a single orbit.
// If the selection has holes, the smoothing will throw errors (for now)

var aoi =  geometry 

var start_date = '2017-01-01'
var end_date = '2018-01-01'

// get the data from Sentinel-1 collection, for our area and period of interest
var s1 = ee.ImageCollection('COPERNICUS/S1_GRD').filterMetadata('instrumentMode', 'equals', 'IW').
  filter(ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH'])).
  filter(ee.Filter.inList('relativeOrbitNumber_start', [37])).
  filterBounds(aoi).
  filterDate(start_date, end_date).sort('system:time_start');

// Functions to convert from/to dB
function toNatural(img) {
  return ee.Image(10.0).pow(img.select('..').divide(10.0)).copyProperties(img, ['system:time_start'])
}

function toDB(img) {
  return ee.Image(img).log10().multiply(10.0).copyProperties(img);
}

// Make sure to convert from dB to "natural" values before doing any calculations
s1 = s1.map(toNatural)

// Add predictors for SG fitting, using date difference
// We prepare for order 3 fitting, but can be adapted to lower order fitting later on
var s1res = s1.map(function(img) {
  var dstamp = ee.Date(img.get('system:time_start'))
  var ddiff = dstamp.difference(ee.Date(start_date), 'hour')
  img = img.select(['VV', 'VH']).set('date', dstamp)
  return img.addBands(ee.Image(1).toFloat().rename('constant')).
    addBands(ee.Image(ddiff).toFloat().rename('t')).
    addBands(ee.Image(ddiff).pow(ee.Image(2)).toFloat().rename('t2')).
    addBands(ee.Image(ddiff).pow(ee.Image(3)).toFloat().rename('t3'))
})

// Step 2: Set up Savitzky-Golay smoothing
var window_size = 9
var half_window = (window_size - 1)/2

// Define the axes of variation in the collection array.
var imageAxis = 0;
var bandAxis = 1;

// Set polynomial order
var order = 3
var coeffFlattener = [['constant', 'x', 'x2', 'x3']]
var indepSelectors = ['constant', 't', 't2', 't3']

// Change to order = 2 as follows:
//var order = 2
//var coeffFlattener = [['constant', 'x', 'x2']]
//var indepSelectors = ['constant', 't', 't2']

// Convert the collection to an array.
var array = s1res.toArray();

// Solve 
function getLocalFit(i) {
  // Get a slice corresponding to the window_size of the SG smoother
  var subarray = array.arraySlice(imageAxis, ee.Number(i).int(), ee.Number(i).add(window_size).int())
  var predictors = subarray.arraySlice(bandAxis, 2, 2 + order + 1)
  var response = subarray.arraySlice(bandAxis, 0, 1); // VV
  var coeff = predictors.matrixSolve(response)

  coeff = coeff.arrayProject([0]).arrayFlatten(coeffFlattener)
  return coeff  
}

// For the remainder, use s1res as a list of images
s1res = s1res.toList(s1res.size())
var runLength = ee.List.sequence(0, s1res.size().subtract(window_size))

// Run the SG solver over the series, and return the smoothed image version
var sg_series = runLength.map(function(i) {
  var ref = ee.Image(s1res.get(ee.Number(i).add(half_window)))
  return getLocalFit(i).multiply(ref.select(indepSelectors)).reduce(ee.Reducer.sum()).copyProperties(ref)
})

// Part 3: Generate some output

// 3A. Get an example original image and its SG-ed version
var VV = toDB(ee.Image(s1res.get(41)).select('VV'))
var VVsg = toDB(ee.Image(sg_series.get(41-half_window)))  // half-window difference in index

// Create a colour composite of the image (RED) 
// compared to its Savitzky-Golayed self (GREEN)
// and the difference between the 2 (BLUE)
Map.addLayer(ee.Image(VV).addBands(VVsg).addBands(ee.Image(VV).subtract(VVsg)).clip(aoi), 
  {min: [-20, -20, -5], max: [0, 0, 5]}, 'RGB = VV-VVsg-VV/VVsg (in dB)')

// 3B. Now get a profile for a buffered point. 
// Make sure to place the point in the centre of a homogenous area (reduces noise) 
var pt = ee.Geometry.Point(5.80439, 52.72309).buffer(20)

// Build a stack for all images in the collection
function stack(i1, i2)
{
  return ee.Image(i1).addBands(ee.Image(i2))
}

var s1orig = s1res.slice(1).iterate(stack, s1res.get(0))

var s1sged = sg_series.slice(1).iterate(stack, sg_series.get(0))

// Get samples from both series
var y = ee.Image(s1orig).select(['VV(..)*']).reduceRegion(ee.Reducer.mean(), pt,10).values()
var xlabels = ee.Image(s1orig).select(['t(..)*']).reduceRegion(ee.Reducer.first(), pt,10).values()
var smoothy = ee.Image(s1sged).select(['sum(..)*']).reduceRegion(ee.Reducer.mean(), pt,10).values()

// NB: convert to dB (this actually exaggarates differences between raw points and the smooth series somewhat)
// NB2 the first and last half_window values of the smoothy are simply repeated from the start and end values
y = y.map(function(f) { return ee.Number(f).log10().multiply(10)})
xlabels = xlabels.map(function(f) { return ee.Number(f).divide(24.0)}).sort()

smoothy = smoothy.map(function(f) { return ee.Number(f).log10().multiply(10)})

// Chart
var yValues = ee.Array.cat([y, ee.List.repeat(smoothy.get(0), half_window).cat(smoothy).cat(ee.List.repeat(smoothy.get(-1), half_window))], 1);

var chart = ui.Chart.array.values(yValues, 0, xlabels).setSeriesNames(['Raw', 'Smoothed']).setOptions(
  {
    title: 'Savitsky-Golay smoothing (order = ' + order + ', window_size = ' + window_size + ')', 
    hAxis: {title: 'Time (days after 2017-01-01'}, vAxis: {title: 'S1 VV (dB)'},
    legend: null,
    series: { 
      0: { lineWidth: 0},
      1: { lineWidth: 2, pointSize: 0, color: 'red' }}
  })
print(chart)

Map.centerObject(aoi, 12)
