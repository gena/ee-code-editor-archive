/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    point = /* color: #d63000 */ee.Geometry.Point([4.381442070007324, 51.98525016185232]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.centerObject(point, 14)

// Select bands to visualize, Google for wavelengths used for different satellite missions

// See http://landsat.gsfc.nasa.gov/?p=10643 for a list of bands.
var filtered = l8.filterBounds(Map.getBounds(true));

Map.addLayer(filtered, {min:0, max:0.3, bands:['B4','B3','B2']}, 'RGB');
Map.addLayer(filtered, {min:0, max:0.3, bands:['B5','B4','B3']}, 'False Color');


// TODO: add Landsat 7 image collection instead of Landsat 8. 

// TODO: Which bands do we need to use to create the same composites as for Landsat 8?
