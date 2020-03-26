/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC08/C01/T1_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// reduce image collection: compute a single value using a number images
var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1'];
var L8_NAMES =  ['B2',   'B3',    'B4',  'B5',  'B6'];
l8 = l8.select(L8_NAMES, STD_NAMES);

l8 = l8.filterBounds(Map.getBounds(true));

var rgb = l8.select(['red', 'green', 'blue']);

var sng = l8.select(['swir1', 'nir', 'green']);

var vis = {min:0.05, max:0.4};

Map.addLayer(rgb.median(), vis, 'RGB');

Map.addLayer(sng.median(), vis, 'SNG');

// TODO: compute median by calling ee.ImageColleciton.reduce() instead of ee.ImageCollection.median()

// TODO: zoom-in to hilly area (type Andorra in the search box) and select the first image with SUN_ELEVATION > 50

// TODO: what about SUN_ELEVATION < 25

