// define greenest pixel from using NDVI as a mask (i.e. quality mosaic)
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");

var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'pan'];
var L8_NAMES =  ['B2',   'B3',    'B4',  'B5',  'B6',    'B8'];

// load collection
l8 = l8
  .select(L8_NAMES, STD_NAMES)
  .filterBounds(Map.getBounds(true))
  .filterMetadata('CLOUD_COVER', 'less_than', 10)
  .select(['red', 'green', 'blue', 'nir'])
  
Map.addLayer(l8, {}, 'L8', false)

var vis = {min:0.05, max:0.25};

function addNdvi(image) {
  var ndvi = image.normalizedDifference(['nir', 'red']).rename('ndvi')
  return image.addBands(ndvi);
}

l8 = l8.map(addNdvi)

// median of collection -> output is a single image
var median = l8.median();

Map.addLayer(median, vis, 'RGB');

Map.addLayer(median.select('ndvi'), {palette: '5050FF, 000000, 00FF00', min:-0.5, max:0.5}, 'NDVI', false);

// quality mosiac applies filter based on calculated NDVI
var greenest = l8.qualityMosaic('ndvi');
Map.addLayer(greenest, vis, 'RGB greenest');

