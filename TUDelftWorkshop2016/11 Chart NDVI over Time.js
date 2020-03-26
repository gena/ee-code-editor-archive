/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var point = /* color: 98ff00 */ee.Geometry.Point([1.8370342254638672, 43.31887097689866]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// build histogram of specific spectral index in time using built-in chart
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");

var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'pan'];
var L8_NAMES =  ['B2',   'B3',    'B4',  'B5',  'B6',    'B8'];

Map.centerObject(point, 14)

l8 = l8
  .select(L8_NAMES, STD_NAMES)
  .filterBounds(Map.getBounds(true))
  .filterMetadata('CLOUD_COVER', 'less_than', 50)
  .select(['red', 'green', 'blue', 'nir'])

var vis = {min:0.05, max:0.25};

function addNdvi(image) {
  var ndvi = image.normalizedDifference(['nir', 'red']).rename('ndvi')
  return image.addBands(ndvi);
}

l8 = l8.map(addNdvi)

var median = l8.median();
Map.addLayer(median, vis, 'RGB');
Map.addLayer(median.select('ndvi'), {palette: '5050FF, 000000, 00FF00', min:-0.5, max:0.5}, 'NDVI', false);

print(Chart.image.series(l8.select('ndvi'), point));


