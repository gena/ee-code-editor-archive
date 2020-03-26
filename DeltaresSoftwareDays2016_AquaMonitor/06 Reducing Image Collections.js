/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.setCenter(65.56, 38.35, 12)

// reduce image collection: compute a single value using a number images
var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1'];
var L8_NAMES =  ['B2',   'B3',    'B4',  'B5',  'B6'];
l8 = l8.select(L8_NAMES, STD_NAMES);

l8 = l8.filterBounds(Map.getBounds(true));

var vis = {min:0.05, max:0.4};

// add RGB
var image = l8.select(['swir1', 'nir', 'green']);
Map.addLayer(image.median(), vis, 'SNG');

// add a few real images
var count = 10
var list = l8.toList(count, 0)
for(var i = 0; i < count; i++) {
  var image = ee.Image(list.get(i))
  Map.addLayer(image.select(['swir1', 'nir', 'green']), vis, i.toString(), false)
}

// add count
Map.addLayer(l8.select(0).count(), {min:10, max:100, palette:['ff0000', '00ff00']}, 'count', false)

// add all (for inspection)
Map.addLayer(l8, {}, 'all', false)
