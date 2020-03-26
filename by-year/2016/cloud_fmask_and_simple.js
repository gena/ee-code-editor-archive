/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var images = ee.ImageCollection("LANDSAT/LC8_L1T_TOA_FMASK");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var bounds = ee.Geometry(Map.getBounds(true))

images = images
  .filterBounds(bounds.centroid(1))
  .filter(ee.Filter.and(ee.Filter.gt('CLOUD_COVER', 45), ee.Filter.lt('CLOUD_COVER', 65)))

var image = ee.Image(images.toList(1, 1).get(0))

Map.addLayer(image, {bands: ['B7', 'B5', 'B8']}, 'image')

var cloud = image.select('fmask').eq(4)
var shadow = image.select('fmask').eq(2)
Map.addLayer(cloud.mask(cloud), {palette:['ffff00'], opacity:0.5}, 'cloud (fmask)')
Map.addLayer(shadow.mask(shadow), {palette:['ff00ff'], opacity:0.5}, 'shadow (fmask)')

var cloudScore = ee.Algorithms.Landsat.simpleCloudScore(image).select('cloud').divide(100)
cloudScore = cloudScore.where(cloudScore.lt(0.25), 0)

Map.addLayer(cloudScore.mask(cloudScore.multiply(1.5)), {palette:['ffff00'], opacity:0.5}, 'cloud (simple)', false)
