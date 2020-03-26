/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2"),
    fa = ee.Image("WWF/HydroSHEDS/15ACC"),
    fa90 = ee.Image("users/gena/GlobalHAND/90m-global/fa");
/***** End of imports. If edited, may not auto-convert in the playground. *****/

var percentile = 15

var p = s2.select(['B3', 'B8']).reduce(ee.Reducer.percentile([percentile])).rename(['B3', 'B8'])

Map.addLayer(p, {bands: ['B3', 'B8', 'B3'], min: 100, max:3000}, percentile + '%')

var ndwi = p.normalizedDifference(['B3', 'B8'])
Map.addLayer(ndwi, {min: -0.5, max: 0.5}, 'NDWI')

Map.addLayer(fa.mask(fa.gt(10)), {}, 'flow accumulation')

Map.addLayer(fa90.mask(fa90.gt(100)), {}, 'fa 90 > 100')
