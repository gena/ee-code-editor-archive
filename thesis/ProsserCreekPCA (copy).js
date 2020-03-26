/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l5 = ee.ImageCollection("LANDSAT/LT5_L1T_TOA"),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
l8 = l8.filterBounds(Map.getBounds(true)).filterDate('2013-01-01', '2014-01-01')
  .map(function(i) { return i.resample('bicubic')})
 
var image = l8.reduce(ee.Reducer.percentile([15])).rename(ee.Image(l8.first()).bandNames())


Map.addLayer(image, {bands:['B6', 'B5', 'B3'], min: 0.03, max:0.5})

var ndwi = image.normalizedDifference(['B5', 'B3'])
Map.addLayer(ndwi, {min: -0.5, max:0.5}, 'ndwi')

var edgeNdwi0 = ndwi.zeroCrossing()

Map.addLayer(edgeNdwi0.mask(edgeNdwi0), {palette:['ffffff']}, 'ndwi = 0')

var edge = ee.Algorithms.CannyEdgeDetector(ndwi, 0.4, 0.7)
Map.addLayer(edge.mask(edge), {palette:['ff0000']}, 'ndwi edges')