Map.setCenter(4.381442070007324, 51.98525016185232, 12); // Delft

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

var Palettes = {
  ndvi: [	'306466', '9cab68', 'cccc66', '9c8448', '6e462c' ]
}

Map.addLayer(ndvi, {palette: Palettes.ndvi, min:-0.35, max:0.8}, 'NDVI');

// TODO: threshold NDVI to mark vegetated areas, for example, NDVI > 0.5

