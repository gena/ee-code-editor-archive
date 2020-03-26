/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var z = ee.Image("AHN/AHN2_05M_RUW"),
    alos = ee.Image("JAXA/ALOS/AW3D30_V1_1");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
z = z.resample('bilinear')//.convolve(ee.Kernel.gaussian(3, 2))

z = z.unmask(alos.select('MED').resample('bilinear'))

Map.addLayer(z, {min: 0, max: 50}, 'z')

var scale = Map.getScale()
var ex = 4
var terrain = Terrain(z.multiply(ex), scale)
var aspect = terrain.aspect
var slope = terrain.slope

var azimuth = 0
var zenith = 45

var hillshade = Hillshade(azimuth, zenith, slope, aspect)
Map.addLayer(hillshade, {min: 0.25, max: 0.7}, 'hillshade', false)

var animation = require('users/gena/packages:animation')

function radians(img) { 
  return img.toFloat().multiply(Math.PI).divide(180); 
}

function Hillshade(azimuth, zenith, slope, aspect) {
  var azimuth = radians(ee.Image.constant(azimuth));
  var zenith = radians(ee.Image.constant(zenith));
  
  return azimuth.subtract(aspect).cos().multiply(slope.sin()).multiply(zenith.sin())
      .add(zenith.cos().multiply(slope.cos()))
}

function Terrain(d, scale) {
  var k_dx = ee.Kernel.fixed(3, 3,
                         [[ 1/8,  0,  -1/8],
                          [ 2/8,  0,  -2/8],
                          [ 1/8,  0,  -1/8]]);
  
  var k_dy = ee.Kernel.fixed(3, 3,
                         [[ -1/8, -2/8,  -1/8],
                          [ 0,    0,    0],
                          [ 1/8, 2/8,   1/8]]);
  
  
  var dx = d.convolve(k_dx)
  var dy = d.convolve(k_dy)
  
  var slope = ee.Image().expression("sqrt((x * x + y * y)/(scale * scale))", {x: dx, y: dy, scale: scale}).atan()
  
  //var terrain = ee.Algorithms.Terrain(d);
  //var slope = radians(terrain.select(['slope']));
  
  var aspect = dy.multiply(-1).atan2(dx.multiply(-1)).add(Math.PI)
  
  return { slope: slope, aspect: aspect }
}

function renderShadows(zenith, azimuth) {
  var hysteresis = true

  var hillShadow = ee.Algorithms.HillShadow(z.multiply(ex), azimuth, zenith, neighborhoodSize, hysteresis).rename('x').float()
    .not()
    
  // opening
  // hillShadow = hillShadow.multiply(hillShadow.focal_min(3).focal_max(6))    
  
  // cleaning
  hillShadow = hillShadow.focal_mode(3)
  
  // smoothing  
  hillShadow = hillShadow.convolve(ee.Kernel.gaussian(5, 3))
  
  // transparent
  hillShadow = hillShadow.multiply(0.4)
  
  var hillshade = Hillshade(azimuth, zenith, slope, aspect).rename('x')
  
  return ee.ImageCollection.fromImages([
    hillshade.visualize({min: 0.1, max: 0.9, palette: ['000000', 'ffffff']}), 
    hillShadow.mask(hillShadow).visualize({min:0, max: 1, palette: ['000000']})
  ]).mosaic()
}

var count = 180
var neighborhoodSize = 100
var hillshadeImages = ee.List.sequence(0, 365, 365 / count).map(function(azimuth) {
  return renderShadows(zenith, azimuth)
})

var images = ee.ImageCollection(hillshadeImages)

// animation.animate(images, { maxFrames: count })

// require('users/gena/packages:utils').exportVideo(images, { name: 'shadows', framesPerSecond: 12, maxFrames: count + 1 })

var assets = require('users/gena/packages:assets')

var images = assets.getImages(Map.getBounds(true), { sensors: ['S2'] })
var bounds = Map.getBounds(true)
images = assets.getMostlyCleanImages(images, bounds)
animation.animate(images, { maxFrames: 10 })

/*


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

Map.addLayer(slope.mask(slope.subtract(1.3).multiply(-1)), {palette:['000000', 'ffff50'], min:0, max:1}, 'slope', true)
Map.addLayer(aspect.multiply(180).divide(Math.PI), {min:0, max:365, palette:colorsRainbow}, 'aspect', true)

// ee.Algorithms.HillShadow()


function app() {
  // Map.centerObject(geometry, 17)
  
  var scale = Map.getScale()

  var image = ee.Image(1).int().paint(geometry, 0)
  
  var maxDistance = 20000
  
  //var d = image.distance(ee.Kernel.euclidean(maxDistance, "meters"))
  var d = image.fastDistanceTransform()
  
  d = d.clip(geometry);
  
  var terrain = Terrain(d, scale)
  var aspect = terrain.aspect
  var slope = terrain.slope

  Map.addLayer(d, {min:0, max:maxDistance}, 'distance')

  Map.addLayer(aspect.multiply(180).divide(Math.PI), {min:0, max:365, palette:colorsRainbow}, 'aspect', true)
  Map.addLayer(slope.mask(slope.subtract(1.3).multiply(-1)), {palette:['000000', 'ffff50'], min:0, max:1}, 'slope', true)
  
  var terrain = ee.Algorithms.Terrain(d.unmask().reproject(ee.Projection('EPSG:3857').atScale(scale)))
  Map.addLayer(terrain.select('aspect'), {min:0, max: 365, palette:colorsRainbow}, 'aspect 2', true)


  // var cannya = ee.Algorithms.CannyEdgeDetector(aspect, 0.1, 0)
  // Map.addLayer(cannya.mask(cannya).reproject('EPSG:3857', null, step), {min: 0, max: 1, palette: 'ff0000'}, 'canny(aspect)');


}

//app()
*/