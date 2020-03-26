/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l5 = ee.ImageCollection("LANDSAT/LT5_L1T_TOA"),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
print(Map.getCenter())
Map.setCenter(103.82, 12.84, 7)
var add = function(ic, name) { Map.addLayer(ic.select(0).count(), {min:0, max:500, palette:['ff0000', '00ff00']}, name); }
add(l5, 'l5')
add(l7, 'l7')
add(l8, 'l8')