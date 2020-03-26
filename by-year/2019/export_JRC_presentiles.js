/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var jrc = ee.Image("JRC/GSW1_0/GlobalSurfaceWater"),
    grid = ee.FeatureCollection("users/gena/global_grid"),
    gebco = ee.Image("users/gena/GEBCO_2014_2D");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var sourceScale = 0.0002777777777777778 // ~30m
var targetScale = 0.008333333333325754 // ~1km
var maxPixels = 35000
var percentiles = [50]

var deepWater = gebco.lt(0)
  .focal_min({radius: 5, kernelType: 'circle', iterations: 5})
  .focal_max({radius: 5, kernelType: 'circle', iterations: 2})
  .reproject(gebco.projection())

var water = jrc.select('occurrence').divide(100)
  // .unitScale(0, 0.95) // clip to [0, 95]%
  .gt(0.1) // 50% cut-off
  .unmask(deepWater)
  
water = water.mask(water.gt(0))

var waterUpscaled = water
  .reproject(ee.Projection('EPSG:4326').scale(sourceScale, sourceScale))
  .reduceResolution(ee.Reducer.percentile(percentiles), false, maxPixels)

var palette = ['f7fbff', 'deebf7', 'c6dbef', '9ecae1', '6baed6', '4292c6', '2171b5', '08519c', '08306b'];

Map.addLayer(water, {palette: palette}, 'water', true, 0.6)

Map.addLayer(deepWater.mask(deepWater), {palette: palette}, 'water (GEBCO)', true, 0.6)

Map.addLayer(waterUpscaled
  .reproject(ee.Projection('EPSG:4326').scale(targetScale, targetScale)), {palette: palette}, 'water 50%, ~1km')

var region = ee.Geometry.Polygon([-180, 88, 0, 88, 180, 88, 180, -88, 0, -88, -180, -88], null, false)

var name = 'WATER_p50_1km'

Export.image.toAsset({
  image: waterUpscaled.mask(),
  description: name + '_asset', 
  assetId: name,
  region: region, 
  scale: 1000, // 1km
  crs: 'EPSG:4326',
  maxPixels:1e10
})

// var region = ee.Geometry(Map.getBounds(true))

Export.image.toDrive({
  image: waterUpscaled.mask(),
  description: name, 
  fileNamePrefix: name,
  region: region, 
  //scale: 1000, // 1km
  crs: 'EPSG:4326',
  crsTransform: [0.008333333333325754, 0.0, -180.0, 0.0, -0.008333333333325754, 90.0],
  maxPixels:1e10
})

var waterFraction = ee.Image('users/gena/WATER_p50_1km')
Map.addLayer(waterFraction.mask().mask(waterFraction.mask()), {}, 'results')

Export.image.toDrive({
  image: ee.Image('users/gena/WATER_p50_1km').mask(),
  description: name + '_from_asset', 
  fileNamePrefix: name,
  region: region, 
  scale: 1000, // 1km
  crs: 'EPSG:4326',
  maxPixels:1e10
})
