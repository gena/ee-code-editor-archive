/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var NAIPcoverage = ee.FeatureCollection("users/JustinTraining/NAIP_availability2");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var years = ee.List.sequence(2010, 2018)

var bounds = NAIPcoverage.geometry().bounds()

var COLORS = { missing: 'fb8072',available: 'b3de69' }

function showColumnCharts() {
  Map.addLayer(ee.Image(1), { palette: ['000000'] }, 'black', true, 0.3)
  Map.addLayer(NAIPcoverage.style({ color: '000000', width: 2, fillColor: '000000AA'}), {}, 'states')
  
  Map.setCenter(-97.705, 39.931, 5)
  
  var s = Map.getScale()
  var crs = 'EPSG:3857'
  
  var w = s * 8
  var h = s * 8
  var features = NAIPcoverage.map(function(f) {
    var coords = f.centroid().geometry(s, crs).coordinates()
    var x = ee.Number(coords.get(0))
    var y = ee.Number(coords.get(1))
    
    var rects = years.map(function(year) {
      year = ee.Number(year)
      var yoffset = year.subtract(2010).multiply(h)  
      var xmin = x.subtract(w/2)
      var ymin = y.add(yoffset).subtract(h/2)
      var xmax = x.add(w/2)
      var ymax = y.add(yoffset).add(h/2)
      var rect = ee.Geometry.Rectangle([xmin, ymin, xmax, ymax], crs, false)
      
      var isAvailable = f.get(ee.String('naip').cat(year.format('%d')))
      var color = ee.String(ee.Algorithms.If(isAvailable, COLORS.available, COLORS.missing))
      
      return ee.Feature(rect).set({ style: { color: color, fillColor: color.cat('aa'), width: 1 }})
    })
    
    return ee.FeatureCollection(rects)
  })
  
  Map.addLayer(features.flatten().style({ styleProperty: 'style'}), {}, 'column charts')
}

showColumnCharts()
showThumbnailsPanel()

function showThumbnailsPanel() {
  var images = years.map(function(year) {
    year = ee.Number(year).format('%d')
    var prop = ee.String('naip').cat(year)
  
    var missing = NAIPcoverage.filter(ee.Filter.eq(prop, 0)).style({ width: 1, color: '000000', fillColor: COLORS.missing + 'aa' })
    var available = NAIPcoverage.filter(ee.Filter.eq(prop, 1)).style({ width: 1, color: '000000', fillColor: COLORS.available + 'aa' })
    
    return missing.blend(available).set({ label: year })
  })
  
  images = ee.ImageCollection(images)

  years.evaluate(function(years) {
    var controls = years.map(function(year) {
      var image = images.filter(ee.Filter.eq('label', ee.Number(year).format('%d'))).first()
      return ui.Panel([
        ui.Label(year),
        ui.Thumbnail({
          image: image,
          params: {
            dimensions: '400x200',
            region: bounds.getInfo(),
            format: 'png'
          },
          style: {height: '200px', width: '400px'}      
        })
      ])
    })
    
    var panel = ui.Panel({
      widgets: controls,
      layout: ui.Panel.Layout.flow('vertical'),
      style: { width: '450px' }
    })
    ui.root.add(panel)
  })
  
}
