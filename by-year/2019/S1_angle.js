/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var line = /* color: #d63000 */ee.Geometry.LineString(
        [[-51.372541728954445, 84.20584107355832],
         [-41.467724265073684, 84.16411323632448]]),
    s1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    dem = ee.Image("JAXA/ALOS/AW3D30_V1_1"),
    land = ee.Image("users/gena/land_polygons_image"),
    s2 = ee.ImageCollection("COPERNICUS/S2"),
    base = ee.Image("users/gena/NE1_HR_LC_SR_W");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// TODO:
//    * Angle correction
//    * Optical flow
//    * Color palette
//    * Nicer composite for land

// Notes:
//  very dark images in the summertime are due to melting water


var utils = require('users/gena/packages:utils')
var animation = require('users/gena/packages:animation')

function toGamma0(image) {
  return image.select(0).subtract(image.select('angle').updateMask(ee.Image(1)).multiply(Math.PI/180.0).cos().log10().multiply(10.0))
    .copyProperties(image, ['system:time_start'])
}

// Functions to convert from/to dB
function toNatural(image) {
  return ee.Image(10.0).pow(image.select(0).divide(10.0)).rename(image.bandNames())
    .copyProperties(image, ['system:time_start'])
}

function toDB(image) {
  return ee.Image(image).log10().multiply(10.0);
}

var start = ee.Date('2018-01-01')
var stop = ee.Date('2018-02-01')

var days = stop.difference(start, 'day')

s1 = s1
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'HH'))
  //.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
  .filter(ee.Filter.eq('instrumentMode', 'EW'))
  .filterDate(start, stop)
  .filterBounds(Map.getBounds(true))
  .map(toGamma0)
  .map(toNatural)

var step = 1

print(days)

var vis = { min: 0.03, max: 0.3, bands: ['HH'] }

var bg = s2
  .filterDate(start, stop.advance(6, 'month'))
  .filterBounds(Map.getBounds(true))
  .select(['B12', 'B8A', 'B3'])
  .reduce(ee.Reducer.percentile([20]))
  .visualize({ min: 200, max: 4000 })

var base = base.resample('bicubic').updateMask(land.mask().focal_mode(3))

var images = ee.List.sequence(0, days, step).map(function(day) {
  var t = start.advance(day, 'day')
  
  var images = s1.filterDate(t, t.advance(step, 'day'))
  
  var count = images.size()
  
  var image = images
    .sort('system:time_start')
    .mosaic()
    
  return image.visualize(vis)
    //.blend(bg.updateMask(land.mask()))
    //.blend(base)
    .set({count: count})
    .set({label: t.format('YYYY-MM-dd').cat(', ').cat(count.format('%d'))})
})

images = ee.ImageCollection(images)

print(images.aggregate_array('count'))

animation.animate(images, { label: 'label' })

throw(0)

// generate profile
var scale = 10
var profile = utils.reduceImageProfile(combined, line, ee.Reducer.max(), scale)

// show profile in two charts for two image bands, distance represents distance along the line
print(ui.Chart.feature.byFeature(profile, 'distance', ['elevation']))
print(ui.Chart.feature.byFeature(profile, 'distance', ['B8']))


