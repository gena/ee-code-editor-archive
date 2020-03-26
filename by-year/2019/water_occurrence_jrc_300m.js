/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var jrc = ee.Image("JRC/GSW1_0/GlobalSurfaceWater");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var occurrence = jrc.select('occurrence').divide(100)

var occurrence300 = occurrence
      .reproject('EPSG:4326', null, 30)
      .reduceResolution(ee.Reducer.mean(), false, 100)
      .reproject('EPSG:4326', null, 300)
      .rename('occurrence')

Map.addLayer(occurrence, {min: 0, max: 1}, 'occurrence')
Map.addLayer(occurrence300, {min: 0, max: 1}, 'occurrence 300m')

var world = ee.Geometry.Polygon([-180, 88, 0, 88, 180, 88, 180, -88, 10, -88, -180, -88], 'EPSG:4326', false)

var name = 'jrc-occurrence-300m'

Export.image.toAsset({
    image: occurrence300,
    description: name, 
    assetId: 'users/gena/water_occurrence_jrc_300m', 
    pyramidingPolicy: 'max', 
    region: world, 
    scale: 300, 
    crs: 'EPSG:4326',
    maxPixels: 1e13
})
