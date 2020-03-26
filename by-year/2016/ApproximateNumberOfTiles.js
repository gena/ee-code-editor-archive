/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var region = /* color: d63000 */ee.Geometry.Polygon(
        [[[-121.31103515625, 37.11652618491117],
          [-121.81640625, 38.401949082378245],
          [-123.189697265625, 38.30718056188316],
          [-122.574462890625, 37.13404537126446]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function approxNumTiles(region, maxZoom) {
  // Compute the Earth's circumference in meters.
  var earthCircumference = 2 * Math.PI * 6378137;
  // Compute the area in projected "meters" per tile at the given max zoom level.
  var areaPerTile = Math.pow(earthCircumference / Math.pow(2, maxZoom), 2);
  // Compute the area of bounds of the region in projected "meters".
  var boundsArea = region.bounds().area(1, 'SR-ORG:6627');
  // A heuristic to approximate the number of map tiles required to cover the bounds
  // of the region at the given max zoom level.
  var approxSizeInTiles = boundsArea.divide(areaPerTile).sqrt().add(1).ceil().pow(2);
  // Finally, account approximately for the lower zoom levels.
  return approxSizeInTiles.multiply(4/3).ceil();
}

print(approxNumTiles(region, 12));

Export.map.toCloudStorage({
  image: ee.Image('USGS/SRTMGL1_003').visualize({min:0, max:4000, gamma:2}),
  description: 'tile-count-test',
  bucket: 'mdh-test',
  path: 'tile-count-test',
  maxZoom: 12,
  region: region,
});