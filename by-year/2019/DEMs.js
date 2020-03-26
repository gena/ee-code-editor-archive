var dems = {
  SRTM: ee.Image('USGS/SRTMGL1_003').resample('bilinear'),
  ALOS: ee.Image('JAXA/ALOS/AW3D30_V1_1').select('MED').resample('bilinear'),
  AHN: ee.Image('AHN/AHN2_05M_RUW'),
  NED: ee.Image('USGS/NED').resample('bilinear'),
  AU: ee.ImageCollection('AU/GA/AUSTRALIA_5M_DEM').mosaic(), // broken!
  UK_test: ee.Image('users/gena/HAND/test_uk_DSM'),
}

var dem = dems.SRTM

var selectDem = function(o) {
  dem = dems[o]
  showLayer(slider.getValue())
}

var showLayer = function(height) {
  Map.layers().reset();

  Map.addLayer(ee.Algorithms.Terrain(dem).select('hillshade'), {min: 100, max: 200}, 'hillshade')

  var mask = dem.lte(height)
  Map.addLayer(mask.mask(mask), {palette:['0099ff']}, "Elevation")
}

// Create a label and a slider.
var label = ui.Label('Sea Level Rise (m)');

var slider = ui.Slider({
  min: 0,
  max: 10,
  step: 1,
  onChange: showLayer,
  style: {stretch: 'horizontal'}
});

var choice = ui.Select({
  items: Object.keys(dems), 
  value: 'SRTM', 
  onChange: selectDem
});

// Add the label and slider to a panel.
var panel = ui.Panel(
  [label, slider, choice],
  ui.Panel.Layout.flow('vertical')
);
panel.style().set({
  position: 'top-center',
  padding: '7px',
});

// Add the panel to the map.
Map.add(panel);
slider.setValue(0);
showLayer(0)
