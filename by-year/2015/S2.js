/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.addLayer(s2.select(10).count(), {min:0, max:20, palette:['ff0000', '00ff00']}, 'count');

var image = s2
  .select(['B4', 'B3', 'B2'])
  .reduce(ee.Reducer.percentile([15]));

Map.addLayer(image, {min:500, max:[2500, 2500, 3500]}, 's2')