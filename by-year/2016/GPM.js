/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var gpm = ee.ImageCollection("NASA/GPM_L3/IMERG"),
    geometry = /* color: d63000 */ee.Geometry.Point([55.634765625, 13.838079936422474]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
print(ee.Image(gpm.first()).bandNames())

var colors = ['eff3ff', 'bdd7e7', '6baed6', '3182bd', '08519c']

var startDate = '2015-10-31';

print(ui.Chart.image.series(gpm
  .filterDate(startDate, ee.Date(startDate).advance(2, 'day'))
  .select('precipitationCal'), geometry))

Map.setOptions('SATELLITE')

Map.addLayer(ee.Image(1), {opacity:0.5}, 'bg')

function addLayer(hour) {
  var date = ee.Date(startDate).advance(hour, 'hour');
  var dateRange = ee.DateRange(date, date.advance(3, 'hour'));
  var image = ee.Image(gpm.select('precipitationCal').filterDate(dateRange).first())
    .convolve(ee.Kernel.gaussian(3, 2, 'pixels'));
  Map.addLayer(image.mask(image.divide(5)), {min:0, max:15, palette: colors}, hour.toString(), false)
}

var maxHours = 48
var hours = ee.List.sequence(0, maxHours, 3).getInfo()

hours.map(addLayer);

var currentLayer = Map.layers().get(1)

currentLayer.setShown(true)

var showLayer = function(hour) {
  currentLayer.setShown(false)
  currentLayer = Map.layers().get(hour/3+1)
  currentLayer.setShown(true)
};

var label = ui.Label('Precipitation [mm/hr], ' + startDate);
var slider = ui.Slider({
  min: 0,
  max: maxHours,
  step: 3,
  onChange: showLayer,
  // onSlide: showLayer, // not implemented?!
  style: {stretch: 'horizontal'}
});

// Create a panel that contains both the slider and the label.
var panel = ui.Panel({
  widgets: [label, slider],
  layout: ui.Panel.Layout.flow('vertical'),
  style: {
    position: 'top-center',
    padding: '7px',
    width: '300px'
  }
});

// Add the panel to the map.
Map.add(panel);

// Set default values on the slider and map.
Map.centerObject(geometry, 4);
