var dams = ee.FeatureCollection('ft:1gtV2qZY2sVBpz-_1_1jndm0eJmuvJ7hN6s5ooV9I')
  .filter(ee.Filter.and(ee.Filter.neq('YEAR', -99), ee.Filter.neq('CATCH_SKM', -99)))

Map.addLayer(dams, {}, 'dams')

// sort features using two columns
function dumpDam(d) {
  print(d.get('YEAR'))
  print(d.get('CATCH_SKM'))
}

// 1. sort two times
dams = dams
  .sort('YEAR')
  .sort('CATCH_SKM')

dumpDam(ee.Feature(dams.first()))

// 2. compute sort column and then sort
dams = dams
  .map(function(f) { return f.set('sort', ee.Number(f.get('YEAR')).multiply(1000000000).add(f.get('CATCH_SKM'))) })
  .sort('sort')

dumpDam(ee.Feature(dams.first()))
