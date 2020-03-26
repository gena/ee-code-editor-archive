// Display a grid of linked maps, each with a different visualization.

// Load Sentinel-1 C-band SAR Ground Range collection (log scaling, VV co-polar)
var image = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .select('VV')
  .filterDate('2016-10-08', '2016-10-10')
  .mosaic();
// Display map
var image2 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .select('VV')
  .filterDate('2016-10-19', '2016-10-23')
  .mosaic();
var vis = {min: -14, max: -9, palette: [
  '0000ff','011301', '012E01', '023B01', '004C00', '00ff00',
  '207401', '66A000', 'FCD163', 'CE7E45', 'FFFFFF']};

var NAMES = [
  'Before Typhoon',
  'After Typhoon',
  
];


// Create a map for each visualization option.
var maps1 = [];
NAMES.forEach(function(name, index) {
  var map = ui.Map();
  map.add(ui.Label(name));
  map.addLayer(image, vis, name);
  map.setControlVisibility(false);
  maps1.push(map);
});
var maps2 = [];
NAMES.forEach(function(name, index) {
  var map = ui.Map();
  map.add(ui.Label(name));
  map.addLayer(image2, vis,name);
  map.setControlVisibility(false);
  maps2.push(map);
});
var linker = ui.Map.Linker(maps1, maps2);
// Enable zooming on the top-left map.
maps1[(0)].setControlVisibility({zoomControl: true});
// Show the scale (e.g. '500m') on the bottom-right map.
maps1[0].setControlVisibility({scaleControl: true});
maps2[1].setControlVisibility({scaleControl: true});
// Create a title.
var title = ui.Label('Flood Visualizations', {
  stretch: 'horizontal',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '24px'
}); 

// Create a grid of maps.
var mapGrid = ui.Panel([
    ui.Panel([maps1[0]], null, {stretch: 'both'}),
    ui.Panel([maps2[1]], null, {stretch: 'both'})
  ],
  ui.Panel.Layout.Flow('horizontal'), {stretch: 'both'}
);

// Add the maps and title to the ui.root.
ui.root.widgets().reset([title, mapGrid]);
ui.root.setLayout(ui.Panel.Layout.Flow('vertical'));

// Center the maps near tuguegarao.
maps1[0].setCenter(121.7045, 17.8036, 11);
maps2[1].setCenter(121.7045, 17.8036, 11);

ui.Map.Linker([maps1[0], maps2[1]]);
