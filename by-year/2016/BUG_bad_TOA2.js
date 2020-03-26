var images = ee.ImageCollection('LANDSAT/LC8_L1T_TOA')

var bandNames = ee.Image(images.first()).bandNames()

images = images.select(bandNames.slice(0, -3))

images = images.filterBounds(Map.getBounds(true))

images = images.map(function(i) {
  var maxValue = i
    .select(0)
    .reduceRegion({reducer: ee.Reducer.max(), geometry: i.select(0).geometry(), scale: 100000, tileScale: 16})
    .values().get(0)

  return i.set('maxValue', maxValue)
})

var count = images.size()

var imagesBad = images.filter(ee.Filter.gt('maxValue', 1))

var maxValues = ee.List(imagesBad.aggregate_array('maxValue'))

var countBad = imagesBad.size()

print('Total number of images: ', count)
print('Number of bad TOA images: ', countBad)
print('Fraction of bad TAO images: ', countBad.divide(count))

var badIds = ee.List(imagesBad.aggregate_array('LANDSAT_SCENE_ID'))
print('Bad scene IDs: ', badIds)

var badSceneIdsAndValues = badIds.zip(maxValues)
var badSceneInfo = badSceneIdsAndValues.map(function(pair) { 
  var id = ee.List(pair).get(0)
  var maxValue = ee.List(pair).get(1)
  var image = ee.Image(images.filterMetadata('LANDSAT_SCENE_ID', 'equals', id).first())
  return [image.get('DATE_ACQUIRED'), image.get('SUN_ELEVATION'), maxValue]
})

print('Bad TOA images: ', badSceneInfo)

print(Chart.array.values(maxValues, 0))

// add layers
Map.addLayer(images, {}, 'images', false)

var bad = images.select([0]).max().gt(1)
Map.addLayer(bad, {palette:['000000','900000']}, 'L8>1')


var i1 = ee.Image('LANDSAT/LC8_L1T_TOA/LC80382272014195LGN00').select([5,4,2])
Map.addLayer(i1, {min:1, max:40}, '(1) evening, max: 33')
print(i1)

var i2 = ee.Image('LANDSAT/LC8_L1T_TOA/LC81760192015221LGN00').select([5,4,2])
Map.addLayer(i2, {min:0.03, max:0.3}, '(2) cloudy, max: 1.15')
print(i2)

