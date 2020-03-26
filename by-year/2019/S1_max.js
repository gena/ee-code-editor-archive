/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var images = ee.ImageCollection("COPERNICUS/S1_GRD");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var filter = ee.Filter.and(
  ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH']),
  ee.Filter.eq('instrumentMode', 'IW'),
  ee.Filter.bounds(Map.getBounds(true))
) 

images = images.filter(filter)

Map.addLayer(images.select('VV', 'VH').max(), { min: -45, max: -5})
