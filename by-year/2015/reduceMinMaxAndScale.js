/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var images = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
print(Map.getCenter())
Map.setCenter(-76.74, 38.59, 13)

var bounds = Map.getBounds(true);

var image = ee.Image(images.filterBounds(bounds).filterMetadata('CLOUD_COVER', 'less_than', 10).first())

Map.addLayer(image.select(['B4', 'B3', 'B2']), {min:[0.05, 0.05, 0.05], max:[0.3, 0.3, 0.4]})

// is it possible to make them return approximately the same values?
print(image.reduceRegion(ee.Reducer.min(), bounds, 30).get('B4'))
print(image.reduceRegion(ee.Reducer.min(), bounds, 300).get('B4'))
print(image.resample('bicubic').reduceRegion(ee.Reducer.min(), bounds, 300).get('B4'))

