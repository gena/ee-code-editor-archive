var utils = require('users/gena/packages:utils')
var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')

//var bounds = Map.getBounds(true)
var bounds = Map.getCenter()

var boundsNoClouds = Map.getBounds(true)

// get all images for the given area
var images = assets.getImages(bounds, { 
  resample: true,
  missions: [/*'S2', 'L8', 'L7',*/ 'L5', 'L4'],
  filterMasked: true
})
.filterDate('1985-01-01', '1990-01-01')
//.filterDate('2017-01-01', '2019-01-01')
//.filterDate('2017-06-01', '2017-10-01')
//.filter(ee.Filter.dayOfYear(0, 30))
//.filter(ee.Filter.or(ee.Filter.dayOfYear(1, 100), ee.Filter.dayOfYear(200, 210)))
  
print('Image count: ', images.size())  
  
  
// filter images which are cloudy  
images = assets.getMostlyCleanImages(images, boundsNoClouds, {
   cloudFrequencyThresholdDelta: 0.15// decrease or increase to get more or less images (see: http://earthenv.org/cloud)
 })  

print('Image count (clean): ', images.size())  
  
images = images  
  .sort('system:time_start')
  
images = images.map(function(i) {
  return i.visualize({min:0, max: 0.3, bands:['swir', 'nir', 'green']})
  //return i.visualize({min:0, max: 0.2, bands:['nir', 'green', 'blue']})
  //return i.visualize({min:0.07, max: 0.3, bands:['red', 'green', 'blue']})
    .set({label: i.date().format()})
})  
  

animation.animate(images, {maxFrames: 100, label: 'label'})

utils.exportVideo(images, { label: 'label', maxFrames: 100})