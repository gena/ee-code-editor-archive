// ================================ simple TDD lib
var currentTestName = null; // current test name

function test(testName, assertFunction) {
  currentTestName = testName;
  print('Test: ' + testName + ' ...');
  assertFunction(testName);
}

var assert = {
  isTrue: function(assertionName, condition) {
    print(ee.String(ee.Algorithms.If(ee.Algorithms.IsEqual(condition, 1), ' passed: ', 'failed: ')).cat(assertionName))
  },
  
  isFalse: function(assertionName, condition) {
    print(ee.String(ee.Algorithms.If(ee.Algorithms.IsEqual(condition, 0), ' passed: ', 'failed: ')).cat(assertionName))
  }
}

function show(element, name, vis) {
  Map.addLayer(element, vis || {}, currentTestName + ', ' + name)
}

// ================================ community.FeatureCollection

var community = {
  FeatureCollection: {
    contains: function(collection, feature) {
      var propertyFilter = feature.propertyNames().iterate(
        function(propertyName, filter) {
          return ee.Filter(filter).and(ee.Filter.eq(propertyName, feature.get(propertyName)))
        },
        ee.Filter.equals('.geo', feature.geometry())
      )
      
      return collection.filter(propertyFilter).size().gte(1)
    }
  } 
}

// ================================ tests
test('check if point features are contained', function(name) {
  var f1 = ee.Feature(ee.Geometry.Point(0,-1), {'p1': 1})
  var f2 = ee.Feature(ee.Geometry.Point(1,-1), {'p1': 2})
  var f3 = ee.Feature(ee.Geometry.Point(2,-1), {'p1': 3})
  
  var fc = ee.FeatureCollection([f1, f2])

  // visualize  
  show(fc, 'fc -feature collection', {color:'green'})
  show(f3, 'f3 - not in collection', {color:'red'})
  
  // assert
  assert.isTrue('f1 is in collection', community.FeatureCollection.contains(fc, f1))
  
  assert.isFalse('f3 is not in collection', community.FeatureCollection.contains(fc, f3))
});

test('contains for features with equal bounds', function(name) {
  var f1 = ee.Feature(ee.Geometry.Polygon([[0, 0], [1, 0], [1, 1], [0, 1]], null, false), {'a': 0})
  var f2 = ee.Feature(ee.Geometry.Polygon([[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]], null, false), {'a': 0})

  var fc = ee.FeatureCollection([f1])

  // visualize  
  show(f1, 'f1', {color: 'green'})
  show(f2, 'f2', {color: 'red'})

  // assert
  var margin = 1;
  assert.isTrue('f1 and f2 bounds are same', f1.bounds(margin).difference(f2.bounds(margin), margin).area().eq(0))
  
  assert.isFalse('f2 is not in collection - geometries are not equal', community.FeatureCollection.contains(fc, f2))
});

test('works for multiple equal feautres', function(name) {
  var f1 = ee.Feature(ee.Geometry.Point(0,2), {'p1': 1})

  var fc = ee.FeatureCollection([f1, f1]) // add the same feature two times

  // assert
  assert.isTrue('f1 is in collection', community.FeatureCollection.contains(fc, f1))
});

test('contains gives true for equal feautre not in collection', function(name) {
  var f1 = ee.Feature(ee.Geometry.Point(0,2), {'p1': 1})
  var f2 = ee.Feature(ee.Geometry.Point(0,2), {'p1': 1})

  var fc = ee.FeatureCollection([f1])

  // assert
  assert.isTrue('f2 is also in collection (compare by value)', community.FeatureCollection.contains(fc, f2))
});
