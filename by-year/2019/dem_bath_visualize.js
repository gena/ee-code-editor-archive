/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var gebco = ee.Image("projects/dgds-gee/gebco/2019"),
    alos = ee.Image("JAXA/ALOS/AW3D30_V1_1"),
    land = ee.Image("users/gena/land_polygons_image"),
    ned = ee.Image("USGS/NED"),
    emodnet = ee.Image("projects/deltares-rws/eo-bathymetry/EMODnet_2018"),
    greenland = ee.Image("OSU/GIMP/DEM"),
    canada = ee.ImageCollection("NRCan/CDEM"),
    ahn = ee.Image("AHN/AHN2_05M_RUW"),
    australia = ee.ImageCollection("AU/GA/AUSTRALIA_5M_DEM"),
    arctic = ee.Image("UMN/PGC/ArcticDEM/V3/2m_mosaic"),
    antarctica = ee.Image("UMN/PGC/REMA/V1_1/8m");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var palettes = require('users/gena/packages:palettes');
var utils = require('users/gena/packages:utils')

// Settings

// Angle for hillshade (keep at 315 for good perception)
var azimuth = 315
// Lower is longer shadows
var zenith = 30

var bathy_only = false
var height_multiplier = 30
// Weight between image and  hillshade (1=equal)
var weight = 0.3
// make darker (<1), lighter (>1)
var val_multiply = 0.9
// make  desaturated (<1) or more saturated (>1)
var sat_multiply = 0.8

// palettes
// From CPT city
// only take the darker part
var bathy_palette = ['#000000', '#000104', '#000208', '#00020c', '#000310', '#000414', '#000518', '#00061c', '#000620', '#000725', '#000829', '#00092d', '#000a31', '#00113a', '#001e48', '#002954', '#00345f', '#003f6b', '#004c79', '#005785', '#006291', '#006d9c', '#0078a8', '#0086b6', '#0091c2', '#079ac7', '#14a1c4', '#24aac1', '#32b1bf', '#3fb9bc', '#4dc0ba', '#5ac7b7', '#6bd0b4', '#78d8b2', '#86e0af', '#93e7ad', '#a3f0aa', '#aef5aa', '#b4f6b1', '#baf7b8', '#c0f8bf', '#c8f9c7', '#cef9cd', '#d4fad4', '#dafbdb', '#e2fce3', '#e8fdea', '#eefdf1', '#f4fef8', '#faffff'].slice(1, 25)
var topo_palette = ['#006147', '#268437', '#549748', '#82ab58', '#b0bf69', '#e8d77d', '#dec36c', '#d5ae5b', '#cb9a4a', '#bf8235', '#b56d24', '#ac5913', '#a24502', '#a03700', '#a02800', '#9f1b00', '#9f0e00', '#9e0100', '#990b0b', '#951414', '#911e1e', '#8d2727', '#893131', '#843d3d', '#7f4646', '#7b5050', '#775959', '#726565', '#6f6f6f', '#7a7a7a', '#868686', '#919191', '#9f9f9f', '#ababab', '#b7b7b7', '#c2c2c2', '#d0d0d0', '#dcdcdc', '#e7e7e7', '#f3f3f3', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff']

// visualization params 
var topo_vis_params = {
  min: 0,
  max: 5500,
  palette: topo_palette
}
var bathy_vis_params = {
  min: -15000,
  max: 500,
  palette: bathy_palette
}

var band = 'z'

function radians(image) {
  return ee.Image(image).toFloat().multiply(3.1415927).divide(180)  
}

var azimuth = radians(ee.Image.constant(azimuth))
var zenith = radians(ee.Image.constant(zenith))

alos = alos.select('MED').rename('z')
gebco = gebco.rename('z')
emodnet = emodnet.rename('z')
ned = ned.rename('z')

var landMask = land.unmask(1, false).not().resample('bicubic').focal_mode({ radius: 2 } )
var alosMask = alos.mask().eq(1)

// canada = canada.map(function(i) { return i.resample('bicubic').updateMask(landMask) })
australia = australia.map(function(i) { return i.resample('bicubic').updateMask(landMask) })

var dems = ee.ImageCollection([
  gebco.resample('bicubic'), 
  emodnet.resample('bicubic'),
  alos.resample('bicubic').updateMask(alosMask.and(landMask)),
  ned.resample('bicubic').updateMask(landMask),
  // ahn.resample('bicubic').updateMask(landMask),
  // arctic.resample('bicubic').updateMask(landMask),
])
// .merge(canada)
// .merge(australia)

var weight = 0.25 // wegith of Hillshade vs RGB intensity (0 - flat, 1 - HS)
var exaggeration = 100 // vertical exaggeration
var azimuth = 315 // Sun azimuth
var zenith = 50 // Sun elevation
// var brightness = -0.25 // 0 - default, change this to smaller value when zoomed-in
var brightness = -0.5 // 0 - default
var contrast = 0.6 // 0 - default
var saturation = 0.3
var castShadows = false
var customTerrain = false // use custom terrain algorithm (higher-order) instead of ee.Algorithms.Terrain

function visualize(elevation) {
  var topo_rgb = elevation.mask(landMask.or(alos.mask().not())).visualize(topo_vis_params)
  var bathy_rgb = elevation.mask(landMask.not()).visualize(bathy_vis_params)
  var image_rgb = topo_rgb.blend(bathy_rgb)

  var rgb =  utils.hillshadeRGB(image_rgb, elevation, weight, exaggeration, azimuth, zenith, contrast, brightness, saturation, castShadows, customTerrain)

  return rgb
}

// var all = dems.map(visualize)
// Map.addLayer(ee.ImageCollection(all).mosaic(), {min: 0, max: 1})

// use this (customTerrain) when exporting with higher-quelity
function visualize2(elevation) {
  var topo_rgb = elevation.mask(landMask.or(alos.mask().not())).visualize(topo_vis_params)
  var bathy_rgb = elevation.mask(landMask.not()).visualize(bathy_vis_params)
  var image_rgb = topo_rgb.blend(bathy_rgb)

  var castShadows = false
  var customTerrain = true
  var rgb =  utils.hillshadeRGB(image_rgb, elevation, weight, exaggeration, azimuth, zenith, contrast, brightness, saturation, castShadows, customTerrain)

  return rgb
}

var all = dems.map(visualize2)
Map.addLayer(ee.ImageCollection(all).mosaic(), {min: 0, max: 1})
