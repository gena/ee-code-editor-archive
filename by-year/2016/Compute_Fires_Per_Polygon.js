//  Apply reducer function over space using ImageCollection (a time serie) and multipolygon.

// ImageCollection
var firms = ee.ImageCollection('FIRMS').filterDate('2001-01-01', '2015-12-31').select('T21');

// Featurecollection
var buff08 = ee.FeatureCollection('ft:15VOJYhpiO5Emg5Je18nf7i_31Y_mjYxhUzWG2_gL'); 

print(buff08)
Map.centerObject(buff08);
Map.addLayer(buff08);

// compute presence of fire per features and image (date)
var fires = firms.map(function(image) {
  var date = ee.Date(image.get('system:time_start'));
  
  return image
    .reduceRegions({ collection: buff08, reducer: ee.Reducer.anyNonZero(), scale: 5000}) // 1/0 if any fire is found, per polygon
    .map(function(feature) { return feature.set('date', date.format('YYYY-MM-dd')) }) // save date
}).flatten()

// skip features without fire
fires = fires
  .filter(ee.Filter.eq('any', 1))

// Export result
Export.table (fires, 'Firms_count', {'fileFormat': 'CSV'});

// show first 10
// print(fires.toList(10))
// print(Chart.feature.groups(fires.limit(10), 'date', 'any', 'date'))

