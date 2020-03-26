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

var start = '2013-05-01';
var end = '2015-01-01';
var time_reference = '2014-01-01';

var imgs = ee.ImageCollection('LANDSAT/LC8_L1T')
  .filterDate(start, end);

// Filter out clouds.
imgs = imgs.map(function(img) {
  var cloudscore = ee.Algorithms.Landsat.simpleCloudScore(img).select('cloud');
  return img.mask(cloudscore.lt(50));
});

// Add an NDVI band.
imgs = imgs.map(function(img) {
  return img.addBands(img.normalizedDifference(['B5', 'B4']).select([0],['NDVI']));
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

Map.addLayer(meanCoeff, {min:0, max:0.5}, 'NDVI fit mean');
Map.addLayer(amplitude, {min:0, max:0.5}, 'NDVI fit amplitude', false);
Map.addLayer(phase.mask(amplitude.subtract(0.1).multiply(5)), {min:-Math.PI, max:Math.PI, palette:phase_palette}, 'NDVI fit phase');

// Plot out the observations for a point.
var roi = ee.Geometry.Point(-121.2906, 37.8724);
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

