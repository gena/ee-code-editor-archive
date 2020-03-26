/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var hycom = ee.ImageCollection("HYCOM/GLBu0_08/sea_temp_salinity"),
    bg = ee.Image("users/gena/NE1_HR_LC_SR_W");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var utils = require('users/gena/packages:utils')
var animation = require('users/gena/packages:animation')
var palette = require('users/gena/packages:colorbrewer').Palettes.Spectral[9].reverse()

var images = hycom.select('sst_0') 

var weight = 1.1 // hillshade vs color
var exaggregation = 50
var azimuth = 0
var elevation = 15
var castShadows = true

function styleImage(image) {
  var rgb = utils.hillshadeRGB(
      image.visualize({min: -10000, max: 10000, palette: palette}),  // style
      image, // elevation 
      weight, exaggregation, azimuth, elevation).visualize()
      
  return ee.ImageCollection.fromImages([
    bg.visualize(),
    ee.Image(1).visualize({palette:['000000'], forceRgbOutput: true}).mask(0.3),
    rgb
  ]).mosaic()
}

animation.animate(images.map(styleImage), {maxFrames: 120})
utils.exportVideo(images.limit(120), {maxFrames: 120})