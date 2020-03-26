/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.LineString(
        [[-2.624723646264556, 16.362577039640282],
         [-1.7950721331809518, 16.78112168250991]]),
    geometry2 = /* color: #d63000 */ee.Geometry.LineString(
        [[-4.640790933027688, 15.002865966792559],
         [-4.5920738140305275, 15.32708404723151]]),
    geometry3 = /* color: #d63000 */ee.Geometry.Polygon(
        [[[-3.309975577792102, 16.492936709491218],
          [-3.138314200838977, 16.361213354463125],
          [-2.937813712557727, 16.39942231463911],
          [-2.767525626620227, 16.56403010532564],
          [-2.895241691073352, 16.79555934696001],
          [-3.058663321932727, 16.807391359330147],
          [-3.344307853182727, 16.710084053826275]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var animation = require('users/gena/packages:animation')
var assets = require('users/gena/packages:assets')

//var region = Map.getBounds(true)
var region = geometry3

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
  
  this.addFeature('origin', ee.Geometry.Point([this.origin.x, this.origin.y]), { width: 3, color: 'ff0000' })
  this.addFeature('ur', ee.Geometry.Point([this.origin.x.add(this.width), this.origin.y.add(this.height)]), { width: 3, color: 'ff00ff' })
}

Plot.prototype.addRugSeries = function(name, values, style) {
  var range = this.xmax.subtract(this.xmin).abs()
  
  var plot = this

  var ticks = values.map(function(v) {
    var xOffset = ee.Number(v).subtract(plot.xmin).divide(range).multiply(plot.width)
    
    var x0 = plot.origin.x.add(xOffset)
    var y0 = plot.origin.y
    
    var x1 = plot.origin.x.add(xOffset)
    var y1 = plot.origin.y.add(plot.height.divide(10))
    
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

  var colorbars = images.map(function(image) {
    var t = ee.Number(image.get('system:time_start'))

    var xOffset = t.subtract(plot.xmin).divide(xrange).multiply(plot.width)
    
    var x0 = plot.origin.x.add(xOffset)
    var x1 = plot.origin.x.add(xOffset).add(plot.width.divide(300))

    var imageRGB = image.visualize(vis)
    var imageHSV = imageRGB.unitScale(0, 255).rgbToHsv()
    
    var width = 1

    var N = 3000
    
    var samples = image.addBands(imageHSV).select(vis.bands.concat(['hue']))
        .sample({ 
          region: region, 
          scale: 10,  
          numPixels: N 
        })
    
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
    
    var samplesImage = samples.reduceToImage(vis.bands, ee.Reducer.percentile([25]).forEach(vis.bands))
      .rename(vis.bands)
    
    return samplesImage./*focal_median(3).*/visualize(vis)
  })
  
  var image = colorbars.mosaic()

  // add to plot
  this.elements.push({ name: name, item: images, image: image })
  
  // this.refresh()
}

var start = '2015-01-01'
var stop = '2018-01-01'

var imagesS2 = ee.ImageCollection('COPERNICUS/S2')
  .filterBounds(geometry3)
  .filter(ee.Filter.lte('CLOUDY_PIXEL_PERCENTAGE', 20))
  .filterDate(start, stop)
  //.filter(ee.Filter.gt('CLOUDY_PIXEL_PERCENTAGE', 50))
  
// imagesS2 = ee.ImageCollection([ee.Image(imagesS2.toList(1, 10).get(0)).resample('bicubic')])

print('Image count: ', imagesS2.size())
  
var visS2 = {min: 500, max: 5500, bands: ['B12', 'B8', 'B4'], gamma: 1.4}
//var vis = {min: 1000, max: 3500, bands: ['B4', 'B3', 'B2'], gamma: 1.4}

var imagesL8 = ee.ImageCollection("LANDSAT/LC08/C01/T1_RT_TOA")
  .filterBounds(geometry3)
  .filter(ee.Filter.lte('CLOUD_COVER', 20))
  .filterDate(start, stop)
  
  print(imagesL8.first())

print('Image count: ', imagesL8.size())


// var image = ee.Image(imagesL8.first())
var visL8 = {min: 0.05, max: 0.55, bands: ['B6', 'B5', 'B4'], gamma: 1.4}
// var vis = {min: 0.05, max: 0.55, bands: ['B4', 'B3', 'B2'], gamma: 1.4}


var bands = ['SWIR', 'NIR', 'RED']
var visPROBA = { bands: bands, min: 500, max: 5500, gamma: 1.4 }

var proba100 = ee.ImageCollection('VITO/PROBAV/C1/S1_TOC_100M').select(bands)
var start = '2015-01-01'
var stop = '2018-01-01'

proba100 = proba100.filterDate(start, stop)
var proba = proba100

proba = proba.map(function(i) {
  return i
    .resample('bicubic')
    .multiply(5)
    .copyProperties(i, ['system:time_start'])
})

/***
 * Filters all images where percentage of pixels covering region is less than coverage (0-1, default: 0.99).
 */
function filterImagesByRegion(images, region, scale, opt_coverage) {
  var coverage = typeof(opt_coverage) === undefined || 0.99
  var area = region.area(scale)

  images = images.map(function(i) {
    var areaMask = ee.Image.pixelArea().mask(i.select(0).mask())
      .reduceRegion(ee.Reducer.sum(), region, scale).values().get(0)
      
    return i.set({ areaMask: areaMask })
  })
  
  images = images.filter(ee.Filter.gt('areaMask', area.multiply(coverage)))
  
  return images
}

var scale = Math.max(Map.getScale(), 100)

proba = filterImagesByRegion(proba, region, scale * 50, 0.01)

proba = assets.addQualityScore(proba, region, {
  scale: scale * 10,
  qualityBand: 'RED',
  scorePercentile: 99
})

// print(ui.Chart.feature.histogram(images, 'quality_score'))

// limit to 90% or the darkest images
var count = proba.size().multiply(0.85).int()
proba = proba.sort('quality_score').limit(count)



// var animation = require('users/gena/packages:animation')
// animation.animate(imagesL8, { vis: visL8 })
// animation.animate(imagesS2, { vis: visS2, position: 'bottom-center', preload: false })

//var region = Map.getBounds(true)
var scale = Map.getScale()/2

Map.addLayer(ee.Image(1), { palette: ['white'] }, 'white', false, 0.8)
Map.addLayer(ee.Image(1), { palette: ['black'] }, 'black', true, 0.8)

// === Plot

var plot = new Plot(geometry.bounds())
plot.setName('Plot 1')

var timesS2 = ee.List(imagesS2.aggregate_array('system:time_start'))
var timesL8 = ee.List(imagesL8.aggregate_array('system:time_start'))
var timesPROBA = ee.List(proba.aggregate_array('system:time_start'))

var minMaxS2 = ee.Dictionary(timesS2.reduce(ee.Reducer.minMax()))
//plot.setMinMax(minMaxS2.get('min'), minMaxS2.get('max'), 0, 1)
plot.setMinMax(ee.Date(start).millis(), ee.Date(stop).millis(), 0, 1)

plot.addRugSeries('rug S2', timesS2, { width: 1.5, color: 'ffffff' })
plot.addRugSeries('rug L8', timesL8, { width: 1.5, color: 'ff0000' })
plot.addRugSeries('rug PROBA', timesPROBA, { width: 1.5, color: 'ffff00' })

plot.addColorbarSeries('colorbar S2', imagesS2, reigon, visS2)
plot.addColorbarSeries('colorbar L8', imagesL8, reigon, visL8)
plot.addColorbarSeries('colorbar PROBA', proba, reigon, visPROBA)

plot.refresh()
//Map.layers().add(plot.getMapLayer())


Map.addLayer(imagesS2.count(), {}, 'count (S2)', false)
Map.addLayer(imagesL8.count(), {}, 'count (L8)', false)

var images = imagesS2.map(function(i) {
  return i.divide(10000).select(['B12', 'B8', 'B3'], ['swir', 'nir', 'green'])
    .copyProperties(i, ['system:time_start'])
}).merge(imagesL8.map(function(i) {
  return i.select(['B6', 'B5', 'B3'], ['swir', 'nir', 'green'])
}))
.sort('system:time_start')
print(images.first())

// animation.animate(images.filterDate('2017-01-01', '2018-01-01'), { vis: { min: 0.05, max: 0.55, gamma: 1.4 } })



/*


throw(0)











// ==== a single image

//var image = ee.Image(imagesS2.toList(1, 10).get(0)).resample('bicubic')
var image = ee.Image(imagesS2.first()).resample('bicubic')

// Single image

var imageRGB = image.visualize(vis)
// print(ui.Chart.image.histogram(imageRGB, bounds, scale, 150))

var imageHSV = imageRGB.unitScale(0, 255).rgbToHsv()
// print(ui.Chart.image.histogram(imageHSV.select('hue'), bounds, scale, 150).setOptions({ title: 'HUE' }))
// print(ui.Chart.image.histogram(imageHSV.select('saturation'), bounds, scale, 150).setOptions({ title: 'SATURATION' }))
// print(ui.Chart.image.histogram(imageHSV.select('value'), bounds, scale, 150).setOptions({ title: 'VALUE' }))

// var huePDF = imageHSV.select('hue').reduceRegion(ee.Reducer.histogram(150), bounds, scale)
//print(ui.Chart.array.values(hueCDF.values().sort(), 0))

// Map.addLayer(imageHSV.select('hue').eq(0))

var N = 1000

var samples = image
  .addBands(imageHSV)
//  .addBands(image.normalizedDifference(['B3', 'B12']).rename('MNDWI'))
//  .select(vis.bands.concat(['hue','saturation','value','MNDWI'])).sample({
  .select(vis.bands.concat(['hue'])).sample({
    region: region, 
    scale: 10, 
    numPixels: N,
    //dropNulls: false,
    //geometries: true
  })

//Map.addLayer(samples)

// update geometries
var coords = geometry2.coordinates().getInfo()
var xmin = ee.Number(coords[0][0])
var xmax = ee.Number(coords[1][0])
var ymin = ee.Number(coords[0][1])
var ymax = ee.Number(coords[1][1])
var xrange = xmax.subtract(xmin)
var yrange = ymax.subtract(ymin)

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

  var x0 = xmin
  var y0 = ymin.add(offset.multiply(yrange))
  
  var x1 = xmax
  var y1 = y0
  
  var geom = ee.Geometry.LineString([x0, y0, x1, y1])//.buffer(scale * 2, scale)
  
  return f.setGeometry(geom)
})

// samples = samples.map(function(f) {
//   var offset = ee.Number(f.get('hue'))

//   var x0 = xmin
//   var y0 = ymin.add(offset.multiply(yrange))
  
//   var x1 = xmax
//   var y1 = y0
  
//   var geom = ee.Geometry.LineString([x0, y0, x1, y1])//.buffer(scale * 2, scale)
  
//   return f.setGeometry(geom)
// })

samples = ee.FeatureCollection(samples)

var sampleValues = samples.reduceToImage(vis.bands, ee.Reducer.median().forEach(vis.bands))
var sampleCount = samples.reduceToImage([vis.bands[0]], ee.Reducer.count())

Map.addLayer(image, vis, 'image')
Map.addLayer(sampleValues, vis, 'sampled')
Map.addLayer(sampleValues.focal_median(3).clip(geometry2.bounds()), vis, 'sampled (smoothed)', false)

// Map.addLayer(sampleValues.updateMask(sampleCount.divide(10)), vis, 'sampled (masked 1/10)', false)
// Map.addLayer(sampleValues.updateMask(sampleCount.divide(5)), vis, 'sampled (masked 1/5)', false)

Map.addLayer(ee.FeatureCollection(geometry2.bounds()).style({color: '000000', fillColor: '00000000'}), {}, 'rug plot bounds', true, 0.5)

//throw(0)

function animateByBandValues(image, imageMask, band, min, max, step) {
  step = ee.Number(step)

  var frames = ee.List.sequence(min, max, step).map(function(v) {
    v = ee.Number(v)
    var i = imageMask.select(band)
    var mask = i.gte(v.subtract(step)).and(i.lte(v.add(step.multiply(2)))) //i.unitScale(v, v.add(step))
  
    return image.updateMask(mask)
      .set({ label: v.format('%.2f') })
  })
  
  animation.animate(frames, { 
    maxFrames: (max-min)/step, 
    label: 'label' 
  })
}

//animateByBandValues(imageRGB, imageHSV, 'hue', 0, 1, 0.02)
//animateByBandValues(imageRGB, imageHSV, 'saturation', 0, 1, 0.05)
//animateByBandValues(imageRGB, imageHSV, 'value', 0, 1, 0.05)
//animateByBandValues(imageRGB, image, 'MNDWI', -1, 1, 0.05)

// throw(0)





// ====================================================

// animation.animate(imagesS2, { vis: vis })

print('Count: ', imagesS2.size())

var chart = ui.Chart.feature.byFeature(imagesS2.sort('system:time_start'), 'system:time_start', ['CLOUDY_PIXEL_PERCENTAGE'])
chart.setOptions({ lineWidth: 0, pointSize: 2 })

print(chart)*/