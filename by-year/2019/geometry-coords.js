/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Polygon(
        [[[-113.466796875, 33.358061612778876],
          [-113.37890625, 36.94989178681327],
          [-114.697265625, 37.996162679728116],
          [-118.740234375, 36.80928470205937],
          [-119.70703125, 34.016241889667015]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.addLayer(ee.Image(1), {palette: ['ffffff']})

var bounds = geometry.bounds()
Map.addLayer(bounds)

var coords = ee.List(bounds.coordinates().get(0))

Map.addLayer(ee.Geometry.Point(coords.get(0)), {color: 'red'})
Map.addLayer(ee.Geometry.Point(coords.get(1)), {color: 'green'})
Map.addLayer(ee.Geometry.Point(coords.get(2)), {color: 'blue'})
Map.addLayer(ee.Geometry.Point(coords.get(3)), {color: 'orange'})