/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var gebco = ee.Image("projects/dgds-gee/gebco/2019");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var palettes = require('users/gena/packages:palettes');

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
  max: 4500,
  palette: topo_palette
}
var bathy_vis_params = {
  min: -9000,
  max: 0,
  palette: bathy_palette
}


var band = 'b1'
var elevation = gebco.select(band)

var topo_rgb = gebco.mask(gebco.gt(0)).visualize(topo_vis_params)
var bathy_rgb = gebco.mask(gebco.lte(0)).visualize(bathy_vis_params)
var image_rgb = topo_rgb.blend(bathy_rgb)

if (bathy_only) {
  // overwrite with masked version
  image_rgb = bathy_rgb.mask(gebco.multiply(ee.Image(-1)).unitScale(-1, 10).clamp(0, 1))  
}

var hsv = image_rgb.unitScale(0, 255).rgbToHsv()

var z = elevation.multiply(ee.Image.constant(height_multiplier))

function radians(image) {
  return ee.Image(image).toFloat().multiply(3.1415927).divide(180)  
}

// Compute terrain properties    
var terrain = ee.Algorithms.Terrain(z)
var slope = radians(terrain.select(['slope']))
var aspect = radians(terrain.select(['aspect'])).resample('bicubic')
var azimuth = radians(ee.Image.constant(azimuth))
var zenith = radians(ee.Image.constant(zenith))
// hillshade
var hs = azimuth
  .subtract(aspect)
  .cos()
  .multiply(slope.sin())
  .multiply(zenith.sin())
  .add(
    zenith
      .cos()
      .multiply(
        slope.cos()
      )
  ).resample('bicubic')
// var intensity = hs.multiply(ee.Image.constant(weight)).multiply(hsv.select('value'))

// weighted average of hillshade and value
var intensity = hs.multiply(hsv.select('value'))
var hue = hsv.select('hue')

// desaturate a bit
var sat = hsv.select('saturation').multiply(sat_multiply)
// make a bit darker
var val = intensity.multiply(val_multiply)

var hillshaded = ee.Image.cat(hue, sat, val).hsvToRgb()
Map.addLayer(hillshaded)
Map.addLayer(gebco, {}, 'gebco', false)
