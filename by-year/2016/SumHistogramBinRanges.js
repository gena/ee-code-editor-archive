/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var region = /* color: d63000 */ee.Geometry.Polygon(
        [[[-122.1514892578125, 38.35673412466715],
          [-122.14599609375, 37.76854362092148],
          [-121.46484375, 37.71207219310847],
          [-121.5087890625, 38.37396220263095]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var image = ee.Image('srtm90_v4');

var bins = ee.Array([0, 5, 20, 80, 320, 1250, 5000]);

// Map each pixel value to an array with a '1' in the appropriate bin.
var binned = image.gte(bins.slice(0, 0, -1))
             .and(image.lt(bins.slice(0, 1)));

// Sum over the pixels we're interested in.
print(binned.toInt32().reduceRegion(ee.Reducer.sum().forEachElement(), region));
