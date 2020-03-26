/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: 98ff00 */ee.Geometry.Polygon(
        [[[-111.005859375, 35.67514743608468],
          [-111.533203125, 38.13455657705414],
          [-112.9833984375, 42.35854391749706],
          [-123.134765625, 40.88029480552824],
          [-122.255859375, 34.016241889667015]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/***
 * Generates regular grid using given bounds, specified as geometry.
 */
var generateGrid = function(xmin, ymin, xmax, ymax, dx, dy) {
  var xx = ee.List.sequence(xmin, xmax, dx)
  var yy = ee.List.sequence(ymin, ymax, dy)
  
  var cells = xx.map(function(x) {
    return yy.map(function(y) {
      var x1 = ee.Number(x).subtract(ee.Number(dx).multiply(0.5))
      var x2 = ee.Number(x).add(ee.Number(dx).multiply(0.5))
      var y1 = ee.Number(y).subtract(ee.Number(dy).multiply(0.5))
      var y2 = ee.Number(y).add(ee.Number(dy).multiply(0.5))
      
      var coords = ee.List([x1, y1, x2, y2]);
      var rect = ee.Algorithms.GeometryConstructors.Rectangle(coords);
      return ee.Feature(rect)
    })
  }).flatten();

  return ee.FeatureCollection(cells);
}

Map.centerObject(geometry, 6);

var bounds = geometry.bounds().getInfo().coordinates[0]
var xmin = bounds[0][0];
var xmax = bounds[1][0];
var ymin = bounds[0][1];
var ymax = bounds[2][1];

var dx = 0.2
var dy = 0.2

var grid = generateGrid(xmin, ymin, xmax, ymax, dx, dy)
  .filterBounds(geometry); // comment me to get a complete grid
  
print('Cell count: ', grid.size())

var gridImage = ee.Image().toByte().paint(grid, 1, 1);
Map.addLayer(gridImage.mask(gridImage), {palette:['aa00aa']}, 'grid')

Export.table(grid, 'generate grid', {driveFileNamePrefix: 'grid', fileFormat: 'KML'})
