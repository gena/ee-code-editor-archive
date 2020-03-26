/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var points = ee.FeatureCollection("users/gena/eo-bathymetry/covadem-points-test");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var style = require('users/gena/packages:style')
var palettes = require('users/gena/packages:palettes')

print(points.limit(10))
print(points.size())

var waterOccurrence = ee.Image("JRC/GSW1_0/GlobalSurfaceWater")
  .select('occurrence')
  .divide(100)
  .unmask(0)
  .resample('bicubic')

// PuBu[9]
// var palette = ["fff7fb","ece7f2","d0d1e6","a6bddb","74a9cf","3690c0","0570b0","045a8d","023858"]
var palette = ["ffffcc","ffeda0","fed976","feb24c","fd8d3c","fc4e2a","e31a1c","bd0026","800026"].reverse().slice(1)

// var palette = ['ffffb2', 'fecc5c', 'fd8d3c', 'f03b20', 'bd0026'].reverse()

// Map.addLayer(waterOccurrence.mask(waterOccurrence.multiply(2)), {min: 0, max: 1, palette: palette}, 'water occurrence', true, 0.5)

print(points.first().propertyNames())
print(ui.Chart.feature.histogram(points, 'ts', 150))
print(ui.Chart.feature.histogram(points, 'depth', 150))

print('Count (all)', points.size())

var timeMinMax = points.reduceColumns(ee.Reducer.minMax(), ['ts'])
var timeMin = ee.Date(ee.Number(timeMinMax.get('min')).multiply(1000))
var timeMax = ee.Date(ee.Number(timeMinMax.get('max')).multiply(1000))

print(timeMin, timeMax)

// points = points.map(function(f) {
//   return f.buffer(10, 5)
// })

var pointsImage = points.reduceToImage(['depth'], ee.Reducer.median())
Map.addLayer(pointsImage, {palette: palettes.cb.PuBuGn[9], min: 5, max: 14}, 'depth (all, median)')

var pointsImage = points.reduceToImage(['depth'], ee.Reducer.stdDev())
Map.addLayer(pointsImage, {palette: palettes.cb.YlOrRd[9].slice(0).reverse(), min: 0, max: 2}, 'depth (all, stddev)')

var pointsImage = points.reduceToImage(['depth'], ee.Reducer.count())
Map.addLayer(pointsImage.mask(pointsImage), {palette: palettes.cb.Greys[9].slice(0).reverse(), min: 0, max: 5}, 'depth (all, count)')

function showPointsForTimeInterval(t1, t2) {
  points = points.filter(
    ee.Filter.and(
      ee.Filter.gt('ts', ee.Date(t1).millis().divide(1000)),
      ee.Filter.lt('ts', ee.Date(t2).millis().divide(1000))
    )
  )
  
  var pointsImage = points.reduceToImage(['depth'], ee.Reducer.median())
  Map.addLayer(pointsImage, {palette: palettes.cb.PuBuGn[9], min: 5, max: 14}, 'depth (all, median) ' + t1 + '-' + t2)
}


showPointsForTimeInterval('2018-12-01', '2019-01-01')
showPointsForTimeInterval('2019-01-01', '2019-02-01')
showPointsForTimeInterval('2019-02-01', '2019-03-10')

points = points.filter(ee.Filter.lt('ts', timeMin.advance(1, 'day').millis().divide(1000)))

print(points.first().propertyNames())
print(ui.Chart.feature.histogram(points, 'ts', 150))
print(ui.Chart.feature.histogram(points, 'depth', 150))

style.SetMapStyleDark()

var pointsImage = points.reduceToImage(['depth'], ee.Reducer.median())
Map.addLayer(pointsImage, {palette: palettes.cb.PuBuGn[9], min: 5, max: 14}, 'depth', false)

Map.addLayer(style.Feature.histogram(points, 'depth', { maxBuckets: 9, palette: palettes.cb.PuBuGn[9], width: 0 }), 'depth', false)

// Map.addLayer(style.Feature.label(basins, 'PFAF_ID', { textColor: 'ffffff', outlineColor: '000000' }))


// TODO: convert to surface (image), check IDW, Krigging

// TODO: export as a private image asset: Export.image.toAsset()
// Export.image.toAsset(image, description, assetId, pyramidingPolicy, dimensions, region, scale, crs, crsTransform, maxPixels)

// TODO: upload RWS measurements to EE (CSV > TIFF)

// TODO: write a script to download water level time series from Deltares opendap servers

// TODO: create a repository on GitHub for covardem experiments, or use eo-bathymetry?

// TODO: explore (Thursday, DigiShape meeting)

