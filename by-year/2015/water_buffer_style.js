/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.setCenter(-77.32, 38.51, 16)
print(Map.getCenter())
print(Map.getScale())

var bands = ['B4', 'B3', 'B2', 'B5', 'B6', 'B8'];

var image = l8
  .filterBounds(Map.getBounds(true))
  .select(bands).reduce(ee.Reducer.percentile([25])).rename(bands)
  
var mndwi = image
  .normalizedDifference(['B3', 'B6']);

var waterMask = mndwi.gt(0);
var water = mndwi.mask(waterMask).unitScale(0, 0.3);
var waterVis = water.visualize({palette: ['a0a0ff', '000033'], opacity: 0.8})
Map.addLayer(waterVis, {}, 'water', false)

function smoothenMask(img, includeSmall) {
  return img
    .focal_mode(14, 'circle', 'meters', 4)
}

function smoothen(img) {
  return img
    .focal_mean(25, 'circle', 'meters', 2)
}

var waterMask = smoothenMask(mndwi.gt(0))
var water = smoothen(mndwi).mask(waterMask).unitScale(0, 0.3)
var waterVis = water.visualize({palette: ['a0a0ff', '000033'], opacity: 0.8})
Map.addLayer(waterVis, {}, 'water')
