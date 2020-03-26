/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Polygon(
        [[[5.570068359375, 53.303800442779455],
          [6.61651611328125, 53.347272226430086],
          [6.617889404296875, 53.7503348957998],
          [5.552215576171875, 53.688574990027874]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var debug = true

function app() {
  var s2 = ee.ImageCollection('COPERNICUS/S2')
    .filterBounds(geometry)
    .select(['B12', 'B8', 'B3'], ['swir', 'nir', 'green'])
    .filterDate('2016-01-01', '2017-01-01')
  
  print('Original image count:', s2.size())
  
  var s2Groupped = mosaicByTime(s2)  
  
  print('Groupped image count:', s2Groupped.size())

  Map.addLayer(s2Groupped.count().divide(s2.count()).select(0), {min: 0, max: 1}, 'ratio', false)
  
  
  var l8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')
    .filterBounds(geometry)
    .select(['B8', 'B6', 'B3'], ['swir', 'nir', 'green'])
    .filterDate('2016-01-01', '2017-01-01')
    
  s2 = s2.map(function(i) { return i.divide(10000).float() })
  s2Groupped = s2Groupped.map(function(i) { return i.divide(10000).float() })
  
  var original = ee.ImageCollection(s2.merge(l8)).reduce(ee.Reducer.percentile([20])).clip(geometry)
  var corrected = ee.ImageCollection(s2Groupped.merge(l8)).reduce(ee.Reducer.percentile([20])).clip(geometry)
  
  Map.addLayer(original, {min: 0.05, max: 0.3}, 'BAD')
  Map.addLayer(corrected, {min: 0.05, max: 0.3}, 'GOOD')
  
  Map.addLayer(original.subtract(corrected).reduce(ee.Reducer.sum()), {min: -0.05, max: 0.05, palette: ['0000ff', 'ffffff', 'ff0000']}, 'DIFF', true, 0.5)


  // filter mostly bad images
  var cloudFrequency = 0.73
  var clean = getMostlyCleanImages(s2Groupped, geometry, cloudFrequency)

  print(clean.size())
  print(ee.List(clean.aggregate_array('system:index')).size()) // BUG: size is not the same!
}

var TIME_FIELD = 'system:time_start'

/***
 * Sentinel-2 produces multiple images, resultsing sometimes 4x more images than the actual size. 
 * This is bad for any statistical analysis.
 * 
 * This function mosaics images by time. 
 */
function mosaicByTime(images) {
  var distinct = images.distinct(TIME_FIELD)

  var filter = ee.Filter.equals({ leftField: TIME_FIELD, rightField: TIME_FIELD });
  var join = ee.Join.saveAll('matches')
  var results = join.apply(distinct, images, filter)

  // mosaic
  results = results.map(function(i) {
    var mosaic = ee.ImageCollection.fromImages(i.get('matches')).mosaic()
    
    return mosaic.copyProperties(i).set(TIME_FIELD, i.get(TIME_FIELD))
  })
  
  return ee.ImageCollection(results)
}

function addQualityScore(images, g) {
  var scorePercentile = 95

  var scale = 5000

  return images  
    .map(function(i) { 
      return i.set({
        score: i.select('nir').add(i.select('green'))
          .reduceRegion(ee.Reducer.percentile([scorePercentile]), g, scale).values().get(0)
      })
    })
}

function getMostlyCleanImages(images, g, cloudFrequency) {
  var size = images.size()
  
  images = addQualityScore(images, g)

  var scoreMin = 0.09
  var scoreMax = images.reduceColumns(ee.Reducer.percentile([ee.Number(1).subtract(cloudFrequency).multiply(100)]), ['score']).values().get(0)

  images = images
    .filter(ee.Filter.and(ee.Filter.gte('score', scoreMin), ee.Filter.lte('score', scoreMax)))
   
  return images.set({scoreMax: scoreMax})
}

app()