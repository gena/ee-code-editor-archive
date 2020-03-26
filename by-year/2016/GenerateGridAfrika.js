function app() {
  var countries = ee.FeatureCollection('ft:1zQnCHOzCpslDSBmVnpVPo6kVM0GopHvqsqdWKuwh')
  var afrika = countries.filter(ee.Filter.eq('REGION', 'Africa'))
  
  Map.addLayer(afrika, {}, 'Afrika')

  // get bound coords
  var coords = afrika.geometry().bounds(10000).coordinates().get(0)
  coords = ee.List(coords)
  var ll = ee.List(coords.get(0))
  var ur = ee.List(coords.get(2))

  var xmin = ll.get(0)
  var xmax = ur.get(0)
  var ymin = ll.get(1)
  var ymax = ur.get(1)
  
  var dx = 4
  var dy = 4
  
  // generate grid and filter by geometry
  var grid = generateGrid(xmin, ymin, xmax, ymax, dx, dy)
    .filterBounds(afrika)
    
  Map.addLayer(grid, {}, 'grid')
    
}





















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


app()