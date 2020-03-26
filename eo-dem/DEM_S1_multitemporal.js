/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var animation = require('users/gena/packages:animation')
var palettes = require('users/gena/packages:colorbrewer').Palettes
var thresholding = require('users/gena/packages:thresholding')
var utils = require('users/gena/packages:utils')

var bounds = ee.Geometry(Map.getBounds(true))
var scale = Map.getScale()

// skip partial
function addAllNonZero(i) { 
  return i.set('all', i.select(0).mask().reduceRegion(ee.Reducer.allNonZero(), bounds, scale).values().get(0))
}


var band1 = 'VH'
var band2 = 'VV'  

// var band1 = 'HH'
// var band2 = 'HV'  

var images = ee.ImageCollection("COPERNICUS/S1_GRD")
  //.filterDate('2017-11-01', '2020-01-01')
  //.filterDate('2016-01-01', '2018-01-01')
  .filterBounds(bounds.centroid(1))
  //.map(addAllNonZero).filter(ee.Filter.eq('all', 1))
  .sort('system:time_start')
  
print(images.size())  


images = images
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', band1))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', band2))
  
print(images.size())  

// median
var min = -20, max = -5
var min = 0, max = 0.5
var bandNames = ee.Image(images.first()).bandNames()

var images_asc = images
  .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
  
var images_dsc = images  
  .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))

// images  = images
//   // Filter to get images collected in interferometric wide swath mode.
//   .filter(ee.Filter.eq('instrumentMode', 'IW'))

images = images_asc
// images = images_dsc
function resample(image) {
  return image.resample('bilinear')
}

var p = [0, 30, 70]
var percentiles = toNatural(images.reduce(ee.Reducer.percentile(p))).select(0)
Map.addLayer(percentiles, {min: min, max: max}, 'percentiles', false)

var median_asc = images_asc.map(resample).map(toNatural).reduce(ee.Reducer.median()).rename(bandNames)
Map.addLayer(median_asc, {min: min, max: max, bands: [band2, band2, band1]}, 'median (asc)', false)
Map.addLayer(median_asc, {min: min, max: max, bands: [band1]}, 'median (asc) ' + band1, false)
Map.addLayer(median_asc, {min: min, max: max, bands: [band2]}, 'median (asc) ' + band2, false)
Map.addLayer(images_asc, {min: min, max: max, bands: ['angle']}, 'median, angle (asc)', false)

var median_dsc = images_dsc.map(resample).map(toNatural).reduce(ee.Reducer.median()).rename(bandNames)
Map.addLayer(median_dsc, {min: min, max: max, bands: [band2, band2, band1]}, 'median (dsc)', false)
Map.addLayer(median_dsc, {min: min, max: max, bands: [band1]}, 'median (dsc) ' + band1, false)
Map.addLayer(median_dsc, {min: min, max: max, bands: [band2]}, 'median (dsc) ' + band2, false)
Map.addLayer(images_dsc, {min: min, max: max, bands: ['angle']}, 'median, angle (dsc)', false)

Map.addLayer(ee.Image([median_asc, median_dsc]), {min: min, max: max, bands: [band2, band2 + '_1', band2]}, 'median (asc, dsc) ' + band2, false)

var a = 39
var demMin = -5
var demMax = 10

var dem = ee.Image('JAXA/ALOS/AW3D30_V1_1').select('MED').resample('bicubic')
var rgb = utils.hillshadeRGB(dem.visualize({min: demMin, max: demMax, forceRgbOutput: true}), dem, 1, 1, -90, a) 
Map.addLayer(rgb, {}, 'ALOS', false)

var dem2 = ee.Image("AHN/AHN2_05M_RUW");
var rgb = utils.hillshadeRGB(dem2.visualize({min: demMin, max: demMax, forceRgbOutput: true}), dem2, 1, 1, -90, a) 
Map.addLayer(rgb, {}, 'AHN', false)


// function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }

// var azimuth = 90
// var zenith = a
// var terrain = ee.Algorithms.Terrain(dem)
// var slope = radians(terrain.select(['slope']));
// var aspect = radians(terrain.select(['aspect'])).resample('bicubic');
// var hs = utils.hillshade(azimuth, zenith, slope, aspect).resample('bicubic');

// Map.addLayer(hs, {palette: ['ffffff', '000000'], min: 0.38, max: 0.82}, 'ALOS (hs)', false)

// Map.addLayer(slope.resample('bicubic'), {min: 0, max: 1}, 'slope ALOS')
// Map.addLayer(aspect, {min: -1, max: 6.8}, 'aspect ALOS')

// var slope2 = median_asc.select('VV').add(median_dsc.select('VV')).divide(radians(ee.Image.constant(a)).cos().multiply(2)).acos()
// Map.addLayer(slope2, {min: 1.4, max: 0.9}, 'slope S1')

//var aspect2 = median_asc.subtract()

/*
IC1 = cos(S1_zenith) * cos(Z_slope) + sin(S1_zenith) * sin(Z_slope) * cos(S1_azimuth - Z_aspect)
IC2 = cos(S1_zenith) * cos(Z_slope) + sin(S1_zenith) * sin(Z_slope) * cos(S1_azimuth + pi - Z_aspect)


a = b * cos(x) + c * sin(x) * cos(d - y)
e = b * cos(x) + c * sin(x) * cos(d + pi - y)

a = b * cos(x) + c * sin(x) * cos(d - y)
e = b * cos(x) - c * sin(x) * cos(d - y)


   a          b * cos(x)
--------    = ----------    + y
c * sin(x)    c * sin(x)
 
   e          b * cos(x)
--------    = ----------    - y
c * sin(x)    c * sin(x)

a  +  e = 2 * b * cos(x)

cos(x) = (a+e)/2 * b

cos(x) = (IC1 + IC2) / 2 * cos(S1_zenith)



y = (a - b * cos(x)) / c * sin(x)

y = (IC1 - cos(S1_zenith) * cos(x)) / sin(S1_zenith) * sin(x)

*/


// var I_images = ee.ImageCollection.fromImages([
//   median_asc.set('SUN_ELEVATION', 90-a).set('SUN_AZIMUTH', 0),
//   median_dsc.set('SUN_ELEVATION', 90-a).set('SUN_AZIMUTH', 180),

// ])

// var I = I_images.select([band1, band2])

I = images.map(function(i) {
  var pass = i.get('orbitProperties_pass')
  var asc = ee.Algorithms.IsEqual(pass, 'ASCENDING')

  var beta = ee.Image.constant(90).subtract(i.select('angle')).multiply(Math.PI).divide(180)
  //var beta = ee.Image.constant(90-39).multiply(Math.PI).divide(180)

  return i.select([band1, band2]).multiply(beta.sin()) // multiply back
    .addBands(beta.rename('beta'))
    .copyProperties(i)
    .set({SUN_AZIMUTH: ee.Number(ee.Algorithms.If(asc, 20, 200)) })
})

var L = I.map(function(i) {
  var beta = i.select('beta')

  var alpha = ee.Image.constant(i.get('SUN_AZIMUTH')).multiply(Math.PI).divide(180)

  var x = alpha.cos().multiply(beta.cos());
  var y = alpha.sin().multiply(beta.cos());
  var z = beta.sin();

  var mask = beta.mask()

  var result = ee.Image([x,y,z]).float().mask(mask).rename(['x','y','z'])

  return result
})

I = I.select([band1, band2])//.map(toNatural)

Map.addLayer(I, {}, 'I', false)
Map.addLayer(L, {}, 'L', false)

L = L.toArray()

var I = I.toArray()

var Lt = L.matrixTranspose()

var n = Lt.matrixMultiply(L).matrixInverse().matrixMultiply(Lt).matrixMultiply(I)

var n1 = n
  .arraySlice(1, 0, 1)
  .arrayProject([0]).arrayFlatten([['x','y','z']])

var n2 = n
  .arraySlice(1, 1, 2)
  .arrayProject([0]).arrayFlatten([['x','y','z']])

var albedo1 = n1.pow(2).reduce(ee.Reducer.sum()).sqrt()
var albedo2 = n2.pow(2).reduce(ee.Reducer.sum()).sqrt()

var min = 0.05
var max = 0.45

Map.addLayer(ee.Image([albedo1, albedo2, albedo2]), {min:min, max:max}, 'albedo', true)

// make it a unit vector
n1 = n1.divide(albedo1)
n2 = n2.divide(albedo2)

var v = 0.75
var gamma = 1

Map.addLayer(ee.Image([n1, n2]), {}, 'n', false)
// Map.addLayer(n1, {min:[-v, -v, 0], max:[v, v, v], gamma: gamma}, 'n1', false)
// Map.addLayer(n2, {min:[-v, -v, 0], max:[v, v, v], gamma: gamma}, 'n1', false)

throw('stop')

// visualize  
images = images.map(function(i) {
  var mask = ee.List(i.select(0).mask().reduceRegion(ee.Reducer.sum(), bounds, Map.getScale() * 50).values()).get(0)
  
  var date = i.date().format('YYYY-MM-dd')
  
  // i = toNatural(i.select(band))
  // var min = 0.0, max = 0.2
  // return i
  //   .visualize({min: min, max: max, palette: palettes.BrBG[9].reverse() })
  //   .set({label: date})
  //   .set({mask: mask})
  
  var min = -20, max = -5
  var min = 0.03, max = [0.2, 0.6, 0.2]
  
  var image = toNatural(i)
  var output = image
    .visualize({min: min, max: max, bands: [band2, band2, band1], gamma: 1.6})
    
  //var th = thresholding.computeThresholdUsingOtsu(image.select('VV').focal_median(3), 10, Map.getBounds(true), 0.5, 2, -10)
  
  // output = image.select('VH').gt(0.05)
    
  // output = ee.ImageCollection.fromImages([
  //   output,
  //   toNatural(i.select('VV')).cumulativeCost(ee.Image().paint(geometry, 1), 3000)
  //   ]).mosaic()

  return output
    .set({label: i.date().format('YYYY-MM-dd')})
    
    
})//.filter(ee.Filter.lt('mask', 10))

print(images.aggregate_array('mask'))

animation.animate(images, {label: 'label', maxFrames: 150})

// export video
var utils = require('users/gena/packages:utils')
utils.exportVideo(images, {bounds: bounds, label: 'label', maxFrames: 600, name: 'animation', label: 'label' })



// Functions to convert from dB
function toNatural(i) {
  return ee.Image(ee.Image.constant(10.0).pow(i.divide(10.0)).copyProperties(i, ['system:time_start']));

  // var angle = i.select('angle')
  
  // return ee.Image(ee.Image.constant(10.0).pow(i.divide(10.0))
  //   .addBands(angle, ['angle'], true)
  //   .copyProperties(i, ['system:time_start']));
}

