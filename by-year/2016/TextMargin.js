/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: d63000 */ee.Geometry.Polygon(
        [[[-135.17578125, 25.799891182088334],
          [-113.994140625, 32.62087018318113],
          [-118.388671875, 45.89000815866185],
          [-152.75390625, 36.597889133070225]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var bounds = geometry.bounds()

var marginSize = 10 // scale units
var count = 10
var scale = Map.getScale()

Map.addLayer(bounds, {}, 'bounds')

var locations = getLeftMarginLocations(bounds, marginSize, count, scale)
Map.addLayer(ee.FeatureCollection(locations), {}, 'cells')

/***
 * Makes offset from the left margin and splits into count pieces, returns locations.
 */
function getLeftMarginLocations(bounds, marginSize, count, scale) {
  var leftMarginSize = ee.Number(marginSize).multiply(scale)
  var boundsSmall = bounds.buffer(leftMarginSize.multiply(-1)).bounds()
  var coords = ee.List(boundsSmall.coordinates().get(0))
  var pt0 = ee.List(coords.get(0))
  var pt3 = ee.List(coords.get(3))
  var leftMarginLine = ee.Geometry.LineString([pt0, pt3])

  var distances = ee.List.sequence(0, leftMarginLine.length(), leftMarginLine.length().divide(count))
  var lineToStartPoint = function(g) { 
    var coords = ee.Geometry(g).coordinates().get(0)
    return ee.Feature(ee.Algorithms.GeometryConstructors.Point(coords))
  }
  
  return ee.List(leftMarginLine.cutLines(distances).geometries().map(lineToStartPoint))
}