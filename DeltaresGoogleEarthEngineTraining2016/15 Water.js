/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    dam = /* color: d63000 */ee.Geometry.Point([65.50529479980469, 38.33761692801908]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.centerObject(dam, 12)

var image = ee.Image(l8
  .filterBounds(Map.getCenter())
  .filterMetadata('CLOUD_COVER', 'less_than', 15)
  .select(['B6','B5','B3'])
  .toList(1, 10).get(0))
  
Map.addLayer(image, {min: 0.05, max: 0.5}, 'landsat 8')  

var ndwi = image.normalizedDifference(['B3', 'B5'])

// ndwi = ndwi.unitScale(0, 0.5)

Map.addLayer(ndwi, {min:0, max:1}, 'NDWI', false)

Map.addLayer(ndwi.mask(ndwi), {palette:['000055', '0000ff']}, 'water mask')

var edge = ee.Algorithms.CannyEdgeDetector(ndwi, 0.99)
Map.addLayer(edge.mask(edge), {palette:['ffffff']}, 'reservoir edge')
