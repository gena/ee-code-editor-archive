/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var images = ee.ImageCollection("COPERNICUS/S2"),
    jrc = ee.Image("JRC/GSW1_0/GlobalSurfaceWater"),
    demALOS = ee.Image("JAXA/ALOS/AW3D30_V1_1");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var assets = require('users/gena/packages:assets')

var clear = true
var bounds = ee.Geometry(Map.getBounds(true))
//var images = images
  //.filterBounds(bounds)
  //.filter(ee.Filter.lt('MEAN_SOLAR_ZENITH_ANGLE', 45))

var images = assets.getImages(bounds, true)
  .filter(ee.Filter.dayOfYear(150, 300))
  
print(images.first())
  
print(images.size())

var bands = ee.Image(images.first()).bandNames()
var image = images.reduce(ee.Reducer.percentile([15])).rename(bands)

Map.addLayer(image, {min:0, max:0.35})

var ndwi = image.normalizedDifference(['green', 'nir'])
Map.addLayer(ndwi, {min: -0.05, max: 0.2}, 'NDWI')

var ndsi = image.normalizedDifference(['red', 'swir'])
Map.addLayer(ndwi, {min: 0.0, max: 0.6}, 'NDSI')

var thresholding = require('users/gena/packages:thresholding')

var debug = true
var scale = Map.getScale()
var cannyThreshold = 0.9
var cannySigma = 1
var minValue = -0.05
var th = thresholding.computeThresholdUsingOtsu(ndwi, scale, bounds, cannyThreshold, cannySigma, minValue, debug).getInfo()

print(th)

function getEdge(mask) {
  return mask.subtract(mask.focal_min(1))
}

// th = 0.05

Map.addLayer(ndwi.mask(ndwi.gt(th)), {palette:'0000ff'}, 'water (th=' + th + ')')
Map.addLayer(ndwi.mask(getEdge(ndwi.gt(th))), {palette:'ffffff'}, 'water edge (th=' + th + ')')

var waterJrc = jrc.select('occurrence').divide(100)
waterJrc = waterJrc.mask(waterJrc).gt(0)
Map.addLayer(waterJrc, { palette:'ffff00'}, 'water (JRC)')

var demVFP = [
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM1'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM2'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM3'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM4'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM5'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM6'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM7'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM8')
];

// fix cache
demVFP = ee.ImageCollection(demVFP).map(function(i) { return i.rename('elevation').resample('bicubic').add(0); }).mosaic()

var dem = demALOS.select(0).resample('bicubic').unmask(demVFP, false)

var demMin = 1
var demMax = 15
dem = dem.clamp(demMin, demMax).subtract(demMin).divide(demMax - demMin)
dem = dem.updateMask(dem)
Map.addLayer(dem, {min: 1, max: 0}, 'P(DEM)', true, 0.85)


//assets.computeQualityMeanComposite(bounds, op)

var ndwiMin = -0.15
var ndwiMax = 0.25

var ndviMin = -0.25
var ndviMax = 0.15

var i = assets.computeQualityMeanComposite(bounds, function(image) { return image }, 25)

Map.addLayer(i, {min: 0, max: 0.3}, 'composite')

function computeWaterIndexOccurrence(g) {
  return assets.computeQualityMeanComposite(g, function(image) {
    var ndwi = image.normalizedDifference(['green','nir']).rename('ndwi')
    var mndwi = image.normalizedDifference(['green','swir']).rename('mndwi')
    var ndvi = image.normalizedDifference(['nir','red']).rename('ndvi')
    
    return ee.Image([ndvi.clamp(ndviMin, ndviMax), ndwi.clamp(ndwiMin, ndwiMax), mndwi.clamp(ndwiMin, ndwiMax)])
  })
}

var waterIndex = computeWaterIndexOccurrence(bounds)
var vis = {min: ndwiMin, max:ndwiMax}
Map.addLayer(waterIndex.clip(bounds), vis, 'water index', false)

