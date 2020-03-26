/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// reduce image collection: compute a single value using a number images
var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1'];
var L8_NAMES =  ['B2',   'B3',    'B4',  'B5',  'B6'];
l8 = l8.select(L8_NAMES, STD_NAMES);

l8 = l8.filterBounds(Map.getBounds(true));

// define true color
var rgb = l8.select(['red', 'green', 'blue']);


// define false color
var sng = l8.select(['swir2', 'nir', 'green']);

var vis = {min:0, max:0.3};

Map.addLayer(rgb.median(), vis, 'RGB');

Map.addLayer(sng.median(), vis, 'SNG');
