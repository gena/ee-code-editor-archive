/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var point = /* color: #d63000 */ee.Geometry.Point([-120.14618396759033, 39.38234486633152]),
    box = /* color: #98ff00 */ee.Geometry.LineString(
        [[-120.12531653117071, 39.360917651511265],
         [-120.06206799560834, 39.40429581166964]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// ================================================================================
// DECLARATIONS
// ================================================================================

/***
 * Charting
 */
var community = { Charts: {} }

/***
 * Constructor.
 */
community.Charts.Scatter = function(map, bounds) {
  this.bounds = bounds 
  this.map = map       
  this.vranges = {xmin: 0, xmax: 1, ymin: 0, ymax: 1}   
  this.pointSize = 30 // meters
  this.targetScale = 30
  this.samplingScale = 30
}

community.Charts.Scatter.prototype.getCorners = function() {
  return {
    ll: ee.List(ee.List(this.bounds.coordinates().get(0)).get(0)),
    ur: ee.List(ee.List(this.bounds.coordinates().get(0)).get(2))
  }
}

community.Charts.Scatter.prototype.getOrigin = function() {
  var xy = this.getCorners().ll
  return {x: ee.Number(xy.get(0)), y: ee.Number(xy.get(1))}
}

community.Charts.Scatter.prototype.getWidth = function() {
  var v = this.getCorners()
  return ee.Number(v.ur.get(0)).subtract(v.ll.get(0))
}

community.Charts.Scatter.prototype.getHeight = function() {
  var v = this.getCorners()
  return ee.Number(v.ur.get(1)).subtract(v.ll.get(1))
}

/***
 * plot area + grid
 */
community.Charts.Scatter.prototype.plotArea = function() {
  // grid
  this.renderGrid()
  
  // area
  var bg = ee.Image().int().paint(this.bounds, 1)
  this.map.addLayer(bg.focal_max(1, 'square'), {palette:['000000']}, ' area', true, 0.85)
} 

/***
 * plot values
 */
community.Charts.Scatter.prototype.plotValues = function(collection, region, axesBands, renderBands, name, opt_visible) {
  var visible = (typeof opt_visible === 'undefined');
  
  var wgs84 = ee.Projection('EPSG:4326');
  
  var w = this.getWidth()
  var h = this.getHeight()

  var origin = this.getOrigin()
  
  var vr = this.vranges
  var xr = vr.xmax - vr.xmin
  var yr = vr.ymax - vr.ymin
  
  var pointSize = this.pointSize
  
  var values = collection.getRegion(region, this.samplingScale).slice(1)

  var bandNames = ee.Image(collection.first()).bandNames()
  var bandX = axesBands[0]
  var bandY = axesBands[1]
  var indexX = bandNames.indexOf(bandX)
  var indexY = bandNames.indexOf(bandY)

  var features = values.map(function(o) {
    o = ee.List(o).slice(4)
    var vx = o.get(indexX)
    var vy = o.get(indexY)
      
    // fix empty :(
    vx = ee.Algorithms.If(ee.Algorithms.IsEqual(vx, null), 0, vx)
    vy = ee.Algorithms.If(ee.Algorithms.IsEqual(vy, null), 0, vy)
  
    var x = ee.Number(vx).multiply(w).divide(xr).add(origin.x)
    var y = ee.Number(vy).multiply(h).divide(yr).add(origin.y)
    
    var g = ee.Algorithms.GeometryConstructors.Point([x, y])

    return ee.Feature(g, ee.Dictionary.fromLists(bandNames, o))
  })
  
  features = ee.FeatureCollection(features)
  
  var image = features
    .reduceToImage(renderBands, ee.Reducer.max(3))
    .reproject('EPSG:3857', null, this.targetScale)
    
  this.map.addLayer(image, {min:0, max:0.6}, name + ' values', visible)
}

/***
 * render grid
 */
community.Charts.Scatter.prototype.renderGrid = function(ic, points, bandX, bandY) {
  var ll = this.getCorners().ll
  var origin = ee.Image.constant(ll.get(0)).addBands(ee.Image.constant(ll.get(1)))

  var grid = ee.Image.pixelLonLat()
    .subtract(origin)
    .divide([this.getWidth(), this.getHeight()]).multiply([10, 10])
    .toInt().reduce(ee.Reducer.sum()).bitwiseAnd(1)
    .clip(box.bounds())
  
  this.map.addLayer(grid, {min:0, max:1}, 'grid')
}

// ================================================================================
// MAIN
// ================================================================================

var bands = ['red', 'green', 'blue', 'nir', 'swir1']
  
// define info for image collection groupped by type
var info = [
  {
    name: 'TOA',
    assets: [
      { id: 'LANDSAT/LC8_L1T_TOA', bands: ['B2', 'B3', 'B4', 'B5', 'B6'] },
      { id: 'LANDSAT/LE7_L1T_TOA', bands: ['B1', 'B2', 'B3', 'B4', 'B5']  },
      { id: 'LANDSAT/LT5_L1T_TOA', bands: ['B1', 'B2', 'B3', 'B4', 'B5']  },
      { id: 'LANDSAT/LT4_L1T_TOA', bands: ['B1', 'B2', 'B3', 'B4', 'B5']  }
    ]
  },
  {
    name: 'SR',
    assets: [
      { id: 'LANDSAT/LC8_SR', bands: ['B2', 'B3', 'B4', 'B5', 'B6'], multiplier: 0.0001 },
      { id: 'LANDSAT/LE7_SR', bands: ['B1', 'B2', 'B3', 'B4', 'B5'], multiplier: 0.0001  },
      { id: 'LANDSAT/LT5_SR', bands: ['B1', 'B2', 'B3', 'B4', 'B5'], multiplier: 0.0001  },
      { id: 'LANDSAT/LT4_SR', bands: ['B1', 'B2', 'B3', 'B4', 'B5'], multiplier: 0.0001  }
    ]
  },
  {
    name: 'DN',
    assets: [
      { id: 'LANDSAT/LC8_L1T', bands: ['B2', 'B3', 'B4', 'B5', 'B6'], multiplier: 1/65535 },
      { id: 'LANDSAT/LE7_L1T', bands: ['B1', 'B2', 'B3', 'B4', 'B5'], multiplier: 1/255  },
      { id: 'LANDSAT/LT5_L1T', bands: ['B1', 'B2', 'B3', 'B4', 'B5'], multiplier: 1/255  },
      { id: 'LANDSAT/LT4_L1T', bands: ['B1', 'B2', 'B3', 'B4', 'B5'], multiplier: 1/255  }
    ]
  }
]

function createImageCollection(assets) {
  // initialize collections
  var collections = assets.map(function(asset, ic) {
    var images = ee.ImageCollection.load(asset.id).select(asset.bands, bands)

    // TODO: fix spikes    
    if(asset.name === 'LANDSAT/LE7_L1T_TOA') {
      images = images.map(function(i) {
        //return i.updateMask(i.mask().product())
      })
    }
    
    if(asset.multiplier) {
      images = images.map(function(i) { 
        return i.multiply(asset.multiplier)
          .copyProperties(i)
          .copyProperties(i, ['system:time_start'])
          .copyProperties(i, ['system:id'])
      })
    }

    return images
  })
  
  // merge collections
  var collection = ee.List(collections).iterate(function(c, p) {
    return ee.ImageCollection(p).merge(c)
  }, ee.ImageCollection([]))
  collection = ee.ImageCollection(collection)
  
  // get images
  collection = collection
    .filterBounds(point)
    //.filterDate('2000-01-01', '2018-01-01')

  return collection
}

// initialize image collections
info = info.map(function(i) {
  i.collection = createImageCollection(i.assets)
  return i
})

// preview a single image
info.map(function(i) {
  //var image = ee.Image(i.collection.toList(1,2).get(0))
  var image = ee.Image(i.collection.filterDate('2010-06-01', '2010-07-01').first())
  print(i.name, image)
  Map.addLayer(image, {bands: ['swir1', 'nir', 'green'], min:0, max:0.5}, i.name + ' first image')
})

// sample locations around given point
var radius = 120
var samplingArea = point.buffer(radius)
Map.addLayer(samplingArea, {color:'grey'}, 'sampling area')

// create plot
var plot = new community.Charts.Scatter(Map, box.bounds());
plot.plotArea() // area + grid
plot.targetScale = 30

// add scatter plots
/*
info.map(function(i) {
  var axesBands = ['green', 'nir']
  var renderBands = ['red', 'green', 'nir']
  plot.plotValues(i.collection, samplingArea, axesBands, renderBands, i.name + ' green vs nir')
})

info.map(function(i) {
  var axesBands = ['green', 'swir1']
  var renderBands = ['swir1', 'nir', 'green']
  plot.plotValues(i.collection, samplingArea, axesBands, renderBands, i.name + ' green vs swir1', false)
})
*/

var radius = 300
var samplingArea = point.buffer(radius)
Map.addLayer(samplingArea, {color:'grey'}, 'sampling area')

var step = 5

var years = ee.List.sequence(1984, 2017, step).getInfo(function(years) {
  years.map(function(y) {
    info.map(function(i) {
      var axesBands = ['green', 'swir1']
      var renderBands = ['swir1', 'nir', 'green']
      plot.plotValues(i.collection.filterDate(y+'01-01', y+step+'01-01'), samplingArea, axesBands, renderBands, y + ' ' + i.name + ' green vs swir1', false)
  })
})})

