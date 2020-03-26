function moveAssets() {
  var transects = ee.FeatureCollection("users/fbaart/merged")
  var pointsFuture = ee.FeatureCollection("users/fbaart/future-shorelines/merged-2020-02")
  
  Map.addLayer(transects, {}, 'transects')
  Map.addLayer(pointsFuture, { color: 'red'}, 'future shoreline points')
  
  Export.table.toAsset(transects, 'transects', 'projects/dgds-gee/shorelines/transects')
  Export.table.toAsset(pointsFuture, 'pointsFuture', 'projects/dgds-gee/shorelines/future_shorelines_original')
}

function exportFutureTransectPoints() {
  var transects = ee.FeatureCollection("users/fbaart/merged")
  var pointsFuture = ee.FeatureCollection("users/fbaart/future-shorelines/merged-2020-02")

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
    assetId: 'projects/dgds-gee/shorelines/future_shorelines_with_duplicates'
  })
}

function deleteDuplicates() {
  var transects = ee.FeatureCollection("users/fbaart/merged")
    .filterBounds(Map.getBounds(true))
  var pointsFuture = ee.FeatureCollection('projects/dgds-gee/shorelines/future_shorelines_with_duplicates')
    .filterBounds(Map.getBounds(true))
  
  Map.addLayer(pointsFuture, { color: 'red' }, 'future transects')
  Map.addLayer(transects, { }, 'transects')
  
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
  var pointsFutureUniqueBest = ee.FeatureCollection(simpleJoin.apply(pointsFutureUnique, pointsFuture, filter))
    .map(function(f) {
      var features = ee.FeatureCollection(ee.List(f.get('all'))).sort('distance')
      
      return features.first()
    })
    
  print(pointsFutureUniqueBest.first())
    
  Map.addLayer(pointsFutureUniqueBest.style({ pointSize: 5, color: '00ff00', fillColor: '00ff0033' }), {}, 'good features')
  
  Export.table.toAsset(pointsFutureUniqueBest, 'future_shorelines_noduplicates', 'projects/dgds-gee/shorelines/future_shorelines')
  
}

function showFinal() {
  var transects = ee.FeatureCollection("users/fbaart/merged")
  var pointsFuture = ee.FeatureCollection("users/fbaart/future-shorelines/merged-2020-02")
  // var pointsFutureNew = ee.FeatureCollection('projects/dgds-gee/shorelines/future_shorelines')
  
  Map.addLayer(transects, {}, 'transects')
  Map.addLayer(pointsFuture, {}, 'future shorelines (original)')
  // Map.addLayer(pointsFutureNew, { color: 'red' }, 'future shorelines (mapped)')
}

// moveAssets()
// exportFutureTransectPoints()
deleteDuplicates()

// showFinal()