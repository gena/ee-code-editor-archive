/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var image = ee.Image(l8.first())

function toFeature(image) {
  return ee.Feature(image.select(0).geometry(), image.toDictionary())
}

var feature = toFeature(image)

Map.addLayer(feature)
Map.centerObject(feature)

Export.table.toDrive(ee.FeatureCollection([feature]))
