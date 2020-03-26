/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Percentiles.js

var percentiles = [10, 20, 30, 40, 50]

Map.setCenter(-123.94, 39.91, 14)
var bounds = Map.getBounds(true);
print(ee.Geometry(bounds).centroid(100))

var p = l8.filterDate('2014-01-01', '2015-01-01').filterBounds(bounds).reduce(ee.Reducer.percentile(percentiles)).clip(bounds)
  
for(var i = 0; i < percentiles.length; i++) {
  var v = percentiles[i];
  Map.addLayer(p.select('B6_p' + v, 'B5_p' + v, 'B3_p' + v), {min: 0.05, max: 0.5}, v.toString())
}
