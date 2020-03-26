/***
 * A small utility to show current status (busy or done)
 */
var StateMonitor = function() {
  this.iconBusy = '⏳ checking ...'
  this.iconDone = '⌛ sleeping ...'
  this.label = ui.Label()
}

StateMonitor.prototype.show = function() {
  this.onDone()
  Map.add(this.label)
} 

StateMonitor.prototype.onBusy = function() {
  this.label.setValue(this.iconBusy)
} 

StateMonitor.prototype.onDone = function() {
  this.label.setValue(this.iconDone)
} 

var monitor = new StateMonitor()
monitor.show()

// filter S2 image collection to include only recent images 
var now = ee.Date(Date.now())
var t0 = now.advance(-1, 'day')
var t1 = t0.advance(1, 'year')

var imagesS2 = ee.ImageCollection('COPERNICUS/S2')
  .filterDate(t0, t1)
  .map(function(i) { 
    return i.divide(10000).select(['B12', 'B8', 'B3'], ['swir1', 'nir', 'green'])
      .copyProperties(i)
      .copyProperties(i, ['system:time_start'])
      .set({ envelope: i.geometry() })
  })
  
var imagesL8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_RT_TOA')
  .filterDate(t0, t1)
  .map(function(i) { 
    return i.select(['B6', 'B5', 'B3'], ['swir1', 'nir', 'green'])
      .copyProperties(i)
      .copyProperties(i, ['system:time_start']) 
      .set({ envelope: i.geometry() })
  })
  
var imagesL7 = ee.ImageCollection('LANDSAT/LE07/C01/T1_RT_TOA')
  .filterDate(t0, t1)
  .map(function(i) { 
    return i.select(['B5', 'B4', 'B2'], ['swir1', 'nir', 'green'])
      .copyProperties(i)
      .copyProperties(i, ['system:time_start']) 
      .set({ envelope: i.geometry() })
  })

var images = imagesS2.merge(imagesL8).merge(imagesL7)
  
print('image count', images.size())
  
// global variables to keep latest image info
var recentImage = null
var recentImageTime = null
var recentImageGeometryLayer = ui.Map.Layer(ee.Image(), {}, 'recent image geometry')
Map.layers().add(recentImageGeometryLayer)
Map.setOptions('HYBRID')

/*** 
 * Updates image info and shows envelope
 */
function onNewImage(image) {
  recentImage = image
  
  recentImageGeometryLayer.setEeObject(
    image.visualize({ bands: ['swir1', 'nir', 'green'], min: 0.05, max: 0.5 })
    //ee.FeatureCollection([recentImage]).style({ color: 'ffff00', fillColor: 'ffff0055'})
  )
  
  Map.centerObject(ee.Geometry(image.get('envelope')))
}


function checkForNewImage() {
  monitor.onBusy()
  
  var image = images.sort('system:time_start', false).first()

  image.date().millis().evaluate(function(t) {
    if(t > recentImageTime) {
      recentImageTime = t
      print('New image ingested for time: ', ee.Date(t), image)
      onNewImage(image)
    }
    
    monitor.onDone()
  })
}

checkForNewImage()
ui.util.setInterval(checkForNewImage, 60000)
