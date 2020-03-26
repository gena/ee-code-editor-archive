/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var gpm = ee.ImageCollection("NASA/GPM_L3/IMERG"),
    geometry = /* color: d63000 */ee.Geometry.Point([55.634765625, 13.838079936422474]),
    ncep = ee.ImageCollection("NOAA/CFSV2/FOR6H");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
print(ee.Image(gpm.first()).bandNames())
print(ee.Image(ncep.first()).bandNames())

var startDate = '2015-10-31';
var maxHours = 48

// show NCEP and GPM chart
print(ui.Chart.image.series(gpm
  .filterDate(startDate, ee.Date(startDate).advance(2, 'day'))
  .select('precipitationCal'), geometry))
print(ui.Chart.image.series(ncep
  .filterDate(startDate, ee.Date(startDate).advance(2, 'day'))
  .select('Precipitation_rate_surface_6_Hour_Average'), geometry))

// metainfo for multiple precipitation datasets
var datasets = [
  {
    images: ncep, 
    var: 'Precipitation_rate_surface_6_Hour_Average',
    stepHours: 6,
    maxValue: 0.002
  },
  {
    images: gpm, 
    var: 'precipitationCal',
    stepHours: 3,
    maxValue: 15
  },
]

//var dataset = datasets[0] // NCEP, 6 hours
var dataset = datasets[1] // GPM, 3 hours

var colors = ['eff3ff', 'bdd7e7', '6baed6', '3182bd', '08519c']

Map.setOptions('SATELLITE')

Map.addLayer(ee.Image(1), {opacity:0.5}, 'bg')

function addLayer(hour) {
  var date = ee.Date(startDate).advance(hour, 'hour');
  var dateRange = ee.DateRange(date, date.advance(dataset.stepHours, 'hour'));
  var image = ee.Image(dataset.images.select(dataset.var).filterDate(dateRange).first())
    .convolve(ee.Kernel.gaussian(3, 2, 'pixels'));
  Map.addLayer(image.mask(image.divide(dataset.maxValue / 3)), {min:0, max:dataset.maxValue, palette: colors}, hour.toString(), false)
}

var hours = ee.List.sequence(0, maxHours, dataset.stepHours).getInfo()
hours.map(addLayer);

var currentLayer = Map.layers().get(1)

currentLayer.setShown(true)

var showLayer = function(hour) {
  currentLayer.setShown(false)
  currentLayer = Map.layers().get(hour/dataset.stepHours+1)
  currentLayer.setShown(true)
};

var label = ui.Label('Precipitation [mm/hr], ' + startDate);
var slider = ui.Slider({
  min: 0,
  max: maxHours,
  step: dataset.stepHours,
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
