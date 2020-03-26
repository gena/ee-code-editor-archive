/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    geometry = /* color: d63000 */ee.Geometry.Point([-120.1523208618164, 39.38207950167204]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var start = '2015-03-08'
var stop = '2015-03-10'

Map.centerObject(geometry, 14)
Map.setOptions('HYBRID')

var image = ee.Image(s1.filterDate(start, stop).filterBounds(Map.getBounds(true)).filter(ee.Filter.eq('transmitterReceiverPolarisation', 'VV')).first()).select('VV')
  
Map.addLayer(image, {min: -20, max:10}, 'before correction')
  
// Compute the gray-level co-occurrence matrix (GLCM), get contrast.
var glcm = image.multiply(10).toInt().glcmTexture({size: 4});
print(glcm)
Map.addLayer(glcm, {bands: 'VV_ent', min: 0, max: 5, palette: ['0000CC', 'CC0000']}, 'entropy');


Map.addLayer(image.mask(glcm.select('VV_ent').gt(0.1)), {min: -20, max:10}, 'after correction')
