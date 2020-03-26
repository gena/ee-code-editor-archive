// Imported as a single feature only
var basin = ee.Feature(ee.FeatureCollection("users/gena/test").first())

print('Single', basin)

Map.addLayer(basin, {}, 'GOOD: single feature SHP')

// Imported as a large file - BUG, hole polygons are imported as separate geometries
var basin = ee.Feature(ee.FeatureCollection("users/gena/hybas_lev06_v1c")
  .filter(ee.Filter.eq('hybas_id', 7060061520)).first())

print('Multiple', basin)

Map.addLayer(basin, {}, 'BAD: multiple features SHP')
