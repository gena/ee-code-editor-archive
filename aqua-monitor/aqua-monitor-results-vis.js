/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var land300m = ee.Image("users/gena/AquaMonitor/water_changes_1985_240_2013_48_land_300m"),
    water300m = ee.Image("users/gena/AquaMonitor/water_changes_1985_240_2013_48_water_300m"),
    ne = ee.Image("users/gena/NE1_HR_LC_SR_W"),
    flowAccumulation = ee.Image("WWF/HydroSHEDS/15ACC"),
    coastline = ee.Image("users/gena/coastline_buffer_40km"),
    hand556 = ee.Image("users/gena/GlobalHAND/90m/hand-556"),
    fa_90 = ee.Image("users/gena/GlobalHAND/90m/fa"),
    scale2 = ee.Image("users/gena/AquaMonitor/water_changes_1999_48_2013_48_15p"),
    coastline40km = ee.Image("users/gena/coastline_buffer_40km"),
    scale = ee.Image("users/gena/AquaMonitor/water_changes_1985_240_2013_48"),
    geometry = /* color: #98ff00 */ee.Geometry.Polygon(
        [[[-39.0234375, 56.75272287205736],
          [-30.234375, 63.704722429433225],
          [-18.6328125, 71.52490903732816],
          [-10.546875, 77.76758238272801],
          [-10.8984375, 82.26169873683155],
          [-34.8046875, 83.44032649527307],
          [-56.953125, 82.07002819448267],
          [-72.421875, 77.07878389624943],
          [-59.765625, 68.39918004344187]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var bad = ee.Image(0).int().paint(geometry, 1)

// SWBD mask
var swbd = ee.Image('MODIS/MOD44W/MOD44W_005_2000_02_24').select('water_mask')
var swbdMask = swbd.unmask().not()

Map.setOptions('SATELLITE')

function desaturate(rgb, scale) {
  // expect 0-1 for rgb
  // Convert to HSV, swap in the pan band, and convert back to RGB.
  var hsv = rgb.rgbToHsv();
  var hue = hsv.select('hue');
  var sat = hsv.select('saturation');
  var val = hsv.select('value');
  var newSat = sat.multiply(scale);
  var rgbNew = ee.Image.cat(hue, newSat, val).hsvToRgb();

  return rgbNew;
}

// desaturate expects rgb in range 0-1, convert image from 0-255
var naturalEarthDesaturated = desaturate(
  ne.select('b1', 'b2', 'b3').unitScale(0, 255),
  0.1
);
Map.addLayer(naturalEarthDesaturated, {gamma: 0.3}, 'natural earth (desaturated)', false);

Map.addLayer(coastline, {}, 'coastline', false)

var bg = ee.Image(1)
Map.addLayer(bg, {opacity:0.4}, 'bg')

var basinsLevel3 = ee.FeatureCollection('ft:13dShZ5yGqCEqk3dsJvYEL3lsa1hEmpMRldxK7aSa')

var bgBasinsMask = ee.Image(0).toByte().paint(basinsLevel3, 1)
var bgBasins = bgBasinsMask
bgBasins = bgBasins.mask(bgBasins)
Map.addLayer(bgBasins, {opacity: 0.5}, 'bg (basins)')

var basinsLeve3Outline = ee.Image(0).toByte().paint(basinsLevel3, 1, 1)
var basinsLeve3OutlineVis = basinsLeve3Outline.mask(basinsLeve3Outline)
  .visualize({forceRgbOutput: true, palette:['ffffff']})
Map.addLayer(basinsLeve3OutlineVis, {opacity: 0.7}, 'HydroBASINS L3 (outline)')


var maxArea = 300

/*land300m = land300m.focal_max(1)
water300m = water300m.focal_max(1)
*/

var land = land300m
  .mask(land300m.multiply(land300m.gt(0)).divide(maxArea).multiply(swbdMask))
  
var land300vis = land.visualize({min: 0, max: maxArea, palette: ['000000', '31a354']})
Map.addLayer(land300vis, {}, 'land (300m)', true)

var water = water300m
  .mask(water300m.multiply(water300m.gt(0)).divide(maxArea).multiply(swbdMask))
  
var water300vis = water.visualize({min: 0, max: maxArea, palette: ['000000', '00d8ff']})
Map.addLayer(water300vis, {}, 'water (300m)', true)

// high-res
var change = scale
  .multiply(swbdMask)
  .visualize({ min: -0.02, max: 0.02, palette: ['00ff00', '000000', '00d8ff'], forceRgbOutput: true})
Map.addLayer(change, {}, 'water / land change (1985 - 2016)', true)

var change2 = scale2
  .multiply(swbdMask)
  .visualize({ min: -0.02, max: 0.02, palette: ['00ff00', '000000', '00d8ff'], forceRgbOutput: true})
Map.addLayer(change2, {}, 'water / land change (1999 - 2016)', true)

// heatmap, from vector (for performance reasons)
var fc = ee.FeatureCollection('ft:17TEfjvF14hKeDmSotkXrjYeplyT8O_SgRLuJFbYk')

var maxArea = 2000000
var bufferSize = 20000
var blurSize = 50000
var blurSigma = 40000

var heatmapWater = fc
  .reduceToImage(['total_wate'], ee.Reducer.sum())
  .focal_max(bufferSize, 'circle', 'meters')
  .convolve(ee.Kernel.gaussian(blurSize, blurSigma, 'meters'));

var heatmapColors = ['000000', '00d8ff', 'aaffff']

var heatmapWaterVis = heatmapWater.mask(heatmapWater.divide(maxArea))
  .visualize({min:0, max:maxArea, opacity: 0.4, palette: heatmapColors})
Map.addLayer(heatmapWaterVis, {}, 'heatmap (water)', true);

var heatmapLand = fc
  .reduceToImage(['total_land'], ee.Reducer.sum())
  .focal_max(bufferSize, 'circle', 'meters')
  .convolve(ee.Kernel.gaussian(blurSize, blurSigma, 'meters'));

var heatmapColors = ['000000', '00ff00', 'aaffaa']
var maxArea = 2000000

var heatmapLandVis = heatmapLand.mask(heatmapLand.divide(maxArea))
  .visualize({min:0, max:maxArea, opacity: 0.4, palette: heatmapColors})

Map.addLayer(heatmapLandVis, {}, 'heatmap (land)', true);

var hydro = require('users/gena/packages:hydro')
//var style = require('users/gena/packages:style')

// hydro.Map.addFlowAccumulation({threshold: 1000})
//hydro.Map.addFlowAccumulation({threshold: 10000, type: 'vector', layer: { opacity: 0.5 } })
//hydro.Map.addFlowAccumulation({threshold: 100000, type: 'vector', layer: { opacity: 1 }})

var rivers = ee.FeatureCollection('ft:1yMXz_cItkAJFvmeXNcsuW2i7kK5i1iJ0QcYK3g')
Map.addLayer(ee.Image().paint(rivers,1,1), {palette: ['9ecae1']}, 'rivers (Natural Earth)', false, 0.5)

var image = ee.ImageCollection.fromImages([
  naturalEarthDesaturated.visualize({gamma: 0.3}),
  bg.visualize({opacity:0.4, forceRgbOutput: true}),
  bgBasins.visualize({opacity: 0.5, forceRgbOutput: true}),
  //basinsLeve3OutlineVis.visualize({opacity: 0.7, forceRgbOutput: true}),
  //ee.Image().paint(rivers,1,1).visualize({palette: ['9ecae1']}),
  land300vis,
  water300vis,
  heatmapWaterVis,
  heatmapLandVis
  ]).mosaic()

var rect = ee.Geometry.Polygon([-180, 88, 0, 88, 180, 88, 180, -75, 10, -75, -180, -75], 'EPSG:4326', false)

Map.addLayer(image.clip(rect), {}, 'export')


Export.image.toDrive({
    image: image, 
    description: 'cover', 
    fileNamePrefix: 'cover', 
    dimensions: 3840,
    region: rect, 
    crs: 'EPSG:3857'
})