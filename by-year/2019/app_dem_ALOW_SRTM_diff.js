/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var alos = ee.Image("JAXA/ALOS/AW3D30_V1_1"),
    srtm = ee.Image("USGS/SRTMGL1_003");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var diff = alos.select('MED').subtract(srtm)

var palette = ['001261', '033E7D', '1E6F9D', '71A8C4', 'C9DDE7', 'EACEBD', 'D39774', 'BE6533', '8B2706', '590008']

Map.addLayer(diff.mask(diff.unitScale(0, 10)), {min: 10, max: -10, palette: palette })

var bounds = ee.Geometry(Map.getBounds(true))
var scale = Map.getScale() * 2
var chart = ui.Chart.image.histogram(diff, bounds, scale, 150)
var chartPanel = new ui.Panel([chart], null, { width: '400px', height: '300px', position: 'bottom-left' })
Map.add(chartPanel)

// ui.util.debounce does not seem to work, implement manually

var running = false

function updateChart() {
  var bounds = ee.Geometry(Map.getBounds(true))
  var scale = Map.getScale()
  var chart = ui.Chart.image.histogram(diff, bounds, scale, 150)
    .setOptions({ hAxis: { viewWindow: { min: -15, max: 15 }} })
    
  chartPanel.widgets().reset([chart])
}

Map.onChangeBounds(function(bounds) {
  ui.util.setTimeout(function() {
    if(running) {
      return
    }
  
    running = true
    updateChart()
    running = false
  }, 1000)
})

