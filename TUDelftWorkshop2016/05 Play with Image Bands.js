/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Select bands to visualize, Google for wavelengths used for different satellite missions
// See http://landsat.gsfc.nasa.gov/?p=10643 for a list of bands.
var filtered = l8.filterBounds(Map.getBounds(true));

Map.addLayer(filtered, {min:0, max:0.3, bands:['B4','B3','B2']}, 'RGB');
Map.addLayer(filtered, {min:0, max:0.3, bands:['B5','B4','B3']}, 'False Color');
