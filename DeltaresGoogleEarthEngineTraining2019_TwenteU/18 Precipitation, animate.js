/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var gpm = ee.ImageCollection("NASA/GPM_L3/IMERG"),
    geometry = /* color: #d63000 */ee.Geometry.Point([55.634765625, 13.838079936422474]),
    ncep = ee.ImageCollection("NOAA/CFSV2/FOR6H");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
print(ee.Image(gpm.first()).bandNames())
print(ee.Image(ncep.first()).bandNames())

var startDate = '2015-10-31';
var maxHours = 48

Map.setCenter(54.85, 12.28, 4)

// show GPM chart
var gpmPrecipitation = gpm.filterDate(startDate, ee.Date(startDate).advance(2, 'day')).select('precipitationCal')

var chart = ui.Chart.image.series(gpmPrecipitation, geometry)
  .setOptions({ title: 'GPM' })

print(chart)

// show NCEP chart
var ncepPrecipitation = ncep.filterDate(startDate, ee.Date(startDate).advance(2, 'day')).select('Precipitation_rate_surface_6_Hour_Average')

var chart = ui.Chart.image.series(ncepPrecipitation, geometry)
  .setOptions({ title: 'NCEP' })

print(chart)


// metainfo for multiple precipitation datasets
var datasets = [
  {
    images: ncep, 
    var: 'Precipitation_rate_surface_6_Hour_Average',
    stepHours: 6,
    maxValue: 0.001
  },
  {
    images: gpm, 
    var: 'precipitationCal',
    stepHours: 3,
    maxValue: 7
  },
]

//var dataset = datasets[0] // NCEP, 6 hours
var dataset = datasets[1] // GPM, 3 hours

var colors = ['eff3ff', 'bdd7e7', '6baed6', '3182bd', '08519c']

Map.setOptions('SATELLITE')

Map.addLayer(ee.Image(1), {opacity:0.5}, 'bg')

function render(hour) {
  var date = ee.Date(startDate).advance(hour, 'hour');
  var dateRange = ee.DateRange(date, date.advance(dataset.stepHours, 'hour'));

  var image = ee.Image(dataset.images.select(dataset.var).filterDate(dateRange).first())
    .convolve(ee.Kernel.gaussian(3, 2, 'pixels'));

  var vis = { min:0, max:dataset.maxValue, palette: colors }
  
  return image.mask(image.divide(dataset.maxValue / 3)).visualize(vis)
    .set({ label: ee.Number(hour).format('%d').cat(' hours') })
}

var hours = ee.List.sequence(0, maxHours, dataset.stepHours)

var frames = ee.ImageCollection(hours.map(render))

// animate images
var animation = require('users/gena/packages:animation')
animation.animate(frames/*, { label: 'label' }*/)
