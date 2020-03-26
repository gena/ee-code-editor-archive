/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: d63000 */ee.Geometry.LineString(
        [[-137.28515625, 34.88593094075317],
         [-128.84765625, 43.19716728250127],
         [-119.267578125, 39.707186656826565],
         [-105.99609375, 44.5278427984555]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var scale = 50000;

// convert line to coarse scale raster
var image = ee.Image().toByte()
  .paint(geometry, 1, 5)
  .reproject('EPSG:3587', null, scale)

// generate geometry
var rect = geometry.bounds().buffer(scale * 5)

// count pixels
var total = image.reduceRegion(ee.Reducer.sum(), rect, scale, null, null, false, 1e12, 15)
print(total)


// add layers
Map.addLayer(image, {}, 'raster')
Map.addLayer(rect, {}, 'rect')
