/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var glcf = ee.ImageCollection("GLCF/GLS_WATER"),
    water = ee.Image("users/gena/AU_Murray_Darling/MNDWI_15_water_WGS"),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.addLayer(l8.select(['B6','B5','B3']).reduce(ee.Reducer.percentile([20])),{min:0.03, max:0.4}, 'l8', false)

var water1 = glcf.map(function(i){return i.eq(2)}).mosaic()
var water2 = water.select(0).add(water.select(1)).add(water.select(2)).neq(0)
Map.addLayer(water2.mask(water2), {gamma:3}, 'AU')
Map.addLayer(water1.mask(water1), {palette:['ff6060']}, 'GLCF')

