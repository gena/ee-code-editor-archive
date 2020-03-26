/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([83.19366744140893, 30.101785057307048]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var collections = [
  { 
    name: 'CHIRPS', scale: 5000, 
    collection: ee.ImageCollection('UCSB-CHG/CHIRPS/PENTAD') // .map(function(i) { return i.resample('bicubic') })
  },
  {
    name: 'PERSIANN', scale: 5000,
    collection: ee.ImageCollection('NOAA/PERSIANN-CDR') // .map(function(i) { return i.resample('bicubic') })
  }
];
  

// harmonize images from two different collections to the same date intervals
function getDates(start, stop, step) {
  return ee.List.sequence(start, stop).map(function(year) {
    return ee.List.sequence(1, 12, step).map(function(month) {
      return ee.Date.fromYMD(year, month, 1)
    })
  }).flatten()
}

var duration = 1
var dates = getDates(1985, 2015, duration)

var images = dates.map(function(d) { 
  var t0 = ee.Date(d)
  var t1 = t0.advance(duration, 'month')
  
  var i1 = collections[0].collection.filterDate(t0, t1).sum().rename(collections[0].name)
  var i2 = collections[1].collection.filterDate(t0, t1).sum().rename(collections[1].name)
  
  return i1.addBands(i2)
    .set('system:time_start', t0.millis())
})

images = ee.ImageCollection(images)

// add images to the map for inspection
Map.addLayer(images, {}, 'images (annual)', false)

// compute Pearson's correlation between two time series
var correlation = images.reduce(ee.Reducer.pearsonsCorrelation())
// Map.addLayer(correlation.select(0), { min: -1, max: 1, palette: ['d7191c', '000000', '1a9641'] }, 'correlation')

// show a scatter plot for a single point
var features = images.map(function(i) {
  var stat = i.reduceRegion(ee.Reducer.first(), geometry, 10000)
  return i.set(stat)
})

var chart = ui.Chart.feature.byFeature(features, 'CHIRPS', ['PERSIANN'])

// For chart options see: https://developers.google.com/chart/interactive/docs/gallery/trendlines
chart = chart.setOptions({
  lineWidth: 0,
  pointSize: 2,
  vAxis: { viewWindow: { min: 0, max: 500 } },
  hAxis: { viewWindow: { min: 0, max: 500 } },
  width: 500,
  height: 500,
  trendlines: { 0: { visibleInLegend: true, showR2: true } }
})

print(chart)

// time series
chart = ui.Chart.feature.byFeature(features, 'system:time_start', ['CHIRPS', 'PERSIANN'])
print(chart)
