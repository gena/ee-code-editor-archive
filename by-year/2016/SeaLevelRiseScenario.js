/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var srtm = ee.Image("USGS/SRTMGL1_003");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.addLayer(srtm.gt(0), {}, 'SRTM > 0', false)
Map.addLayer(srtm.gt(1), {}, 'SRTM > 1m (3.28 feet)', false)

var diff = srtm.gt(0).subtract(srtm.gt(1))
Map.addLayer(diff.mask(diff), {palette:['ff0000']}, 'diff (80 year scenario)')