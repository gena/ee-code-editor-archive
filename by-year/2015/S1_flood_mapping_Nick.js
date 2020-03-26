// Load Sentinel-1 images to map Chennai flooding, India, November 2015.
var pt = ee.Geometry.Point(80.1377, 13.11);

var collection =  ee.ImageCollection('COPERNICUS/S1_GRD').filterBounds(pt)
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .select('VV');
    
var before = collection.filterDate('2015-11-12', '2015-11-13').mosaic();
var after = collection.filterDate('2015-11-24', '2015-11-25').mosaic();
var later = collection.filterDate('2016-01-11', '2016-01-12').mosaic();

var land = ee.Image('USGS/SRTMGL1_003').gt(0);

before = before.updateMask(land);
after = after.updateMask(land);
later = later.updateMask(land); 

Map.setCenter(80.2538, 13.0822, 11);
Map.addLayer(before, {min:-30, max:0}, 'Nov 12');
Map.addLayer(after, {min:-30, max:0}, 'Nov 24');
Map.addLayer(later, {min:-30, max:0}, 'Jan 11', 0);
Map.addLayer(after.subtract(before), {min:-10,max:10}, 'After - before', false);

// Threshold smoothed radar intensities to identify "flooded" areas.
var SMOOTHING_RADIUS = 100;
var DIFF_UPPER_THRESHOLD = -3;

var kernel = ee.Kernel.circle(SMOOTHING_RADIUS, 'meters');

var diff_smoothed = after.reduceNeighborhood(ee.Reducer.median(), kernel)
    .subtract(before.reduceNeighborhood(ee.Reducer.median(), kernel));
    
var diff_thresholded = diff_smoothed.lt(DIFF_UPPER_THRESHOLD);

Map.addLayer(diff_smoothed, {min: -10, max: 10}, 'diff smoothed', 0);

Map.addLayer(diff_thresholded.updateMask(diff_thresholded),
  {palette:"0000FF"}, 'flooded areas - blue');