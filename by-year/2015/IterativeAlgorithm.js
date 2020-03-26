/***
 * Algorithm to run iteratively.
 */
var algorithm = function(iteration, image) {
  return ee.Image(image).convolve(ee.Kernel.gaussian(30, 15, 'meters'))
}

/***
 * Runs an algorithm function iteratively using a given image as a start.
 */
var iterate = function(algorithm, count, image) {
  return ee.List.sequence(0, count - 1).iterate(algorithm, image)
}

Map.setCenter(-95.55, 35.79, 13) // US, Arkansas River

var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");

var image = ee.Image(l8.filterBounds(Map.getCenter()).first())
  .select(['B6', 'B5', 'B3'])

// Add retults of iterative run to map 
var count = 10; // number of iterations
Map.addLayer(ee.Image(iterate(algorithm, count, image)), {min: 0.03, max:0.5}, 'image')
