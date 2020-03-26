Map.setCenter(-11.41, 21.07, 11); // Eye of the Sahara

var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");

var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'pan'];
var L8_NAMES =  ['B2',   'B3',    'B4',  'B5',  'B6',    'B8'];

l8 = l8
  .select(L8_NAMES, STD_NAMES)
  .filterDate('2014-01-01', '2014-10-01')
  .filterBounds(Map.getBounds(true))
  
// add all images (for inspection)
Map.addLayer(l8, {}, 'all', false);

// compute percentile composites
var p15 = l8.reduce(ee.Reducer.percentile([15])).rename(STD_NAMES);
var p35 = l8.reduce(ee.Reducer.percentile([35])).rename(STD_NAMES);
var p55 = l8.reduce(ee.Reducer.percentile([55])).rename(STD_NAMES);

// add to map
var vis = {min:0.05, max:0.6};
Map.addLayer(p15.select(['swir1', 'nir', 'green']), vis, '15%');
Map.addLayer(p35.select(['swir1', 'nir', 'green']), vis, '35%');
Map.addLayer(p55.select(['swir1', 'nir', 'green']), vis, '55%');

// TODO: switch location to the Persian Gulf, near Kuwait

// TODO: add 75%, 85%
