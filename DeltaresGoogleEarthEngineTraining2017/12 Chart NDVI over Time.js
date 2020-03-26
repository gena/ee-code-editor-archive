var point = ee.Geometry.Point(4.381442070007324, 51.98525016185232)

Map.centerObject(point, 12); // Delft

var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");

var STD_NAMES = ['blue', 'green', 'red', 'nir', 'swir1', 'pan'];
var L8_NAMES =  ['B2',   'B3',    'B4',  'B5',  'B6',    'B8'];

l8 = l8
  .select(L8_NAMES, STD_NAMES)
  .filterBounds(Map.getBounds(true))
  //.filterMetadata('CLOUD_COVER', 'less_than', 20)
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

// add Deltares location
Map.addLayer(point, {color: 'red'}, 'Deltares')

// TODO: switch to ScatterChart, see ui.Chart.setChartType()

// TODO: add a new plot showing all band values