/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l5 = ee.ImageCollection("LANDSAT/LT5_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var image = ee.Image(l5.filterBounds(Map.getCenter())
  .filterMetadata('CLOUD_COVER', 'less_than', 10).select(['B5','B4','B2']).first());

Map.addLayer(image, {min:0.05, max:0.5}, 'original')

var weights = [[-1, -1, -1], [-1, 9.0, -1], [-1, -1, -1]]
var kernel = ee.Kernel.fixed(3, 3, weights)
print(kernel)
Map.addLayer(image.convolve(kernel), {min:0.05, max:0.5}, 'sharpened 1')

// should result in the same kernel since it is already sum(K) == 1
var kernel = ee.Kernel.fixed(3, 3, weights, -1, -1, true)
print(kernel)
Map.addLayer(image.convolve(kernel), {min:0.05, max:0.5}, 'sharpened 2')

