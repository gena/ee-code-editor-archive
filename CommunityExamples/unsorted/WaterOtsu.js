/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2"),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    jrc = ee.Image("JRC/GSW1_0/GlobalSurfaceWater");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
print(Map.getCenter())
//Map.setCenter(64.80, 38.96, 16)

var thresholding = require('users/gena/packages:thresholding')

var bounds = ee.Geometry(Map.getBounds(true))

var start = '2016-04-01'
var stop = '2016-10-01'

// a single image (Sentinel 2)
/*
var image = ee.Image(s2.filterBounds(bounds.centroid(10)).filterDate(start, stop).filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 5)).first())
  .resample('bicubic')
  .divide(10000)
  .select(['B3', 'B8', 'B11'], ['green', 'nir', 'swir1'])
*/

// percentile S2
var image = s2.filterBounds(bounds).filterDate(start, stop)
  .map(function(i) { return i.resample('bicubic')})
  .reduce(ee.Reducer.percentile([15])).rename(ee.Image(s2.first()).bandNames())
  .divide(10000)
  .select(['B3', 'B8', 'B11'], ['green', 'nir', 'swir1'])

// a single image (Landsat 8)
/*
var image = ee.Image(l8.filterBounds(bounds.centroid(10)).filterDate(start, stop).filter(ee.Filter.lt('CLOUD_COVER', 5)).first())
  .resample('bicubic')
  .select(['B3', 'B5', 'B6'], ['green', 'nir', 'swir1'])
*/

// percentile L8
/*
var image = l8.filterBounds(bounds).filterDate(start, stop)
  .map(function(i) { return i.resample('bicubic')})
  .reduce(ee.Reducer.percentile([15])).rename(ee.Image(l8.first()).bandNames())
  .select(['B3', 'B5', 'B6'], ['green', 'nir', 'swir1'])
*/


Map.addLayer(image, {bands: ['green', 'nir', 'green'], min:0.05, max:0.3}, 'image')

var ndwi = image.normalizedDifference(['green', 'nir']) // NDWI, McFeters
//var ndwi = image.normalizedDifference(['green', 'swir1']) // MNDWI (NDSI), Xu

var debug = true
var scale = 10
var cannyThreshold = 0.9
var cannySigma = 1
var minValue = -0.1
var th = thresholding.computeThresholdUsingOtsu(ndwi, scale, bounds, cannyThreshold, cannySigma, minValue, debug)

print(th)

function getEdge(mask) {
  return mask.subtract(mask.focal_min(1))
}

Map.addLayer(ndwi, {min:-0.1, max:0.5}, 'NDWI')

Map.addLayer(ndwi.mask(ndwi.gt(th)), {palette:'0000ff'}, 'water (th=' + th.getInfo() + ')')
Map.addLayer(ndwi.mask(getEdge(ndwi.gt(th))), {palette:'ffffff'}, 'water edge (th=' + th.getInfo() + ')')

Map.addLayer(ndwi.mask(getEdge(ndwi.gt(0))), {palette:'ff0000'}, 'water edge (th=0)')


var Palettes = {
    water: ['f7fbff', 'deebf7', 'c6dbef', '9ecae1', '6baed6', '4292c6', '2171b5', '08519c', '08306b']
};
Map.addLayer(jrc.select('occurrence'), {min: 0, max: 100, palette: Palettes.water }, 'water occurrence (JRC)', false);
