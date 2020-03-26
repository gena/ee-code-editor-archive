var coords = [[0,0], [1,1]]

var geoms = ee.List(coords).map(function(o) {
  return ee.Geometry.Point(o) // OK, Geometry is constructed and returned?
})

var features1 = ee.List(geoms).map(function(g) { 
  return ee.Feature(g) // ERROR, returns ee.Geometry instead of ee.Feature
});
print('step1', features1.get(0))

var features2 = ee.List(geoms).map(function(g) { 
  return ee.Algorithms.Feature(g) // OK, ee.Feature is returned
});
print('step2', features2.get(0))

var features3 = geoms.map(function(f) {
  return ee.Feature(f).geometry(); // OK, Feature is constructed and its geometry is returned
})
print('step3', features3.get(0))

var features4 = ee.FeatureCollection(geoms).map(function(f) {
  return ee.Feature(f).geometry(); // FAILS, geometry is supposed to just get a read-only geometry?
})
print('step4', features4.get(0))

