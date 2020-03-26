/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([129.45996773859338, 40.9769661670565]),
    urban = ee.ImageCollection("JRC/GHSL/P2016/SMOD_POP_GLOBE_V1"),
    builtup = ee.Image("JRC/GHSL/P2016/BUILT_LDSMT_GLOBE_V1"),
    lights = ee.ImageCollection("NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var assets = require('users/gena/packages:assets')

// var start = '2016-01-01';
// var end = '2019-01-01';
// var time_reference = '2016-01-01';

var start = '1990-01-01';
var end = '1995-01-01';
var time_reference = '1990-01-01';

var images = assets.getImages(Map.getBounds(true), {
  filter: ee.Filter.date(start, end),
  resample: true,
  //missions: ['S2']
  missions: ['L4', 'L5']
})

images = assets.getMostlyCleanImages(images, Map.getBounds(true), {
        cloudFrequencyThresholdDelta: 0.15
})

var animation = require('users/gena/packages:animation')
animation.animate(images, { vis: {min:0.03, max: 0.3 } })

throw(0)
Map.addLayer(images.reduce(ee.Reducer.percentile([30])), { min: 0.03, max: 0.3}, '30%', false)

Map.addLayer(images.reduce(ee.Reducer.stdDev()), { min: 0.03, max: 0.13, gamma: 1.3}, 'stdDev', false)


/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var imageCollection1 = ee.ImageCollection("LANDSAT/LC8_L1T"),
    geometry1 = /* color: d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/*
Tyler: 
This techniques used in the following script may (or may not) be useful for your final objective...  
the script queries EE for a time series of NDVI and then fits a simple temporal model (annual harmonic) 
to the time series for each point shown on the map. The displayed layers show the results of the fitted 
model: the background greyscale layer is the estimated mean NDVI, the colored overlay layer summarizes 
the areas where the harmonic model has a high amplitude and the color corresponds to the timing of the maximum NDVI. 

It also demonstrates how you can sample the raw data and fitted model, and plot them on charts.
*/

// Array-based harmonic model fitting


//var imgs = ee.ImageCollection('LANDSAT/LC8_L1T')
//  .filterDate(start, end);

// Filter out clouds.
/*imgs = imgs.map(function(img) {
  var cloudscore = ee.Algorithms.Landsat.simpleCloudScore(img).select('cloud');
  return img.mask(cloudscore.lt(50));
});
*/

var imgs = images

// Add an NDVI band.
imgs = imgs.map(function(img) {
  return img.addBands(img.normalizedDifference(['nir', 'red']).select([0],['NDVI']));
});

var design = imgs.map(function(img) {

  var tstamp = ee.Date(img.get('system:time_start'));
  var tdelta = tstamp.difference(time_reference, 'year');

  //var ndvi = img.normalizedDifference(['B5', 'B4']);
  
  // Build an image that will be used to fit the equation
  // c0 + c1*sin(2*pi*t) + c2*cos(2*pi*t) = NDVI
  var img_fitting = img.select()
    .addBands(1)
    .addBands(tdelta.multiply(2*Math.PI).sin())
    .addBands(tdelta.multiply(2*Math.PI).cos())
    .addBands(img.select('NDVI'))
    .toDouble();
    
  return img_fitting;
});

var phase_palette = ['FF7777', 'FFFF77', '77FF77', '77FFFF', '7777FF', 'FF77FF', 'FF7777'];

var coeffs = design.reduce(ee.Reducer.linearRegression(3, 1)).select('coefficients');
var meanCoeff = coeffs.arrayGet([0,0]);
var sinCoeff = coeffs.arrayGet([1,0]);
var cosCoeff = coeffs.arrayGet([2,0]);
var phase = sinCoeff.atan2(cosCoeff);
var amplitude = sinCoeff.hypot(cosCoeff);

// Map.addLayer(meanCoeff, {min:0, max:0.5}, 'NDVI fit mean');
// Map.addLayer(amplitude, {min:0, max:0.5}, 'NDVI fit amplitude', false);
// Map.addLayer(phase.mask(amplitude.subtract(0.1).multiply(5)), {min:-Math.PI, max:Math.PI, palette:phase_palette}, 'NDVI fit phase');

Map.addLayer(ee.Image([meanCoeff, amplitude, phase]), { min: [0, 0, -Math.PI], max: [0.6, 0.6, Math.PI]})



// Plot out the observations for a point.
var roi = geometry //ee.Geometry.Point(-121.2906, 37.8724);
var timeSeries = Chart.image.series(imgs.select('NDVI'), roi, ee.Reducer.mean(), 200);
print(timeSeries);
Map.addLayer(roi, {color:"FF0000"}, 'ROI');

// Plot out the modeled values for the same point.
var monthOffsetList = ee.List.sequence(0, ee.Date(end).difference(start, 'month'), 1);
var modelResult = ee.ImageCollection.fromImages(monthOffsetList.map(function(monthOffset) {
  var tstamp = ee.Date(start).advance(monthOffset, 'month');
  var tdelta = ee.Date(tstamp).difference(time_reference, 'year');
  // predicted NDVI = c0 + c1*sin(2*pi*t) + c2*cos(2*pi*t)
  var predicted = ee.Image(meanCoeff)
    .add(sinCoeff.multiply(tdelta.multiply(2*Math.PI).sin()))
    .add(cosCoeff.multiply(tdelta.multiply(2*Math.PI).cos()))
    .set({'system:time_start': ee.Date(tstamp).millis()});
  return predicted;
}));
print(Chart.image.series(modelResult, roi, ee.Reducer.mean(), 200));


var palette = require('users/gena/packages:palettes'). matplotlib.inferno[7]
Map.addLayer(builtup.select('built').updateMask(builtup.select('built').unitScale(0, 1)), {min: 0, max: 250, palette: palette})