/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var dem = ee.Image("AHN/AHN2_05M_RUW"),
    geometry = /* color: #d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// add hatched lines
var scale = Map.getScale()
var wgs = ee.Projection('EPSG:4326')
var web = ee.Projection('EPSG:3857')

var coords = ee.Image.pixelLonLat()

var images = ee.List.sequence(3, 3.000001, 0.000000001).map(function(m) {
  return coords.pow(2).multiply(ee.Image.constant(m))
    .reduce(ee.Reducer.sum()).changeProj(wgs, web).divide(scale).mod(5).lt(2)
})


images = ee.ImageCollection(images)

require('users/gena/packages:animation').animate(images, {
  maxFrames: 50
})

/*var hillshade = ee.Algorithms.Terrain(dem).select('hillshade')

Map.addLayer(hillshade)
*/
/*

// add DEM
var utils = require('users/gena/packages:utils')

var minMax = dem.reduceRegion(ee.Reducer.percentile([1, 99]), Map.getBounds(true), Map.getScale()).values()

var min = ee.Number(minMax.get(0))
var max = ee.Number(minMax.get(1))

var styled = dem.visualize({ min: min, max: max, palette: ['2ca25f'] })
  .updateMask(lines1)
  
Map.addLayer(styled, {}, 'Paired, styled', false)

var exaggregate = 5
var weight = 1.5
var azimuth = 0
var zenith = 25

var hillshaded = utils.hillshadeit(styled, dem, weight, exaggregate, azimuth, zenith)
Map.addLayer(hillshaded, {}, 'Paired, hillshaded')

*/