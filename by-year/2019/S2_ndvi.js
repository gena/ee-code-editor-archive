/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var images = ee.ImageCollection("COPERNICUS/S2");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.addLayer(images, {min:500, max:2500}, 'raw', false)

var image = images
  .select(['B8','B4','B3'])
  .reduce(ee.Reducer.percentile([20]))
  
Map.addLayer(image, {min:500, max:2500}, '20%')

var cover = ee.Image('MODIS/051/MCD12Q1/2012_01_01').select('Land_Cover_Type_1');

var ndvi = image.divide(10000).normalizedDifference()

var palette = [ 'ffffff', '000000', 'ffffff', 'd01c8b', 'f1b6da', 'b8e186', '4dac26' ]

Map.addLayer(ndvi, {min:-0.8, max:0.8, palette: palette}, '20% ndvi');