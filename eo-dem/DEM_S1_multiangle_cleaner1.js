var utils = require('users/gena/packages:utils')
var animation = require('users/gena/packages:animation')

function toRadians(i) {
  return i.multiply(Math.PI).divide(180)
}

function toNatural(i) {
  var angle = i.select('angle')
  
  var bands = i.bandNames().remove('angle')
  
  return ee.Image(ee.Image.constant(10.0).pow(i.select(bands).divide(10.0)).clamp(0, 1)
    .addBands(angle, ['angle'])
    .copyProperties(i, ['system:time_start'])
    .copyProperties(i))
}

function resample(image) {
  return image.resample('bilinear')
}


//Map.setCenter(-119.8414, 37.6693, 13) 

var start = '2017-02-01'

// in months
var tInterval = 3
var tStep = 3
var tMax = 30

var bounds = ee.Geometry(Map.getBounds(true))
var scale = Map.getScale()

// var band1 = 'HH'
// var band2 = 'HV'  

var band1 = 'VH'
var band2 = 'VV'  

// var mode = 'SM'
var mode = 'IW'

// print(ee.ImageCollection("COPERNICUS/S1_GRD")
//   .filterBounds(bounds)
//   .limit(50)
//   .aggregate_array('transmitterReceiverPolarisation'))  

/***
 * Estimates elevation using panchromatic stereo (shape-from-shade)
 */
function computeElevation(images) {
  images = ee.ImageCollection(images)
    
  var bandNames = ee.Image(images.first()).bandNames()

  images = images.map(toNatural)

  var images_asc = images
    .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
  
  var images_dsc = images  
    .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))

  var size = images_asc.size().min(images_dsc.size())
  images_asc = images_asc.limit(size)
  images_dsc = images_dsc.limit(size)

  var median_asc = images_asc
    //.limit(30)
    .map(resample).reduce(ee.Reducer.median()).rename(bandNames)
  
  var median_dsc = images_dsc
    //.limit(30)
    .map(resample).reduce(ee.Reducer.median()).rename(bandNames)

  // TODO: estimate from angle + slope, combine with optical
  var azimuth_asc = 10
  var azimuth_dsc = 190

  var angle_asc = median_asc.select('angle')
  
  var angle_asc_mean = angle_asc.reduceRegion({
    reducer: ee.Reducer.mean(), 
    geometry: bounds, 
    scale: Map.getScale() * 10,
    tileScale: 4
  }).get('angle')

  var angle_dsc = median_dsc.select('angle')

  var angle_dsc_mean = angle_dsc.reduceRegion({
    reducer: ee.Reducer.mean(), 
    geometry: bounds, 
    scale: Map.getScale() * 10,
    tileScale: 4
  }).get('angle')


  var beta_asc = toRadians(angle_asc).rename('beta')
  var alpha_asc = toRadians(ee.Image.constant(azimuth_asc)).float().rename('alpha')
  
  median_asc = median_asc
    .addBands(alpha_asc)
    .addBands(beta_asc)
    
  var beta_dsc = toRadians(angle_dsc).rename('beta')
  var alpha_dsc = toRadians(ee.Image.constant(azimuth_dsc)).float().rename('alpha')
      
  median_dsc = median_dsc
      .addBands(alpha_dsc)
      .addBands(beta_dsc)  
  
  var I_images = ee.ImageCollection.fromImages([
    median_asc,
    median_dsc,
  ])
  
  I_images = I_images.map(function(i) {
    var mask = i.mask().reduce(ee.Reducer.allNonZero())
    
    return i.updateMask(mask)
  })
  
  var count = I_images.count().reduce(ee.Reducer.allNonZero()).mask()
  
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
  
  // make it a unit vector
  n1 = n1.divide(albedo1)
  n2 = n2.divide(albedo2)
  
  return { 
    normals: ee.Image([n1, n2]).updateMask(count)
  }
} 

function generateImageCollection(from, to) {
  var images = ee.ImageCollection("COPERNICUS/S1_GRD")
    .filterBounds(bounds)
    .filterDate(from, to)
    .filter(ee.Filter.eq('instrumentMode', mode))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', band1))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', band2))

  var images_asc = images
    .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
  
  var images_dsc = images  
    .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))

  var size_asc = images_asc.size()
  var size_dsc = images_dsc.size()

  // images = images.map(function(i) {
  //   return i.clip(i.geometry().buffer(-4000))
  // })

  return images
    .set({ label: from.format('YYYY-MM').cat(' ').cat(to.format('YYYY-MM')) })
    .set({ size_asc: images_asc.size() })
    .set({ size_dsc: images_dsc.size() })
}

var imageCollections = ee.List.sequence(0, tMax, tStep).map(function(m) {
  var from = ee.Date(start).advance(m, 'month')
  var to = from.advance(tInterval, 'month')

  return generateImageCollection(from, to)
})

imageCollections = ee.FeatureCollection(imageCollections)

print(imageCollections.aggregate_array('size_asc'))
print(imageCollections.aggregate_array('size_dsc'))

imageCollections = imageCollections.filter(
  ee.Filter.and(
    ee.Filter.gt('size_asc', 0), 
    ee.Filter.gt('size_dsc', 0)
  )
)

var vectorMin = -0.9
var vectorMax = 0.9

var images = imageCollections.map(function(images) {
  images = ee.ImageCollection(images)

  var result = computeElevation(images)

  result = ee.Dictionary(result)
  
  var image = ee.Image(result.get('normals'))
    .visualize({bands: ['x_1', 'x', 'x_1'], min: vectorMin, max: vectorMax})
    .set({ label: images.get('label') })
    
  return image
})

animation.animate(images, { maxFrames: Math.floor(tMax / tStep) })

var demMin = -50
var demMax = -15

var demALOS = ee.Image('JAXA/ALOS/AW3D30_V1_1').select('MED').resample('bicubic')
var rgb = utils.hillshadeRGB(demALOS.visualize({min: demMin, max: demMax, forceRgbOutput: true}), demALOS, 1, 1, -90, 40) 
Map.addLayer(rgb, {}, 'ALOS', false)


// all images
var from = '2014-01-01'
var to = '2019-01-01'
var images = generateImageCollection(ee.Date(from), ee.Date(to))

print(images.size())

var result = computeElevation(images)

Map.addLayer(result.normals, {bands: ['x_1', 'x', 'x_1'], min: vectorMin, max: vectorMax}, from + ' ' + to, false)
