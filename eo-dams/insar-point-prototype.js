/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([-99.55058593749999, 34.83607775945183]),
    geometry2 = /* color: #98ff00 */ee.Geometry.Point([-101.00189163189941, 35.13180982385003]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// points
var points = ee.FeatureCollection([
  ee.Feature(geometry, { pid: 0 }),
  ee.Feature(geometry2, { pid: 1 })
])

Map.addLayer(points)

// asset 2
var features = ee.FeatureCollection([
  ee.Feature(geometry, { pid: 0, 'system:time_start': ee.Date('2000-01-01').millis(), deformation: 0.1 }),
  ee.Feature(geometry, { pid: 0, 'system:time_start': ee.Date('2000-01-02').millis(), deformation: 0.2 }),
  ee.Feature(geometry, { pid: 0, 'system:time_start': ee.Date('2000-01-03').millis(), deformation: 0.14 }),
  ee.Feature(geometry, { pid: 0, 'system:time_start': ee.Date('2000-01-04').millis(), deformation: 0.23 }),
  ee.Feature(geometry, { pid: 1, 'system:time_start': ee.Date('2000-01-01').millis(), deformation: 0.2 }),
  ee.Feature(geometry, { pid: 1, 'system:time_start': ee.Date('2000-01-02').millis(), deformation: 0.3 }),
  ee.Feature(geometry, { pid: 1, 'system:time_start': ee.Date('2000-01-03').millis(), deformation: 0.4 }),
  ee.Feature(geometry, { pid: 1, 'system:time_start': ee.Date('2000-01-04').millis(), deformation: 0.3 }),
])

var panelChart = ui.Panel([ui.Label('<chart>', { width: 400, height: 200 })])
Map.add(panelChart)

var selectionLayer = ui.Map.Layer(ee.Feature(null), { color: 'ffff00' }, 'selection')
Map.layers().add(selectionLayer)

function showPointChart(point) {
  var pid = point.get('pid')
  var pointFeatures = features.filter(ee.Filter.eq('pid', pid))
  var chart = ui.Chart.feature.byFeature(pointFeatures, 'system:time_start', ['deformation'])
    .setOptions({ title: ee.String('Chart for point: ').cat(ee.Number(pid).format('%d')) })
  panelChart.clear()
  panelChart.add(chart)
}

Map.onClick(function(pt) {
  var point = ee.Feature(points.filterBounds(ee.Geometry.Point([pt.lon, pt.lat]).buffer(Map.getScale() * 5)).first())
  
  point.evaluate(function(pt) {
    if(!pt) {
      return 
    }
    
    selectionLayer.setEeObject(point)
    showPointChart(point)
  })
})