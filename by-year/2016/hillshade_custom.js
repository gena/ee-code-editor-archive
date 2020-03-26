/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var dem = ee.Image("AHN/AHN2_05M_RUW"),
    dem2 = ee.Image("AHN/AHN2_05M_INT");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function radians(img) { return img.toFloat().multiply(Math.PI).divide(180); }

function terrain(dem, azimuth, zenith, scale)   {
  scale = scale || dem.projection().nominalScale()

  var k_dx = ee.Kernel.fixed(3, 3,
                         [[ 1/8,  0,  -1/8],
                          [ 2/8,  0,  -2/8],
                          [ 1/8,  0,  -1/8]]);
  
  var k_dy = ee.Kernel.fixed(3, 3,
                         [[ -1/8, -2/8,  -1/8],
                          [ 0,    0,    0],
                          [ 1/8, 2/8,   1/8]]);
  
  
  var dx = dem.convolve(k_dx)
  var dy = dem.convolve(k_dy)
  
  var slope = ee.Image().expression("sqrt((x*x + y*y)/(step*step))", {x: dx, y: dy, step: scale}).atan()
  
  var aspect = dx.atan2(dy).add(Math.PI)
  
  
  azimuth = radians(ee.Image.constant(azimuth))
  zenith = radians(ee.Image.constant(zenith))
  
  var hillshade = azimuth.subtract(aspect).cos().multiply(slope.sin()).multiply(zenith.sin()).add(zenith.cos().multiply(slope.cos()));

  return {
    slope: slope, 
    aspect: aspect,
    hillshade: hillshade
  }
}

var colorsRainbow = [
'F26C4F', // Light Red
'F68E55', // Light Red Orange	
'FBAF5C', // Light Yellow Orange
'FFF467', // Light Yellow
'ACD372', // Light Pea Green
'7CC576', // Light Yellow Green
'3BB878', // Light Green
'1ABBB4', // Light Green Cyan
'00BFF3', // Light Cyan
'438CCA', // Light Cyan Blue
'5574B9', // Light Blue
'605CA8', // Light Blue Violet
'855FA8', // Light Violet
'A763A8', // Light Violet Magenta
'F06EA9', // Light Magenta
'F26D7D'  // Light Magenta Red
];

dem = dem.resample('bicubic')

Map.addLayer(dem, {min:-5, max:50}, 'dem')

var azimuth = 90
var zenith = 30
var t = terrain(dem, azimuth, zenith)


Map.addLayer(t.slope, {min:0, max:1.5}, 'slope', true)

Map.addLayer(t.aspect, {min:0, max:2*Math.PI, palette:colorsRainbow}, 'aspect', true)

Map.addLayer(t.hillshade, {min:0, max:1}, 'hillshade', true)
