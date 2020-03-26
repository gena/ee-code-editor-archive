/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([-120.16347885131836, 39.386325215154336]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var images = ee.ImageCollection('NOAA/VIIRS/VNP09GA/001')

// 1. what is system:is_global?
// 2. should there be an empty bands: [] on the collection
print(images)

Map.addLayer(images.select(['I.*']), {}, 'all', false)

// dates
print(ee.Array(images.aggregate_array('system:time_start')).toList().map(function(t) { return ee.Date(t)}))

// 3. data availability is [May, 2013; Aug, 2013] and [Mar, 2015; now]
print(ui.Chart.image.series(images.select('I.*'), geometry))
print(ui.Chart.image.series(images.select('M.*'), geometry))
print(ui.Chart.image.series(images.select('Sensor.*'), geometry))

print(ui.Chart.image.series(images.filterDate('2016-01-01', '2017-06-01').select('I.*'), geometry))
print(ui.Chart.image.series(images.filterDate('2016-01-01', '2017-06-01').select('M.*'), geometry))
print(ui.Chart.image.series(images.filterDate('2016-01-01', '2017-06-01').select('Sensor.*'), geometry))

var image = ee.Image(images.toList(1,7).get(0))

Map.addLayer(image, {bands: ['I1', 'I2', 'I3'], min:300, max:10000}, 'RGB 500m')
Map.addLayer(image, {bands: ['M3', 'M4', 'M5'], min:300, max:10000}, 'RGB 1000m')

Map.addLayer(image, {bands: ['SensorZenith']}, 'SensorZenith', false)


// 4. filter dates and generate percentile composite
function filter(from, to, percentile) {
  return images.filterDate(from, to).reduce(ee.Reducer.percentile([percentile])).rename(image.bandNames())
}

// 5. bands seem to be sorted differently in different images
// ERROR: RGB 500m, 5%: Tile error: Expected a homogeneous image collection, but an image with incompatible bands was encountered:
Map.addLayer(images.reduce(ee.Reducer.percentile([5])), {}, '5%, all images, slow, crash')

// fix
images = images.select(image.bandNames())

// 6. add add monthly composites
var length = 1 // month
var percentile = 10
ee.List.sequence(1, 12, length).getInfo(function(months) {
  months.map(function(m) {
    var from = ee.Date.fromYMD(2016, m, 1)
    var to = from.advance(length, 'month')
    Map.addLayer(filter(from, to, percentile), {bands: ['I1', 'I2', 'I3'], min:300, max:5000}, 'RGB 500m, ' + percentile + '%, 2016-' + m, m === 1)
  })
})


