/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC08/C01/T1_RT_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.setOptions('HYBRID')

var bounds = Map.getBounds(true)
var scale = Map.getScale()

l8 = l8
  .filterDate('2018-07-01', '2018-09-01')
  .filterBounds(bounds)
  
print(l8.size())  

var water = l8.map(function(i) {
  return i.resample('bicubic').normalizedDifference(['B3', 'B6']).unitScale(-0.2, 0.5).clamp(0, 1)
}).reduce(ee.Reducer.percentile([15]))

Map.addLayer(water.mask(water), { palette: ['00ffff'], min: 0, max: 1 })

var temp = l8.map(function(i) {
  var t = i.resample('bicubic')
    
    
  var minMax = t.select('B10').updateMask(water.and(i.select('B3').lt(0.15))).reduceRegion(ee.Reducer.percentile([1, 99]), bounds, scale)
  var tmin = minMax.get('B10_p1') 
  var tmax = minMax.get('B10_p99')
  
  return t
    .set({
      tmin: tmin,
      tmax: tmax,
      t: i.date().format()
    })
    
}).filter(ee.Filter.notNull(['tmin', 'tmax']))

var temp = temp.map(function(t) {
  var tmin = t.get('tmin') 
  var tmax = t.get('tmax')

  return t.select(['B6', 'B5', 'B2']).visualize({min: 0.05, max: 0.4, opacity: 0.7})
    .blend(t.select('B10').unitScale(t.get('tmin'), t.get('tmax'))
    .visualize({palette: ['0000ff', 'ff0000', 'ffff00', 'ffffff'], min: 0, max: 1} ).updateMask(water.and(t.select('B3').lt(0.25)))
    )
    .set({
      t: ee.String(t.get('t'))
        .cat(', ').cat(ee.Number(tmin).format('%.1f'))
        .cat(', ').cat(ee.Number(tmax).format('%.1f'))
    })
})

var animation = require('users/gena/packages:animation')
animation.animate(temp, {maxFrames: 30, label: 't'})
1
