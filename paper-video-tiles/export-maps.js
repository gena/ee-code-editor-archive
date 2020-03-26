/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = 
    /* color: #0b4a8b */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-88.05739154347219, 34.84582113176309],
          [-88.05739154347219, 34.64496198359916],
          [-87.68316974171438, 34.64496198359916],
          [-87.68316974171438, 34.84582113176309]]], null, false);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var animation = require('users/gena/packages:animation')

var region = geometry.bounds()

Map.centerObject(region)

var images = ee.ImageCollection('COPERNICUS/S2')
  .filterBounds(Map.getCenter())
  .filterDate('2018-01-01', '2019-01-01')
  .map(function(i) {
    var label = i.date().format('YYYY-MM-dd')
    
    return i.resample('bicubic').visualize({ min: 0, max: 5000, bands: ['B12', 'B8', 'B3'] })
      .set({ label: label })
      .set({ 'system:time_start': i.get('system:time_start') })
      .clip(region)
  })
  
  
// animation.animate(images, { label: 'label' })  

var labels = ee.List(images.aggregate_array('label'))
  .slice(10)

var BUCKET = 'deltares-video-tiles'
var PREFIX = 'test-S2-timelapse'

function exportFrame(label) {
  var image = images.filter(ee.Filter.eq('label', label)).first()
  
  var name = PREFIX + '/' + label

  Export.map.toCloudStorage({
    image: image, 
    description: name, 
    bucket: BUCKET, 
    fileFormat: 'png', 
    path: name,
    minZoom: 5, 
    maxZoom: 14,
    region: region,
    skipEmptyTiles: true
  })
}

labels.evaluate(function(labels) {
  labels.map(exportFrame)
})