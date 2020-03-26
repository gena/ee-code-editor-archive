/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var srtm = ee.Image("USGS/SRTMGL1_003");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var min = -10
var max = 10
var step = 2
var levels = ee.List.sequence(min, max, step)

var contours = levels.map(function(level) {
  var contour = srtm
    .resample('bicubic')
    .convolve(ee.Kernel.gaussian(5, 3))
    .subtract(ee.Image.constant(level)).zeroCrossing() // line contours
    // .gt(ee.Image.constatn(level)) // area
    .multiply(ee.Image.constant(level)).toFloat();
    
  return contour.mask(contour);
})

contours = ee.ImageCollection(contours).mosaic()

Map.addLayer(ee.Image(1).toByte(), {palette:['000000'], opacity: 0.8}, 'background')
Map.addLayer(contours, {min: min, max: max, palette:['00ff00', 'ff0000']}, 'contours')

Map.setOptions('SATELLITE')