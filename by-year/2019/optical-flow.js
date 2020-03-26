// default/optical-flow.js

var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')

var bounds = Map.getBounds(true)

var images = assets.getImages(bounds, { 
  resample: true 
})

var count = 15

images = assets.getMostlyCleanImages(images, bounds, {cloudFrequencyThresholdDelta: 0.3})
  .sort('system:time_start')
  .limit(count)
  .map(function(i) {
    // remove some clouds
    return i//.updateMask(i.select('blue').unitScale(0.15, 0.3).subtract(1).multiply(-1))
      .addBands(i.normalizedDifference(['green', 'nir']).rename('NDWI'))
  })
  //.select('nir')
  .toList(count)
  
var bands = ['NDWI']
  
// var scale = Map.getScale()
// var bounds = Map.getBounds(true)
// var maxFrames = 100
// var getGlyph = animation.getGlyph({ scale: scale, bounds: bounds, frameCount: maxFrames })
// var images = ee.List.sequence(0, maxFrames).map(getGlyph).map(function(i) { return ee.Image(i).float().unmask(0, false).translate(500, 0, 'pixels') })
// bands = ['b1']

// composites instead of real images

var n = 3
images = ee.List.sequence(n, images.size().subtract(1)).map(function(i) {
  return ee.ImageCollection.fromImages(images.slice(ee.Number(i).subtract(n), i)).median()
})


function Dt(images) {
  var list = images
  
  return list.slice(0, -1).zip(list.slice(1))
    .map(function(i) { 
      var I_t1 = ee.Image(ee.List(i).get(0)).select(bands)
      var I_t2 = ee.Image(ee.List(i).get(1)).select(bands)

      I_t1 = I_t1.convolve(ee.Kernel.fixed(3, 3, [
          [ 1, 1, 1],
          [ 1, 1, 1],
          [ 1, 1, 1]
      ], -1, -1, true))
      
      I_t2 = I_t2.convolve(ee.Kernel.fixed(3, 3, [
          [ 1, 1, 1],
          [ 1, 1, 1],
          [ 1, 1, 1]
      ], -1, -1, true))

      var bandNames = I_t1.bandNames().map(function(s) { return ee.String(s).cat('_dt') })
      
      var dI_t = I_t1.subtract(I_t2).rename(bandNames)
      
      return dI_t
    })
}

function Dx(i) {
  return i.convolve(ee.Kernel.fixed(3, 3, [
      [-0.25, 0.25, 0],
      [-0.5, 0.5, 0],
      [-0.25, 0.25, 0]
  ], -1, -1, true))
}

function Dy(i) {
  return i.convolve(ee.Kernel.fixed(3, 3, [
      [ -0.25, -0.5, -0.25],
      [ 0.25, 0.5, 0.25],
      [ 0, 0, 0]
  ], -1, -1, true))
}

function neighborhoodToBands(i) {
  return i.neighborhoodToBands(ee.Kernel.square(1, 'pixels'))
}

var dI_t = Dt(images)

var flow = images.zip(dI_t).map(function(o) {
  var o = ee.List(o)
  
  var i = ee.Image(o.get(0))
  var di_t = ee.Image(o.get(1))
  
  // return di_t.unitScale(-0.3, 0.3)
  
  // var grad = i.gradient()
  
  // var di_x = grad.select(0)
  // var di_y = grad.select(1)
  
  var di_x = Dx(i.select(bands))
  var di_y = Dy(i.select(bands))
  
  var mask = di_x.abs().max(di_y.abs()).reduce(ee.Reducer.mean()).multiply(10).unitScale(0.05, 0.15).clamp(0, 1)//.focal_max(2)

  di_x = di_x.updateMask(mask)
  di_y = di_y.updateMask(mask)

  
  //return ee.Image([di_x, di_y]).multiply(5) //.unitScale(-0.3, 0.3)//.visualize({min: -0.3, max: 0.3})//.updateMask(di_x.abs().max(di_y).abs().unitScale(0.5, 1))
  
  var A = neighborhoodToBands(di_x).toArray().arrayCat(neighborhoodToBands(di_y).toArray(), 1)
  var b = neighborhoodToBands(di_t).toArray().multiply(-1)

  var uv = A.matrixTranspose().matrixMultiply(A).matrixInverse().matrixMultiply(A.matrixTranspose())
    .matrixMultiply(b.arrayCat(b, 1)).arraySlice(1, 0, 1).arrayTranspose().arrayProject([1]).arrayFlatten([['u', 'v']])
    
  //uv = uv.reproject(ee.Projection('EPSG:3857').atScale(Map.getScale() * 2)).resample('bilinear')
  //uv = uv.reduceResolution(ee.Reducer.max(), false)

  //return uv
  
  var uv_mask = ee.Image.constant(1)
  //var uv_mask = uv.reduce(ee.Reducer.max()).abs().unitScale(5, 15)
  
  return ee.ImageCollection.fromImages([
    i
      .visualize({forceRgbOutput: true}),
    
    // uv.select(0).divide(uv.select(1)).atan()
    //   .visualize({ opacity: 0.5, min: 0, max: 1, forceRgbOutput: true})
      
    // uv
    //   .pow(2).reduce(ee.Reducer.sum())
    //   .visualize({ opacity: 0.5, min: 0, max: 50, forceRgbOutput: true})

    uv
      // .updateMask(mask)
      .visualize({ opacity: 0.5, bands: ['u', 'v', 'v'], min: [-15, -15, -15], max: [15, 15, 15], forceRgbOutput: true})
    ]).mosaic()
})

print(flow)
animation.animate(flow, { maxFrames: count })