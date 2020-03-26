/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var naip = ee.ImageCollection("USDA/NAIP/DOQQ"),
    s2 = ee.ImageCollection("COPERNICUS/S2");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.addLayer(s2.filterDate('2017-05-01', '2017-10-01').select(['B4', 'B3','B2']).reduce(ee.Reducer.percentile([20])), {min: 300, max: 3000}, 'S2')
Map.addLayer(ee.Image(naip.filterBounds(Map.getBounds(true)).select(['R','G','B']).mosaic()), {min:0, max: 255, gamma: 0.9}, 'NAIP')

print(ee.Image(naip.filterBounds(Map.getBounds(true)).first()).projection())
print(Map.getCenter())