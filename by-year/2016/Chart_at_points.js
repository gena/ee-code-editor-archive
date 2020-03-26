/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var features = /* color: d63000 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-122.58544921875, 40.12849105685408]),
            {
              "system:index": "0"
            }),
        ee.Feature(
            ee.Geometry.Point([-113.115234375, 40.763901280945866]),
            {
              "system:index": "1"
            }),
        ee.Feature(
            ee.Geometry.Point([-115.33447265625, 36.50963615733049]),
            {
              "system:index": "2"
            }),
        ee.Feature(
            ee.Geometry.Point([-107.81982421875, 36.56260003738545]),
            {
              "system:index": "3"
            }),
        ee.Feature(
            ee.Geometry.Point([-102.45849609375, 40.36328834091583]),
            {
              "system:index": "4"
            })]),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// DOOMED


function diff(pt1, pt2, i) { 
  return ee.Number(pt2.get(i)).subtract(pt1.get(i))
}

// TODO: avoid server-side calls
function geoToScreen(pt) {
  var scale = Map.getScale()
  
  var web = ee.Projection('EPSG:3857')
  var wgs = ee.Projection('EPSG:4326')
  
  var bounds = ee.Geometry(Map.getBounds(true))
    .transform(web, ee.ErrorMargin(scale))
    
  var coords = ee.List(bounds.coordinates().get(0))
    
  var ll = ee.List(coords.get(0))
  
  pt = pt.transform(web, ee.ErrorMargin(scale)).coordinates()

  var x = diff(ll, pt, 0).divide(scale)
  var y = diff(ll, pt, 1).divide(scale)
  
  return [x, y]
}

function addChart(images, geometry, w, h) {
  var scale = Map.getScale()
  var chart = ui.Chart.image.series(images, geometry, ee.Reducer.mean(), scale)

  chart.setOptions({
    lineWidth: 1,
    chartArea: {width: '100%', height: '90%'},
    title: null,
    legend: 'none',
    hAxis: { textPosition: 'none',  gridlines: { color: 'transparent'} },
    vAxis: { textPosition: 'none',  gridlines: { color: 'transparent'}  },
  })
  

  var panel = ui.Panel({ style: { position: 'bottom-left'} });
  panel.style().set('width', w + 'px')
  panel.style().set('height', h + 'px')
  
  panel.add(chart)
  panel.style().set('background-color', 'ffffff')
  
  print(panel.style())
  
  ui.root.add(panel)

  return panel  
}

ui.root.setLayout(ui.Panel.Layout.absolute())

var pt = ee.Feature(features.toList(1, 0).get(0)).geometry()

var images = l8
  .filterBounds(pt)
  .select(['B6','B5','B4','B3','B2'])

var chart = addChart(images, pt, 250, 250)

function updateChartSyle(chart) {
  var position = geoToScreen(pt)

  var w = Math.floor(position[0].getInfo())
  var h = Math.floor(position[1].getInfo())
  
  chart.style().set('width', w + 'px')
  chart.style().set('height', h + 'px')
}

updateChartSyle(chart)

Map.onChangeCenter(function(center, map) {
  updateChartSyle(chart)
})



