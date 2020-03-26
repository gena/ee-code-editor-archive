/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// load collection but refine by location/date/cloud cover
var filtered = l8
      .filterBounds(Map.getBounds(true))
      .filterDate('2013-05-01', '2016-05-01')
      .filterMetadata('CLOUD_COVER', 'less_than', 30)

Map.addLayer(filtered);
