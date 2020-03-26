var transects = ee.FeatureCollection("users/fbaart/merged")
  .filterBounds(Map.getBounds(true))

Map.addLayer(transects, {}, 'transects')

function exportFutureTransectPoints() {
  var pointsFuture = ee.FeatureCollection("users/fbaart/future-shorelines/merged-2020-02")
    .filterBounds(Map.getBounds(true))
  
  Map.addLayer(pointsFuture, { color: 'red'}, 'future shoreline points')
  
  pointsFuture = pointsFuture.randomColumn('feature_id')
  
  var transectStart = transects.map(function(f) {
    var coords = f.geometry().coordinates()
  
    return f.setGeometry(ee.Geometry.Point(coords.get(0)))
  })
  
  Map.addLayer(transectStart, { color: 'green'}, 'transect start')
  
  // spatial join, for every transect search for nearest points
  
  // Define a spatial filter, with distance 100 km.
  var distFilter = ee.Filter.withinDistance({
    distance: 1000,
    leftField: '.geo',
    rightField: '.geo',
    maxError: 10
  })
  
  // Define a saveAll join.
  var distSaveAll = ee.Join.saveBest({
    matchKey: 'point',
    measureKey: 'distance'
  })
  
  // Apply the join.
  var nearestPoints = distSaveAll.apply(transectStart, pointsFuture, distFilter)
    .map(function(f) {
      var pt = ee.Feature(f.get('point'))
      
      return f.copyProperties(pt)
    })
  
  var firstPoint = nearestPoints.first()
  Map.addLayer(nearestPoints, { color: 'blue'}, 'nearest points')
  
  var propertyNames = firstPoint.propertyNames().remove('point')
  
  Export.table.toAsset({ 
    collection: nearestPoints.select(propertyNames), 
    description: 'future_shoreline_points', 
    assetId: 'projects/dgds-gee/shorelines/transects_with_future'
  })
}

// exportFutureTransectPoints()

var pointsFuture = ee.FeatureCollection('projects/dgds-gee/shorelines/transects_with_future')
.filterBounds(Map.getBounds(true))

Map.addLayer(pointsFuture, { color: 'red' }, 'future transects')


// select best unique future coastline point (with min distance)

var pointsFutureUnique = pointsFuture.distinct(['feature_id'])
print(pointsFutureUnique.size(), pointsFuture.size())

// Use an equals filter to define how the collections match.
var filter = ee.Filter.equals({
  leftField: 'feature_id',
  rightField: 'feature_id'
})

// Create the join.
var simpleJoin = ee.Join.saveAll({
  matchesKey: 'all',
});

// Apply the join.
var pointsFutureUniqueBest = simpleJoin.apply(pointsFutureUnique, pointsFuture, filter)
  .map(function(f) {
    
  })
  
print(simpleJoined)

// Map.addLayer(simpleJoined, { color: 'green' })

// var filter = ee.Filter.lessThan({ leftField: 'distance', rightField: 'distance' })

// // Define a saveAll join.
// var bestPoints = ee.Join.saveBest({matchKey: 'point', measureKey: 'distance' })
//   .apply(pointsFutureUnique, pointsFuture, filter)

// print(bestPoints.first())

// print(pointsFuture.filter(ee.Filter.eq('feature_id', 0.3973060738128136))
//   .aggregate_array('distance'))