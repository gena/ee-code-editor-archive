/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var center = /* color: d63000 */ee.Geometry.Point([-100.107421875, 38.376115424036044]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/***
 * Generates a regular grid using given bounds.
 */
var generateGrid = function(xmin, ymin, xmax, ymax, dx, dy) {
  var xx = ee.List.sequence(xmin, xmax, dx)
  var yy = ee.List.sequence(ymin, ymax, dy)

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

/**
 * Covers geometry with a regular grid.
 */
var coverByGrid = function(geom, dx, dy) {
  var bounds = ee.Geometry(geom).bounds()
  var coords = ee.List(bounds.coordinates().get(0))
  var ll = ee.List(coords.get(0))
  var ur = ee.List(coords.get(2))
  var xmin = ll.get(0)
  var xmax = ur.get(0)
  var ymin = ll.get(1)
  var ymax = ur.get(1)
  
  return generateGrid(xmin, ymin, xmax, ymax, dx, dy).filterBounds(geom).map(function(c) { return ee.Feature(c).intersection(geom) })
}

var states = ee.FeatureCollection('ft:1S4EB6319wWW2sWQDPhDvmSBIVrD3iEmCLYB7nMM')
Map.addLayer(ee.Image().paint(states, 1, 1), {}, 'states')

var state = states.filter(ee.Filter.or(ee.Filter.eq('StateName', 'Nevada'))).union().geometry(10000);

var stateGrid = coverByGrid(state, 0.5, 0.5)
Map.addLayer(stateGrid, {color:'222299'}, 'grid')

Map.centerObject(center, 5)




/*
var input = image.eq(classes.get('forest')).multiply(ee.Image.pixelArea().divide(1000000))

// 1 degree cells
var area = generateGridForGeometry(conus.geometry(), 1, 1).map(function(c) {
    var geometry = s.intersection(c, 100).geometry();
    return ee.Feature(null, 
      input.reduceRegion({
          reducer: ee.Reducer.sum(), 
          geometry: geometry, 
          scale: 30,
          maxPixels: 1e9}))
  })
}).flatten()

*/