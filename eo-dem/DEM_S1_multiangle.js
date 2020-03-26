/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.MultiPoint(),
    imageVisParam = {"opacity":1,"bands":["y_1","y","y_1"],"min":-0.3,"max":0.3,"gamma":1};
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')
//var palettes = require('users/gena/packages:coloorbrewer').Palettes
//var thresholding = require('users/gena/packages:thresholding')
var utils = require('users/gena/packages:utils')

var bounds = ee.Geometry(Map.getBounds(true))
var scale = Map.getScale()

// skip partial
function addAllNonZero(i) { 
  return i.set('all', i.select(0).mask().reduceRegion(ee.Reducer.allNonZero(), bounds, scale).values().get(0))
}


var band1 = 'VH'
var band2 = 'VV'  
var mode = 'IW'

// var band1 = 'HH'
// var band2 = 'HV'  
// var mode = 'SM'

var images = ee.ImageCollection("COPERNICUS/S1_GRD")
  //.filterDate('2017-11-01', '2020-01-01')
  //.filterDate('2016-01-01', '2018-01-01')
  .filterBounds(bounds)
  //.map(addAllNonZero).filter(ee.Filter.eq('all', 1))
  //.sort('system:time_start')
  
print('Count (nofilter): ', images.size())  

images = images
  .filter(ee.Filter.eq('instrumentMode', mode))
  
print('Count (' + mode + '): ', images.size())  


images = images
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', band1))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', band2))
  
print('Count (filter bands): ', images.size())  

// median
var min = -20, max = -5
var min = 0, max = 0.5
var bandNames = ee.Image(images.first()).bandNames()

images = images.map(toNaturalNoAngle)

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
var percentiles = images.select([band1, band2]).reduce(ee.Reducer.percentile(p))
Map.addLayer(percentiles, {min: min, max: [0.1, 0.07, 0.4], gamma: 1.3}, 'percentiles', false)

var median_asc = images_asc
  //.limit(30)
  .map(resample).reduce(ee.Reducer.median()).rename(bandNames)

Map.addLayer(median_asc, {min: min, max: max, bands: [band2, band2, band1]}, 'median (asc)', false)
Map.addLayer(median_asc, {min: min, max: max, bands: [band1]}, 'median (asc) ' + band1, false) 
Map.addLayer(median_asc, {min: min, max: max, bands: [band2]}, 'median (asc) ' + band2, false)
Map.addLayer(images_asc, {min: min, max: max, bands: ['angle']}, 'median, angle (asc)', false)

var median_dsc = images_dsc
  //.limit(30)
  .map(resample).reduce(ee.Reducer.median()).rename(bandNames)

Map.addLayer(median_dsc, {min: min, max: max, bands: [band2, band2, band1]}, 'median (dsc)', false)
Map.addLayer(median_dsc, {min: min, max: max, bands: [band1]}, 'median (dsc) ' + band1, false)
Map.addLayer(median_dsc, {min: min, max: max, bands: [band2]}, 'median (dsc) ' + band2, false)
Map.addLayer(images_dsc, {min: min, max: max, bands: ['angle']}, 'median, angle (dsc)', false)

Map.addLayer(ee.Image([median_asc, median_dsc]), {min: min, max: max, bands: [band1, band1 + '_1', band1]}, 'median (asc, dsc) ' + band1, false)
Map.addLayer(ee.Image([median_asc, median_dsc]), {min: min, max: max, bands: [band2, band2 + '_1', band2]}, 'median (asc, dsc) ' + band2, false)

var i_asc = ee.Image(images_asc.first()).select('angle')
var azimuth_asc = ee.Terrain.aspect(median_asc.select('angle'))
                           .reduceRegion(ee.Reducer.mean(), i_asc.geometry(), 10000)
                           .get('aspect');
                           
azimuth_asc = ee.Number(90).add(ee.Number(azimuth_asc))

var i_dsc = ee.Image(images_dsc.first()).select('angle')
var azimuth_dsc = ee.Terrain.aspect(median_dsc.select('angle'))
                           .reduceRegion(ee.Reducer.mean(), i_dsc.geometry(), 10000)
                           .get('aspect');

azimuth_dsc = ee.Number(270).add(ee.Number(azimuth_dsc))

print('Azimuth, asc: ', azimuth_asc)
print('Azimuth, dsc: ', azimuth_dsc)

//azimuth_asc = 10
// azimuth_dsc = 190

var angle_asc = median_asc.select('angle')
print('angle_asc: ', angle_asc.reduceRegion({
    reducer: ee.Reducer.minMax(), 
    geometry: bounds, 
    scale: Map.getScale(), 
    tileScale: 4
}))

var angle_asc_mean = angle_asc.reduceRegion({
  reducer: ee.Reducer.mean(), 
  geometry: bounds, 
  scale: Map.getScale() * 10,
  tileScale: 4
}).get('angle')

var angle_dsc = median_dsc.select('angle')
print('angle_dsc: ', angle_dsc.reduceRegion({
    reducer: ee.Reducer.minMax(), 
    geometry: bounds, 
    scale: Map.getScale(), 
    tileScale: 4
}))

var angle_dsc_mean = angle_dsc.reduceRegion({
  reducer: ee.Reducer.mean(), 
  geometry: bounds, 
  scale: Map.getScale() * 10,
  tileScale: 4
}).get('angle')


var angle = 39
var demMin = -5
var demMax = 10
 
var demALOS = ee.Image('JAXA/ALOS/AW3D30_V1_1').select('MED').resample('bicubic')
var rgb = utils.hillshadeRGB(demALOS.visualize({min: demMin, max: demMax, forceRgbOutput: true}), demALOS, 1, 1, -90, angle) 
Map.addLayer(rgb, {}, 'ALOS', false)

var demSRTM = ee.Image('USGS/SRTMGL1_003').resample('bicubic')
var rgb = utils.hillshadeRGB(demSRTM.visualize({min: demMin, max: demMax, forceRgbOutput: true}), demSRTM, 1, 1, -90, angle) 
Map.addLayer(rgb, {}, 'SRTM', false)


var demNED = ee.Image('USGS/NED').resample('bicubic')
var rgb = utils.hillshadeRGB(demNED.visualize({min: demMin, max: demMax, forceRgbOutput: true}), demNED, 1, 1, -90, angle) 
Map.addLayer(rgb, {}, 'NED', false)

var demAHN = ee.Image("AHN/AHN2_05M_RUW");
var rgb = utils.hillshadeRGB(demAHN.visualize({min: demMin, max: demMax, forceRgbOutput: true}), demAHN, 1, 1, -90, angle) 
Map.addLayer(rgb, {}, 'AHN', false)


var hsALOS = ee.Terrain.hillshade(demALOS, azimuth_asc, angle_asc_mean)
Map.addLayer(hsALOS, {}, 'hillshade, ALOS, asc', false)

var hsALOS = ee.Terrain.hillshade(demALOS, azimuth_dsc, angle_dsc_mean)
Map.addLayer(hsALOS, {}, 'hillshade, ALOS, dsc', false)


// function radians(img) { return img.toFloat().multiply(3.1415927).divide(180); }

// var azimuth = 90
// var zenith = angle
// var terrain = ee.Algorithms.Terrain(dem)
// var slope = radians(terrain.select(['slope']));
// var aspect = radians(terrain.select(['aspect'])).resample('bicubic');
// var hs = utils.hillshade(azimuth, zenith, slope, aspect).resample('bicubic');

// Map.addLayer(hs, {palette: ['ffffff', '000000'], min: 0.38, max: 0.82}, 'ALOS (hs)', false)

// Map.addLayer(slope.resample('bicubic'), {min: 0, max: 1}, 'slope ALOS')
// Map.addLayer(aspect, {min: -1, max: 6.8}, 'aspect ALOS')

// var slope2 = median_asc.select('VV').add(median_dsc.select('VV')).divide(radians(ee.Image.constant(angle)).cos().multiply(2)).acos()
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

// optical
var images_optical = assets.getImages(bounds.centroid(1), {missions: ['S2'], resample: true})
  .filterDate('2016-01-01', '2018-01-01')
  .filter(ee.Filter.gte('SUN_ELEVATION', 0))
  //.filter(ee.Filter.lte('SUN_ELEVATION', 50))

images_optical = assets.getMostlyCleanImages(images_optical, bounds, { 
  cloudFrequencyThresholdDelta: 0.2 
})

print('Count (optical): ', images_optical.size())

// images = assets.clampImages(images, 0, 85)

images_optical = images_optical
  .select(['swir', 'nir'], [band1, band2])
  .map(function(i) {
    var alpha = toRadians(ee.Image.constant(i.get('SUN_AZIMUTH'))).rename('alpha')
    var beta = toRadians(ee.Image.constant(90).subtract(ee.Image.constant(i.get('SUN_ELEVATION')))).rename('beta')
    
    return i
      .addBands(alpha)
      .addBands(beta)
  })


function toRadians(i) {
  return i.multiply(Math.PI).divide(180)
}

// SAR
function prepareMultitemporal() {
  images_asc = images_asc.limit(30).map(function(i) {
    var beta = toRadians(i.select('angle')).rename('beta')
    var alpha = toRadians(ee.Image.constant(azimuth_asc)).rename('alpha')
    
    return i
      //.clamp(0, 2) 
      //.reduceNeighborhood(ee.Reducer.median(), ee.Kernel.circle(30, 'meters')).rename(i.bandNames())
      .addBands(alpha)
      .addBands(beta)
  })
  
  images_dsc = images_dsc.limit(30).map(function(i) {
    var beta = toRadians(i.select('angle')).rename('beta')
    var alphaR90 = toRadians(ee.Image.constant(azimuth_dsc)).rename('alpha')
    
    return i
      //.clamp(0, 2) 
      //.reduceNeighborhood(ee.Reducer.median(), ee.Kernel.circle(30, 'meters')).rename(i.bandNames())
      .addBands(alpha)
      .addBands(beta)
  })
  
  var I_images = images_asc.merge(images_dsc)

  I_images = I_images.map(function(i) {
    var mask = i.mask().reduce(ee.Reducer.allNonZero())
  
    return i.updateMask(mask)  
  })
  
  return I_images
}

function prepareAverage() {
  var beta_asc = toRadians(angle_asc).rename('beta')
  var alpha_asc = toRadians(ee.Image.constant(azimuth_asc)).rename('alpha')
  
  median_asc = median_asc
    .addBands(alpha_asc)
    .addBands(beta_asc)
    
  var beta_dsc = toRadians(angle_dsc).rename('beta')
  var alpha_dsc = toRadians(ee.Image.constant(azimuth_dsc)).rename('alpha')
      
  median_dsc = median_dsc
      .addBands(alpha_dsc)
      .addBands(beta_dsc)  
  
  var I_images = ee.ImageCollection.fromImages([
    median_asc,
    median_dsc,
  ])
  
  return I_images
}

//var I_images = images
//var I_images = prepareMultitemporal()
var I_images = prepareAverage()
//I_images = I_images.merge(images_optical.limit(2))

//animation.animate(images_optical)

var L = I_images.map(function(i) {
  var alpha = i.select('alpha')
  var beta = i.select('beta')
  
  var x = alpha.cos().multiply(beta.cos());
  var y = alpha.sin().multiply(beta.cos());
  var z = beta.sin();

  var result = ee.Image([x,y,z]).float().rename(['x','y','z'])

  return result
})

var I = I_images.map(function(i) {
  var beta = i.select('beta')
  return i.select([band1, band2]).multiply(beta.sin()).copyProperties(i) // multiply back
})

L = L.toArray()

var I = I.toArray()

var Lt = L.matrixTranspose()

var n = Lt.matrixMultiply(L).matrixPseudoInverse().matrixMultiply(Lt).matrixMultiply(I)

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

Map.addLayer(ee.Image([albedo1, albedo2, albedo2]), {min:min, max:max}, 'albedo', false)

// make it a unit vector
n1 = n1.divide(albedo1)
n2 = n2.divide(albedo2)

var v = 0.5
var gamma = 1

Map.addLayer(ee.Image([n1, n2]), {bands: ['x_1', 'x', 'x_1'], min: -0.8, max: 0.8}, 'n x')
Map.addLayer(ee.Image([n1, n2]), {bands: ['y_1', 'y', 'y_1'], min: -0.8, max: 0.8}, 'n y', false)

Map.addLayer(n1, {min:[-v, -v, 0], max:[v, v, v], gamma: gamma}, 'n1', false)
Map.addLayer(n2, {min:[-v, -v, 0], max:[v, v, v], gamma: gamma}, 'n1', false)


n = n1.add(n2).divide(2).multiply([-1, -1, 1])
// n = n1.add(n2).add(n3).add(n4).divide(4).multiply([-1, -1, 1])
Map.addLayer(n.divide(n.select([2])), {min:[-v, -v, 0], max:[v, v, v], gamma: gamma}, 'mean(n)', false)

var one = ee.Image.constant(1).float()

function toTangentVector(name, n, visibility) {
  var nt = n//.divide(n.select('z').abs())
  var x = nt.select('x').multiply(-1)
  var y = nt.select('y').multiply(-1)
  var z = one
  
  var l = one.add(one.add(x.pow(2).add(y.pow(2))).sqrt())
  var p = x.multiply(2).divide(l)
  var q = y.multiply(2).divide(l)
  
  nt = ee.Image([p, q, z])
  Map.addLayer(nt, {min:[-v, -v, 0], max:[v, v, v], gamma: gamma}, name + ' n tangent', visibility)
  return nt
}
  
var nt1 = toTangentVector(band1, n1, false)
var nt2 = toTangentVector(band2, n2, true)


function computeDemNormals(i) { 
  var di = i.gradient().multiply(-1)//.multiply(ee.Image.pixelArea().sqrt())
  
  var z = one.rename('z')
  var v = di.addBands(z)
  
  //var n = v.divide(v.pow(2).reduce(ee.Reducer.sum()).sqrt())
  
  return v
}

var demNormals = computeDemNormals(demALOS)
Map.addLayer(demNormals, { min: [-v, -v, 0], max: [v, v, v] }, 'n dem', false)


function unitScale(i) {
  var scale = Map.getScale()
  var region = Map.getBounds(true)
  
  var minMax = i.reduceRegion({
    //reducer: ee.Reducer.percentile([1, 99]),
    reducer: ee.Reducer.minMax(), 
    geometry: region, 
    scale: scale,
    tileScale: 4
  }).values()
  
  var min = ee.Image.constant(minMax.get(0)).float()
  var max = ee.Image.constant(minMax.get(1)).float()
  
  var scaled = i.subtract(min).divide(max.subtract(min)).unitScale(0, 1)
  
  return scaled
}

var hsNED = ee.Terrain.hillshade(demNED, -90, angle)
var hsALOS = ee.Terrain.hillshade(demALOS, -90, angle)
var hsSRTM = ee.Terrain.hillshade(demSRTM, -90, angle)
var hsAHN = ee.Terrain.hillshade(demAHN, -90, angle)

//var hs = hsSRTM
//var hs = hsNED
var hs = hsALOS
//var hs = hsAHN

var hsS1 = ee.Image([n1.select(0), n2.select(0)]).reduce(ee.Reducer.mean())
// Map.addLayer(unitScale(hsS1), {palette: ['ffffff', '000000'], min: 0, max: 1}, 'S1 L2', false)

var diff = unitScale(hs).subtract(unitScale(hsS1))
// Map.addLayer(diff, {min: -0.8, max: 0.8, palette: ['ff0000', 'ffffff', '0000ff']}, 'hillshade, diff', false)

function showScatterPlots() {
  var xy = hsS1.rename('x').addBands(hsAHN.rename('y')).sample({
    region: Map.getBounds(true),
    scale: Map.getScale(),
    tileScale: 4,
    numPixels: 4500
  })
  
  print(xy.reduceColumns(ee.Reducer.spearmansCorrelation(), ['x', 'y']).get('correlation'))
  
  print(ui.Chart.feature.byFeature(xy, 'x', ['y']).setChartType('ScatterChart')
    .setOptions({pointSize: 1, title: 'S1 vs AHN', width: 400, height: 400}))
  
  var xy = hsS1.rename('x').addBands(hsALOS.rename('y')).sample({
    region: Map.getBounds(true),
    scale: Map.getScale(),
    tileScale: 4,
    numPixels: 4500
  })
  
  print(xy.reduceColumns(ee.Reducer.spearmansCorrelation(), ['x', 'y']).get('correlation'))
  
  print(ui.Chart.feature.byFeature(xy, 'x', ['y']).setChartType('ScatterChart')
    .setOptions({pointSize: 1, title: 'S1 vs ALOS', width: 400, height: 400}))
  
  var xy = hsS1.rename('x').addBands(hsNED.rename('y')).sample({
    region: Map.getBounds(true),
    scale: Map.getScale(),
    tileScale: 4,
    numPixels: 4500
  })
  
  print(xy.reduceColumns(ee.Reducer.spearmansCorrelation(), ['x', 'y']).get('correlation'))
  
  print(ui.Chart.feature.byFeature(xy, 'x', ['y']).setChartType('ScatterChart')
    .setOptions({pointSize: 1, title: 'S1 vs NED', width: 400, height: 400}))
}

showScatterPlots()



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
  return ee.Image(ee.Image.constant(10.0).pow(i.divide(10.0))
    .copyProperties(i, ['system:time_start'])
    .copyProperties(i));
}

function toNaturalNoAngle(i) {
  var angle = i.select('angle')
  
  return ee.Image(ee.Image.constant(10.0).pow(i.select([band1, band2]).divide(10.0)).clamp(0, 1)
    .addBands(angle, ['angle'])
    .copyProperties(i, ['system:time_start'])
    .copyProperties(i))
}
