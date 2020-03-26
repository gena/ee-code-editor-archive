/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Polygon(
        [[[91.01959161366995, 23.463236928384717],
          [90.44280938710745, 23.44307952652081],
          [90.05828790273245, 23.42795945663183],
          [89.98687676991995, 22.63935322017615],
          [90.80535821523245, 22.46686889181228]]]),
    geometry2 = /* color: #98ff00 */ee.Geometry.LineString(
        [[86.46026544179495, 21.97869806563807],
         [89.55840997304495, 23.261524750175614]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/***
 * A plot, consisting of a number of series, axes, frame, etc..
 */
function Plot(bounds) {
  this.bounds = bounds
  this.elements = [] // axis, grid, title, series, etc.

  this.mapLayer = ui.Map.Layer()
  
  this.origin = this.getOrigin()
  this.width = this.getWidth()
  this.height = this.getHeight()
  
  this.xmin = 0
  this.xmax = 1
  this.ymin = 0
  this.ymax = 1
  
  this.addDefaultElements()
}

Plot.prototype.setName = function(name) {
  this.mapLayer.setName(name)
}

Plot.prototype.getMapLayer = function() {
  return this.mapLayer  
}

Plot.prototype.setMinMax = function(xmin, xmax, ymin, ymax) {
  this.xmin = ee.Number(xmin)
  this.xmax = ee.Number(xmax)
  this.ymin = ee.Number(ymin)
  this.ymax = ee.Number(ymax)
}

Plot.prototype.getCorners = function() {
  return {
    ll: ee.List(ee.List(this.bounds.coordinates().get(0)).get(0)),
    ur: ee.List(ee.List(this.bounds.coordinates().get(0)).get(2))
  }
}

Plot.prototype.getOrigin = function() {
  var xy = this.getCorners().ll
  return {x: ee.Number(xy.get(0)), y: ee.Number(xy.get(1))}
}

Plot.prototype.getWidth = function() {
  var v = this.getCorners()
  return ee.Number(v.ur.get(0)).subtract(v.ll.get(0))
}

Plot.prototype.getHeight = function() {
  var v = this.getCorners()
  return ee.Number(v.ur.get(1)).subtract(v.ll.get(1))
}

Plot.prototype.refresh = function() {
  var image = ee.Image()
  
  for(var i in this.elements) {
    var element = this.elements[i]
    //image = image.blend(element.image)
    Map.addLayer(element.image, {}, element.name)
  }
  
  //image = image.clip(this.bounds.buffer(90))
  
  //this.mapLayer.setEeObject(image)
}

Plot.prototype.addFeature = function(name, feature, style) {
  var image = ee.FeatureCollection([feature]).style(style)
  this.elements.push({ name: name, item: feature, style: style, image: image })
}

Plot.prototype.addDefaultElements = function() {
  this.addFeature('frame', this.bounds, { width: 1, color: '000000AA', fillColor: '00000055' })
  
  // this.addFeature('origin', ee.Geometry.Point([this.origin.x, this.origin.y]), { width: 3, color: 'ff0000' })
  // this.addFeature('ur', ee.Geometry.Point([this.origin.x.add(this.width), this.origin.y.add(this.height)]), { width: 3, color: 'ff00ff' })
}

Plot.prototype.addRugSeries = function(name, values, style) {
  var range = this.xmax.subtract(this.xmin).abs()
  
  var plot = this

  var ticks = values.map(function(v) {
    var xOffset = ee.Number(v).subtract(plot.xmin).divide(range).multiply(plot.width)
    
    var x0 = plot.origin.x.add(xOffset)
    var y0 = plot.origin.y
    
    var x1 = plot.origin.x.add(xOffset)
    var y1 = plot.origin.y.subtract(plot.height.divide(20))
    
    var tick = ee.Feature(ee.Geometry.LineString([x0, y0, x1, y1]))
    
    return tick
  })
  
  ticks = ee.FeatureCollection(ticks)
  
  var image = ticks.style(style)

  this.elements.push({ name: name, item: values, style: style, image: image })
  
  //this.refresh()
}

/***
 * Colorbar per image
 */
Plot.prototype.addColorbarSeries = function(name, images, region, vis) {
  var plot = this

  var xrange = this.xmax.subtract(this.xmin).abs()
  var yrange = this.height

  var width = 1
  var N = 200

  var samples = images.map(function(image) {
    var imageRGB = image.visualize(vis)
    var imageHSV = imageRGB.unitScale(0, 255).rgbToHsv()

    var samples = image.addBands(imageHSV).select(vis.bands.concat(['hue']))
        .sample({ 
          region: region, 
          scale: 10,  
          numPixels: N 
        })
        
    return samples.set({ 
      count: samples.size(), 
      'system:time_start': image.get('system:time_start') 
    })
  })
  
  var colorbars = samples.filter(ee.Filter.gt('count', 0)).map(function(samples) {
    samples = ee.FeatureCollection(samples)
    
    var t = ee.Number(samples.get('system:time_start'))

    var xOffset = t.subtract(plot.xmin).divide(xrange).multiply(plot.width)
    
    var x0 = plot.origin.x.add(xOffset)
    var x1 = plot.origin.x.add(xOffset).add(plot.width.divide(300))

    samples = samples.sort('hue')
    //samples = samples.sort('value')
    //samples = samples.sort('NDVI')
    //samples = samples.sort('MNDWI')
    samples = samples.toList(N)
    samples = samples.zip(ee.List.sequence(0, 1, ee.Number(1).divide(samples.length())))
    
    samples = samples.map(function(o) {
      o = ee.List(o)
      var f = ee.Feature(o.get(0))
      var offset = ee.Number(o.get(1))
    
      var y0 = plot.origin.y.add(offset.multiply(yrange))
      var y1 = y0
      
      var geom = ee.Geometry.LineString([x0, y0, x1, y1])//.buffer(scale * 2, scale)
      
      return f.setGeometry(geom)
    })
    
    samples = ee.FeatureCollection(samples)
    
    //var samplesImage = samples.reduceToImage(vis.bands, ee.Reducer.percentile([25]).forEach(vis.bands))
    var samplesImage = samples.reduceToImage(vis.bands, ee.Reducer.first().forEach(vis.bands))
      .rename(vis.bands)
    
    return samplesImage./*focal_median(3).*/visualize(vis)
  })
  
  var image = colorbars.mosaic()

  // add to plot
  this.elements.push({ name: name, item: images, image: image })
  
  // this.refresh()
}

// ===========================================================================================================

Map.addLayer(ee.Image(1), { palette: ['black'] }, 'black', true, 0.6)

var assets = require('users/gena/packages:assets')

var start = "2015-01-01"
var stop = "2019-01-01"

var images = assets.getImages(geometry, {
  filter: ee.Filter.date(start, stop),
  resample: false,
  //filterMasked: true,
  missions: [
    'S2', 
    'L8', 
    //'L7', 
    //'L5',
    //'L4'
  ]
})

Map.addLayer(images.select(0).count(), { min: 150, max: 500 }, 'count', false)


// === Plot

var plot = new Plot(geometry2.bounds())
plot.setName('Plot 1')

var times = ee.List(images.aggregate_array('system:time_start'))
var minMax = ee.Dictionary(times.reduce(ee.Reducer.minMax()))
plot.setMinMax(ee.Date(start).millis(), ee.Date(stop).millis(), 0, 1)

// plot.addRugSeries('times', times, { width: 1.5, color: 'ffffff' })
// plot.addColorbarSeries('colorbar', images, geometry, { min: 0.05, max: 0.5, bands: ['swir', 'nir', 'red'] })

images = assets.getMostlyCleanImages(images, geometry)

var times = ee.List(images.aggregate_array('system:time_start'))
plot.addRugSeries('times (clean)', times, { width: 1.5, color: 'ffffff' })
plot.addColorbarSeries('colorbar (clean)', images, geometry, { min: 0.05, max: 0.5, bands: ['swir', 'nir', 'red'] })

plot.addColorbarSeries('colorbar (clean, RGB)', images, geometry, { min: 0.05, max: 0.5, bands: ['red', 'green', 'blue'] })

plot.refresh()


