/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #98ff00 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/***
 * Multiteporal speckle filter: image is the original image, images is the temporal collection of images
 * 
 * Version: 1.0
 * 
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
      .filter(ee.Filter.eq('relativeOrbitNumber_start', image.get('relativeOrbitNumber_start'))) // use only images from the same cycle
    
    var b = image.select(bandNamesMean)

    return b.multiply(meanSpace2.sum()).divide(meanSpace2.count()).rename(bandNames)
  }
  
  return meanSpace.map(multitemporalDespeckleSingle).select(bandNames)
}


/***
 * Removes low-entropy edges
 */
function maskLowEntropy(image) { 
  var bad = image.select(0).multiply(10000).toInt().entropy(ee.Kernel.circle(5)).lt(3.2)
  
  return image.updateMask(image.mask().multiply(bad.focal_max(5).not()))
} 


/////////////////////////////////////////
// testing
/////////////////////////////////////////

//var pt = ee.Geometry.Point([117.39990234375,5.832293664675539]);
//Map.centerObject(geometry,8);

var region = ee.Geometry(Map.getBounds(true)).centroid(1).buffer(Map.getScale()*100)
Map.addLayer(region)

var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(region)
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'))
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .select('VV')
  //.map(maskLowEntropy)


// denoise images
var radius = 5 
var units = 'pixels'
var s1Denoised = multitemporalDespeckle(s1, radius, units, { before: -2, after: 2, units: 'month' }) 

// add a few layers to map
var count = 5
var list1 = s1.toList(count)
var list2 = s1Denoised.toList(count)

for (var i=0; i<count; i++) {
  Map.addLayer(ee.Image(list1.get(i)), {min:-20, max:0}, 'original ' + i.toString())
  Map.addLayer(ee.Image(list2.get(i)), {min:-20, max:0}, 'denoised ' + i.toString())
}


