/***
 * Multiteporal speckle filter: image is the original image, images is the temporal collection of images
 */
function multitemporalDespeckle(images, radius, units, opt_timeWindow) {
  var timeWindow = opt_timeWindow || { before: -3, after: 3, units: 'month' }
  
  var bandNames = ee.Image(images.first()).bandNames()
  var bandNamesMean = bandNames.map(function(b) { return ee.String(b).cat('_mean') })
  var bandNamesRatio = bandNames.map(function(b) { return ee.String(b).cat('_ratio') })
  
  // compute space-average for all images
  var meanSpace = images.map(function(i) {
    var reducer = ee.Reducer.mean()
    var kernel = ee.Kernel.square(radius, units)
    
    var mean = i.reduceNeighborhood(reducer, kernel).rename(bandNamesMean)
    var ratio = i.divide(mean).rename(bandNamesRatio)

    return i.addBands(mean).addBands(ratio)
  })

  /***
   * computes a multi-temporal despeckle function for a single image
   */
  function multitemporalDespeckleSingle(image) {
    var t = image.date()
    var from = t.advance(ee.Number(timeWindow.before), timeWindow.units)
    var to = t.advance(ee.Number(timeWindow.after), timeWindow.units)
    
    var meanSpace2 = ee.ImageCollection(meanSpace).select(bandNamesRatio).filterDate(from, to)
    
    var b = image.select(bandNamesMean)

    return b.multiply(meanSpace2.sum()).divide(meanSpace2.size()).rename(bandNames)
  }
  
  return meanSpace.map(multitemporalDespeckleSingle).select(bandNames)
}

/////////////////////////////////////////
// testing
/////////////////////////////////////////

var pt = ee.Geometry.Point([117.39990234375,5.832293664675539])

var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(pt)
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
  .filter(ee.Filter.eq('instrumentMode', 'IW'))

// denoise images
var radius = 5 
var units = 'pixels'
var s1Denoised = multitemporalDespeckle(s1, radius, units, { before: -2, after: 2, units: 'month' }) 

// add a few layers to map
var count = 3
var list1 = s1.toList(count)
var list2 = s1Denoised.toList(count)

for (var i=0; i<count; i++) {
  Map.addLayer(ee.Image(list1.get(i)), {min:-20, max:0}, 'original ' + i.toString(), i === 0)
  Map.addLayer(ee.Image(list2.get(i)), {min:-20, max:0}, 'denoised ' + i.toString(), i === 0)
}


