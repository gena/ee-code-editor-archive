/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA"),
    l5 = ee.ImageCollection("LANDSAT/LT5_L1T_TOA"),
    modis_terra = ee.ImageCollection("MODIS/MOD09GQ"),
    modis_aqua = ee.ImageCollection("MODIS/MYD09GQ"),
    geometry = /* color: d63000 */ee.Geometry.Point([105.897216796875, 11.102946786877578]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/

Map.centerObject(geometry, 10)

var images = [l8, l7, l5, modis_terra, modis_aqua]
var names = ['l8', 'l7', 'l5', 'T', 'A']
var date = ['DATE_ACQUIRED', 'DATE_ACQUIRED', 'DATE_ACQUIRED', 'system:time_start', 'system:time_start']

for(var i = 0; i < images.length; i++) {
  var ic = images[i]
      //.filterBounds(Map.getBounds(true))
      //.filterDate('2013-01-01', '2016-01-01')

  var count = ic.count()
  var minMax = count.reduceRegion(ee.Reducer.minMax(), Map.getBounds(true), 2000)
  var max = minMax.get(minMax.keys().get(0)).getInfo()
  var min = minMax.get(minMax.keys().get(1)).getInfo()
  print(names[i])
  print(min)
  print(max)

  Map.addLayer(ic, {}, names[i], false)
  Map.addLayer(count, {min:min, max:max}, names[i] + ' count')
}
