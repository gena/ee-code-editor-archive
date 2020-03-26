var l8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA');

var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'pan'];
var L8_NAMES =  ['B2',   'B3',    'B4',  'B5',  'B6',    'B8'];
l8 = l8
  .select(L8_NAMES, STD_NAMES)
  .filterDate('2014-01-01', '2014-10-01')
  .filterBounds(Map.getBounds(true))
  .filterMetadata('CLOUD_COVER', 'less_than', 20)

function addNdvi(image) {
  var ndvi = image.normalizedDifference(['nir', 'red']).rename('ndvi')
  return image.addBands(ndvi);
}

var median = l8.map(addNdvi).median();

var rgb = median.select(['red', 'green', 'blue']);
var vis = {min:0.05, max:0.25};
Map.addLayer(rgb, vis, 'RGB');

Map.addLayer(median.select('ndvi'), {palette: '5050FF, 000000, 00FF00', min:-0.5, max:0.5}, 'NDVI', false);

// TODO: compute mean() NDWI (water index) value by mapping a function over image collection