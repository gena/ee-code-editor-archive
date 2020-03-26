/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var L8_BANDS = ['B6', 'B5', 'B3']
var L8_NAMES = ['swir1', 'nir', 'green']

var image = ee.Image(l8
  .filterBounds(Map.getCenter())
  .filterMetadata('CLOUD_COVER', 'less_than', 15)
  .select(L8_BANDS, L8_NAMES)
  .toList(1, 10).get(0))

Map.addLayer(image, {min: 0.05, max: 0.5}, 'landsat 8')  

var vis = {min:-1, max:1}

var ndwiXu = image.normalizedDifference(['green', 'swir1'])
Map.addLayer(ndwiXu, vis, 'MNDWI (Xu)')
var waterXu = ndwiXu.gt(0)
Map.addLayer(waterXu.mask(waterXu), {palette:['0000aa']}, 'MNDWI (Xu) > 0', false)

var ndwiMcFeeters = image.normalizedDifference(['green', 'nir'])
Map.addLayer(ndwiMcFeeters, vis, 'MNDWI (McFeeters)')
var waterMcFeeters = ndwiMcFeeters.gt(0)
Map.addLayer(waterMcFeeters.mask(waterMcFeeters), {palette:['0000aa']}, 'MNDWI (McFeeters) > 0', false)
