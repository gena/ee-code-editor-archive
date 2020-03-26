/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var hycom = ee.ImageCollection("HYCOM/GLBu0_08/sea_temp_salinity"),
    ncep = ee.ImageCollection("NOAA/CFSV2/FOR6H");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var utils = require('users/gena/packages:utils')
var animation = require('users/gena/packages:animation')
var palettes = require('users/gena/packages:colorbrewer').Palettes

// var images = hycom.select('sst_0') 
// var style = {min: -10000, max: 10000, palette: palettes.Spectral[9]}
// var exaggregation = 50

var images = ncep.select('Temperature_height_above_ground') 

var style = {min: 270, max: 300, palette: palettes.Spectral[9].reverse()}
var exaggregation = 50000

var weight = 1.1 // hillshade vs color
var azimuth = 0
var elevation = 25
var castShadows = true

function styleImage(image) {
  image = image.resample('bilinear')
  
  var rgb = utils.hillshadeRGB(
      image.visualize(style),  // style
      image, // elevation 
      weight, exaggregation, azimuth, elevation, castShadows)
      
  return rgb
    .set({label: image.date().format('YYYY-MM-dd HH:SS')})
}


images = images.map(styleImage)

animation.animate(images)

utils.exportVideo(images.limit(300), {maxFrames: 300, label: 'label'})