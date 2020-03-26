/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// http://tahoe.usgs.gov/bath.html

Map.addLayer(l8.select([6,5,2]).reduce(ee.Reducer.percentile([15])), {min:0.05, max:0.3}, '15%')
Map.addLayer(l8.select([6,5,2]).reduce(ee.Reducer.percentile([60])), {min:0.05, max:0.3}, '60%')