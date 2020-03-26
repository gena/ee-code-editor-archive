/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var pt = /* color: #d63000 */ee.Geometry.Point([-5.92106492441178, 53.142525829122526]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var charting = require('users/gena/packages:charting')
var animation = require('users/gena/packages:animation')
var assets = require('users/gena/packages:assets')

var collections = [
  { id: 'LANDSAT/LE07/C01/T1_RT_TOA', color: 'red' },
  { id: 'LANDSAT/LE07/C01/T2_TOA', color: 'red' },
  { id: 'LANDSAT/LC08/C01/T1_RT_TOA', color: 'blue' },
  { id: 'LANDSAT/LC08/C01/T2_TOA', color: 'blue' }, 
  { id: 'COPERNICUS/S2', color: 'black' }
]

var images = ee.ImageCollection(collections[4].id).filterBounds(pt).filterDate('2018-01-01', '2018-03-01')
print('S2 (raw):', images.size())
animation.animate(images, { vis: {bands: ['B12', 'B8', 'B3'], min: 0, max: 4000}, position: 'bottom-center' })

var images = assets.getImages(pt, {
  missions: [
    'S2',
    //'L8',
    //'L7'
  ],
  filter: ee.Filter.date('2018-01-01', '2018-03-01')
})

print(images.size())

Map.addLayer(ee.ImageCollection(collections[4].id).filterDate('2018-01-01', '2018-03-01').count().select(0), {min:0, max: 50})

throw(0)
animation.animate(images.sort('system:time_start'), { maxFrames: 250 })


throw(0)

animation.animate(ee.ImageCollection(collections[2].id).filterBounds(pt).filterDate('2018-01-01', '2019-01-01'), { vis: {bands: ['B6', 'B5', 'B3'], min: 0, max: 0.4}   })
animation.animate(ee.ImageCollection(collections[3].id).filterBounds(pt).filterDate('2018-01-01', '2019-01-01'), { vis: {bands: ['B6', 'B5', 'B3'], min: 0, max: 0.4}, position: 'bottom-center'})


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

