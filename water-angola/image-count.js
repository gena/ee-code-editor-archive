/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Point([13.624092137119078, -8.82130439130676]),
    countries = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var assets = require('users/gena/packages:assets')
var charting = require('users/gena/packages:charting')

var angola = countries.filter(ee.Filter.eq('country_na', 'Angola'))

Map.addLayer(angola.style({ fillColor: '00000000', color: '000000', width: 2 }), {}, 'Angola')

var bounds = angola.geometry().bounds()

Map.addLayer(bounds)

var getImages = function(y) { 
  var start = ee.Date.fromYMD(y, 1, 1)
  var stop = start.advance(1, 'year')
  
  return assets.getImages(bounds, {
    missions: ['L4', 'L5', 'L7', 'L8', 'S2'],
    includeTier2: true,
    filter: ee.Filter.date(start, stop),
    
    // skip harmonization - faster
    clipBufferSize: 0,
    s2MergeByTime: false
  })
}

// ee.List.sequence(1985, 2020).evaluate(function(years) {
//   years.map(function(y) {
//     print(y, getImages(y).size())
//   })
// })

// throw(0)

var count = ee.List.sequence(1985, 2020).map(function(y) {
  var start = ee.Date.fromYMD(y, 1, 1)

  var images = getImages(y)
  
  return ee.Feature(null, { 'system:time_start': start.millis(), count: images.size() })
})

count = ee.FeatureCollection(count)

print(count.aggregate_sum('count'))

print(ui.Chart.feature.byFeature(count, 'system:time_start', ['count']).setChartType('ColumnChart').setOptions({
  title: 'Number of images acquired above Angola by Landsat 4, 5, 7, 8 and Sentinel-2 A and B missions',
  vAxis: { title: 'Count' },
  hAxis: { title: 'Year' }
}))


// var start = ee.Date.fromYMD(year, 1, 1)
// var stop = start.advance(1, 'year')

// // plot
// var rect = ee.Geometry.Rectangle({ coords: [[0, 0], [100, 4]], geodesic: false })

// // add rug plot
//   var plot = new charting.Plot(rect.bounds(), { 
//     area: { width: 1, color: '000000', fillColor: '00000011' }
//   })
  
//   plot.setMinMax(start.millis(), stop.millis(), 0, 1)
  
//   var images = c.collection.filterDate(start, stop)
//   var times = ee.List(images.aggregate_array('system:time_start'))
//   plot.addRugSeries(c.id, times, { width: 1, color: c.color }, 1)  

//   print(plot.getThumbnail({ dimensions: '600x24'}))


/*


var collections = [
  { id: 'LANDSAT/LE07/C01/T1_RT', color: 'red' },
  { id: 'LANDSAT/LE07/C01/T2', color: 'red' },
  { id: 'LANDSAT/LC08/C01/T1_RT', color: 'blue' },
  { id: 'LANDSAT/LC08/C01/T2', color: 'blue' }, 
  { id: 'COPERNICUS/S2', color: 'black' }
]

collections.map(function(c) {
  c.collection = ee.ImageCollection(c.id).filterBounds(pt)
})

function showThumb(year) {
  print(year)
  
  var start = ee.Date.fromYMD(year, 1, 1)
  var stop = start.advance(1, 'year')
  
  // plot
  var rect = ee.Geometry.Rectangle({ coords: [[0, 0], [100, 4]], geodesic: false })
  
  // add rug plots
  collections.map(function(c) {
    var plot = new charting.Plot(rect.bounds(), { 
      area: { width: 1, color: '000000', fillColor: '00000011' }
    })
    
    plot.setMinMax(start.millis(), stop.millis(), 0, 1)
    
    var images = c.collection.filterDate(start, stop)
    var times = ee.List(images.aggregate_array('system:time_start'))
    plot.addRugSeries(c.id, times, { width: 1, color: c.color }, 1)  
  
    print(plot.getThumbnail({ dimensions: '600x24'}))
  })
}

var years = ee.List.sequence(2016, 2019)
years.evaluate(function(years) { years.map(showThumb) })

*/