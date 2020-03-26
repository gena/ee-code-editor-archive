/***
 * Generates a regular grid using given bounds.
 */
var generateGrid = function(xmin, ymin, xmax, ymax, dx, dy) {
  var xx = ee.List.sequence(xmin, ee.Number(xmax).subtract(dx), dx)
  var yy = ee.List.sequence(ymin, ee.Number(ymax).subtract(dy), dy)
  
  var cells = xx.map(function(x) {
    return yy.map(function(y) {
      var x1 = ee.Number(x)
      var x2 = ee.Number(x).add(ee.Number(dx))
      var y1 = ee.Number(y)
      var y2 = ee.Number(y).add(ee.Number(dy))
      
      var coords = ee.List([x1, y1, x2, y2]);
      var rect = ee.Algorithms.GeometryConstructors.Rectangle(coords);
      return ee.Feature(rect)
    })
  }).flatten();

  return ee.FeatureCollection(cells);
}

var dx = 0.5, dy = 0.25
var xmin = 30 - dx * 0.5, xmax = 35 - dx * 0.5
var ymin = 48 - dy * 0.5, ymax = 51 - dy * 0.5

// generate regular grid 
var cells = generateGrid(xmin, ymin, xmax, ymax, dx, dy)
Map.addLayer(cells, {}, 'cells')

// get cell centers
var centers = cells.map(function(cell) { return cell.centroid() })
Map.addLayer(centers, {}, 'cell centers')

// shift cell centers randomly
var centersShifted = centers
  .randomColumn('offsetX', Math.round(Math.random()*1000))
  .randomColumn('offsetY', Math.round(Math.random()*1000))
  .map(function(pt) {
    var coords = pt.geometry().coordinates()
    var x = ee.Number(coords.get(0))
    var y = ee.Number(coords.get(1))
    var offsetX = ee.Number(pt.get('offsetX')).multiply(dx).subtract(dx*0.5)
    var offsetY = ee.Number(pt.get('offsetX')).multiply(dy).subtract(dy*0.5)

    return ee.Algorithms.GeometryConstructors.Point([x.add(offsetX), y.add(offsetY)])
  })

Map.addLayer(centersShifted, {color:'00ff00'}, 'cell centers, randomly shifted')
