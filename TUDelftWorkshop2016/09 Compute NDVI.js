// compute the normalized vegetation index based on nir/red
var image = ee.Image('LANDSAT/LC8_L1T_TOA/LC81980242014068LGN00');

var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'pan'];
var L8_NAMES =  ['B2',   'B3',    'B4',  'B5',  'B6',    'B8'];
image = image.select(L8_NAMES, STD_NAMES);

var rgb = image.select(['red', 'green', 'blue']);

var vis = {min:0.05, max:0.3, gamma: 1.3};

Map.addLayer(rgb, vis, 'RGB');

// Compute vegetation index as: NDVI = (NIR - RED) / (NIR + RED)
// More reading: http://earthobservatory.nasa.gov/Features/MeasuringVegetation/

var red = image.select('red');
var nir = image.select('nir');
var ndvi = nir.subtract(red).divide(nir.add(red));

Map.addLayer(ndvi, {palette: '5050FF, 000000, 00FF00', min:-0.5, max:0.5}, 'NDVI');

