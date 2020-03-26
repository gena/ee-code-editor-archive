/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var alos = ee.Image("JAXA/ALOS/AW3D30_V1_1"),
    geometry = /* color: #98ff00 */ee.Geometry.Point([-44.149549434236405, -20.095060671459574]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var temp = ee.ImageCollection("NASA/GLDAS/V021/NOAH/G025/T3H")
  .select('SoilTMP0_10cm_inst')
  
temp = temp
  .filterDate('2014-01-01', '2018-01-01')

var chart = ui.Chart.image.series({
  imageCollection: temp, 
  region: geometry, 
  reducer: ee.Reducer.median(), 
  scale: 5000
})
chart.setOptions({
  vAxis: { title: 'Temperature [K]' }
})
print(chart)

temp = temp
  .filterDate('2018-01-01', '2018-02-01')
  
var palettes = require('users/gena/packages:palettes');
var utils = require('users/gena/packages:utils');

var dem = alos.select('MED')

// Map.addLayer(temp)

temp = temp.first().visualize({
  min: 280,
  max: 311,
  palette: palettes.colorbrewer.RdYlGn[9].slice(0).reverse()
})

// temp = utils.hillshadeRGB(temp, dem, 1.0, 30, 315, 35, true)

Map.addLayer(temp, {}, 'temp');