/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var image = ee.Image(l8.select(['B6', 'B5', 'B3'])
  .filterBounds(ee.Geometry(Map.getBounds(true)).centroid(10)).toList(1, 2).get(0))
  
Map.addLayer(image, {min: 0.03, max: 0.3}, 'image')

Map.addLayer(image, {min: 0.03, max: 0.3}, 'image (bicubic)')