/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var images = ee.ImageCollection("COPERNICUS/S2_SR"),
    countries = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var nl = countries.filter(ee.Filter.eq('country_na', 'Netherlands'))

Map.addLayer(nl, {}, 'NL')

images = images.filterBounds(nl.geometry()).limit(5000)

print(images.size())

var times = ee.List(images.aggregate_array('system:time_start'))
  .map(function(t) {
    t = ee.Date(t)
    return ee.Feature(null, {
      time: ee.Number(t.get('hour')).add(ee.Number(t.get('minute')).divide(60))
    })
  })

print(ui.Chart.feature.histogram(times, 'time', 100))

print(ui.Chart.feature.byFeature(images, 'MEAN_SOLAR_AZIMUTH_ANGLE', ['MEAN_SOLAR_ZENITH_ANGLE'])
  .setChartType('ScatterChart')
  .setOptions({
    width: 500,
    height: 500,
    pointSize: 2
  }))


