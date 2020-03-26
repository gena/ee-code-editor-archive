/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var images = ee.ImageCollection("FIRMS"),
    geometry = 
    /* color: #d63000 */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[138.62155365756826, -39.294475097890704],
          [147.63034272006826, -39.36246072058427],
          [148.42135834506826, -38.43909007449377],
          [152.72799897006826, -36.73285283009035],
          [156.41940522006826, -31.497212420458037],
          [154.13424897006826, -21.200442310101966],
          [144.68600678256826, -10.82591408371369],
          [138.97311615756826, -11.041651823260208],
          [131.89792084506826, -10.739575296139416],
          [111.77096772006826, -12.718743135481262],
          [111.41940522006826, -36.16728150286326]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var variable = 'T21'

var yearStart = 2002
var yearStop = 2014

var dates = ee.List.sequence(yearStart, yearStop)

images = images.select(variable).map(function(i) { 
  return i.gt(0).focal_max(3).copyProperties(i, ['system:time_start']) 
})

// annual N fires
var fires = dates.map(function(y) {
  var t = ee.Date.fromYMD(y, 1, 1)
  return images.filterDate(t, t.advance(5, 'year')).sum().rename('fires')
    .set('system:time_start', t.millis())
})

fires = ee.ImageCollection(fires)

// chart average=
var chart = ui.Chart.image.series(fires, ee.Geometry(Map.getBounds(true)), ee.Reducer.median(), Map.getScale()*3, 'system:time_start')

chart = chart.setOptions({
  trendlines: {
    0: {
      showR2: true,
      visibleInLegend: true,
      color: 'ff0000'
    }
  },
  
  series: {
    0: {lineWidth: 1, pointSize: 1} 
  } 
 })
print(chart) 

var addTimeBand = function(image) {
  return image.addBands(image.metadata('system:time_start').divide(1e12))
}

Map.addLayer(fires, {}, 'raw', false)

fires = fires.map(addTimeBand)

var linearFit = fires.select(['system:time_start', 'fires']).reduce(ee.Reducer.linearFit());
Map.addLayer(linearFit, {min: 0, max: [100, 0, -100], bands: ['scale', 'scale', 'scale']}, 'fit')
