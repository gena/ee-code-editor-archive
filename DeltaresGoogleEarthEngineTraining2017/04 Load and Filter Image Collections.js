/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var filtered = l8
      .filterBounds(Map.getBounds(true))
      .filterDate('2013-05-01', '2016-05-01')
      .filterMetadata('CLOUD_COVER', 'less_than', 30);

Map.addLayer(filtered);

// TODO: visualize resulting image (mosaic) as RGB, use 0.3 as a max reflectance and Google required Landsat 8 bands

// TODO: add a filter to select only images with SUN_ELEVATION > 50