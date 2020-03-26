/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var dem = ee.Image("AHN/AHN2_05M_RUW"),
    geometry = /* color: #d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var scale = Map.getScale()
var wgs = ee.Projection('EPSG:4326')
var web = ee.Projection('EPSG:3857')

var coords = ee.Image.pixelLonLat()

var lines1 = coords.select(1).changeProj(wgs, web).divide(scale).int().mod(10).lt(1)

Map.addLayer(ee.Image(1).mask(lines1))

var colorbrewer = require('users/gena/packages:colorbrewer')
var utils = require('users/gena/packages:utils')

var minMax = dem.reduceRegion(ee.Reducer.percentile([1, 99]), Map.getBounds(true), Map.getScale()).values()

var min = ee.Number(minMax.get(0))
var max = ee.Number(minMax.get(1))

var styled = dem.visualize({ min: min, max: max, palette: colorbrewer.Palettes.Paired[12] })
Map.addLayer(styled, {}, 'Paired, styled', false)


var exaggregate = 5
var weight = 1.5
var azimuth = 0
var zenith = 25

var hillshaded = utils.hillshadeit(styled, dem, weight, exaggregate, azimuth, zenith)
Map.addLayer(hillshaded, {}, 'Paired, hillshaded')
