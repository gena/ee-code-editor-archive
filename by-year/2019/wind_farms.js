/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([6.7188262939453125, 54.01018984017271]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var m = ee.Geometry.Polygon([[[6.0596466064453125,53.86649775409183],[7.3780059814453125,53.86649775409183],
      [7.3780059814453125,54.153387448056286],[6.0596466064453125,54.153387448056286],
      [6.0596466064453125,53.86649775409183]]]);

Map.addLayer(m, {color: 'green'}, 'AOI')

Map.centerObject(geometry, 11)

var g = ee.Geometry(Map.getBounds(true))
print(g)


/***
 * Estimates quality score for a given area.
 */
function addSpatialQualityScore(images, g, scale) {
  return images  
    .map(function(i) { 
      return i.set({
        quality: i.select('green').reduceRegion(ee.Reducer.mean(), g, scale).values().get(0)
        //quality: i.select('cloud_score').reduceRegion(ee.Reducer.sum(), g, scale).values().get(0)
      })
    })
}

/***
 * Sentinel-2 produces multiple images, resultsing sometimes 4x more images than the actual size. 
 * This is bad for any statistical analysis.
 * 
 * This function mosaics images by time. 
 */
function mosaicByTime(images) {
  var TIME_FIELD = 'system:time_start'

  var distinct = images.distinct([TIME_FIELD])

  var filter = ee.Filter.equals({ leftField: TIME_FIELD, rightField: TIME_FIELD });
  var join = ee.Join.saveAll('matches')
  var results = join.apply(distinct, images, filter)

  // mosaic
  results = results.map(function(i) {
    var mosaic = ee.ImageCollection.fromImages(i.get('matches')).sort('system:index').mosaic()
    
    return mosaic.copyProperties(i).set(TIME_FIELD, i.get(TIME_FIELD))
  })
  
  return ee.ImageCollection(results)
}


var s2 = ee.ImageCollection('COPERNICUS/S2')

var bandNamesShort = ['B11', 'B12', 'B8', 'B4', 'B3', 'B2', 'B1', 'B10']
var bandNames = ['swir', 'swir2', 'nir', 'red', 'green', 'blue', 'coastal', 'cirrus']

s2 = s2
  .select(bandNamesShort, bandNames)
  .filterDate('2015-01-01', '2018-01-01')

var aoi = Map.getBounds(true)
var scale = Map.getScale()*100

var images = s2
  .filterBounds(aoi)

var image = ee.Image(images.toList(1, 13).get(0))
Map.addLayer(image, {bands: ['red', 'green', 'blue'], min:500, max:1000}, 'single (true)', false)


images = addSpatialQualityScore(images, aoi, scale)

print(images.aggregate_array('quality'))

print(ui.Chart.feature.histogram(images, 'quality', 100))

// TODO: determine from cloud frequency
var qualityThreshold = 1500

// filter cloudy images
images = images.filter(ee.Filter.lt('quality', qualityThreshold))

images = images.map(function(i) { return i.resample('bicubic')})

images = mosaicByTime(images)

print('Image count: ', images.size())

var composite = images
  .reduce(ee.Reducer.percentile([20])).rename(bandNames)

Map.addLayer(composite, {bands: ['nir', 'green', 'blue'], min:500, max:1000}, 'composite (false)', false)

Map.addLayer(composite, {bands: ['red', 'green', 'blue'], min:500, max:1000}, 'composite (true)', false)

var Palettes = {
    water: ['f7fbff', 'deebf7', 'c6dbef', '9ecae1', '6baed6', '4292c6', '2171b5', '08519c', '08306b']
};

var ndwi = composite.divide(10000).normalizedDifference(['green', 'nir'])

Map.addLayer(ndwi, {palette: Palettes.water, min:0, max:0.3}, 'NDWI')

var ndwiReduced = ndwi
   .reproject(ee.Projection('EPSG:3857').atScale(10))
   .reduceResolution({reducer: ee.Reducer.min(), maxPixels: 100})
   .reproject(ee.Projection('EPSG:3857').atScale(Map.getScale()))

Map.addLayer(ndwiReduced, {palette: Palettes.water, min:0, max:0.3}, 'NDWI (reduced 10m -> 300m)')

var radius = 5
var stddevTh = 0.01
var stddev = composite.select('nir').reduceNeighborhood(ee.Reducer.stdDev(), ee.Kernel.circle(radius, 'pixels'))
Map.addLayer(stddev.mask(stddev.gt(stddevTh)), {min: 0, max: 0.05}, 'stddev neighborhood', false)  
