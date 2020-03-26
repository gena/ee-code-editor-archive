/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometryGradientBar = /* color: #d63000 */ee.Geometry.LineString(
        [[-178.34453125, 21.06881358552383],
         [-158.1296875, 24.151463374228346]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Create the panel for the legend items.
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

// Create and add the legend title.
var legendTitle = ui.Label({
  value: 'NO2 concentration, mol/m²',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 4px 0',
    padding: '0'
  }
});
legend.add(legendTitle);


var palettes = require('users/gena/packages:palettes')
var style = require('users/gena/packages:style')
var utils = require('users/gena/packages:utils')

// Paired
var palette = palettes.colorbrewer.Paired[12]

var min = ee.Number(0)
var max = ee.Number(1)

var textProperties = { fontSize:16, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 2, outlineOpacity: 0.6 }

// add a gradient bar
var labels = ee.List.sequence(min, max, max.subtract(min).divide(5))
var gradient = style.GradientBar.draw(geometryGradientBar, {
  min: min, max: max, palette: palette, labels: labels, format: '%.2f', text: textProperties
})
Map.addLayer(gradient, {}, 'gradient bar (DEM)')

var region = geometryGradientBar.bounds().buffer(Map.getScale()*20)


/*
var coords = ee.List(ee.Feature(region).geometry(1, 'EPSG:3857').coordinates().get(0))
var ll = ee.List(coords.get(0))
var ur = ee.List(coords.get(2))
var width = ee.Number(ur.get(0)).subtract(ll.get(0))
width = width.divide(Map.getScale()).int().getInfo()
print(width)
*/

var map = ui.Thumbnail(gradient, { 
  dimensions: 275,
  region: region.getInfo() })

legend.add(map)

Map.add(legend)



