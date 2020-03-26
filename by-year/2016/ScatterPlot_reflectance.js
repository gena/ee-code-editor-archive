/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var point = /* color: #d63000 */ee.Geometry.Point([-120.03838062286377, 39.14683645090244]),
    box = /* color: #98ff00 */ee.Geometry.LineString(
        [[-119.97760050767818, 39.12139474068704],
         [-119.79918623304593, 39.22864657120311]]);
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
 * sample and render values, returns image
 */
community.Charts.Scatter.prototype.renderValues = function(collection, region, axesBands, renderBands, name, opt_visible) {
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
    vx = ee.Algorithms.If(ee.Algorithms.IsEqual(vx, null), 0.0, vx)
    vy = ee.Algorithms.If(ee.Algorithms.IsEqual(vy, null), 0.0, vy)
  
    var x = ee.Number(vx).multiply(w).divide(xr).add(origin.x)
    var y = ee.Number(vy).multiply(h).divide(yr).add(origin.y)
    
    var g = ee.Algorithms.GeometryConstructors.Point([x, y])

    return ee.Feature(g, ee.Dictionary.fromLists(bandNames, o))
  })
  
  features = ee.FeatureCollection(features)
  
  var image = features
    .reduceToImage(renderBands, ee.Reducer.max(3))
    .reproject('EPSG:3857', null, this.targetScale)

  return image    
} 

/***
 * plot values, adds map layer
 */
community.Charts.Scatter.prototype.plotValues = function(collection, region, axesBands, renderBands, name, opt_visible) {
  var visible = (typeof opt_visible === 'undefined');

  var image = this.renderValues(collection, region, axesBands, renderBands)  

  this.map.addLayer(image, {min:0, max:0.3}, name + ' values', visible)
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

community.Algorithms = { Landsat: {} }

/***
 * Approximate: http://www.asprs.org/a/publications/proceedings/tampa2007/0079.pdf
 */
var dsun = function(doy) {
  return ee.Number(1).subtract(
    ee.Number(0.01672).multiply(
      //ee.Number(2).multiply(Math.PI).multiply(ee.Number(doy).subtract(93.5)).divide(365).sin()
      ee.Number(0.9856).multiply(doy).subtract(4).multiply(Math.PI).divide(180).cos()
    )
  )
}

/***
 * DN -> reflectance for L7, L8, follow: http://dx.doi.org.sci-hub.cc/10.1016/j.rse.2009.01.007
 */
community.Algorithms.Landsat.TOA = function(i, sirradiances, max) {
  // get linear transform coefficients
  var bandNames = i.bandNames()
  var add = bandNames.map(function(b) { 
    return ee.Number(i.get(ee.String('RADIANCE_ADD_BAND_').cat(ee.String(b).slice(1))))
  })
  var mult = bandNames.map(function(b) { 
    return ee.Number(i.get(ee.String('RADIANCE_MULT_BAND_').cat(ee.String(b).slice(1))))
  })

  // convert to images  
  sirradiances = ee.Image.constant(sirradiances).rename(i.bandNames()).float()
  mult = ee.Image.constant(mult).rename(i.bandNames()).float()
  add = ee.Image.constant(add).rename(i.bandNames()).float()

  // remove noise
  if(max) {
    i = i.updateMask(i.lt(max))
  }

  // compute radiance
  var radiance = i.multiply(mult).add(add)

  // compute dsun
  var doy = i.date().getRelative('day', 'day')
  var d = dsun(doy)

  // sun elevation correction  
  var szenith = ee.Number(i.get('SUN_ELEVATION')).multiply(Math.PI).divide(180).sin()

  // compute reflectance
  var reflectance = radiance.multiply(Math.PI).multiply(d.pow(2)).divide(sirradiances).divide(szenith)

  return reflectance
}

// ================================================================================
// MAIN
// ================================================================================

var bands = ['red', 'green', 'blue', 'nir', 'swir1', 'swir2']


// define info for image collection groupped by type
var info = [
  {
    name: 'TOA',
    assets: [
      { id: 'LANDSAT/LC8_L1T_TOA', bands: ['B2', 'B3', 'B4', 'B5', 'B6', 'B7'] },
      { id: 'LANDSAT/LE7_L1T_TOA', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7']  },
      { id: 'LANDSAT/LT5_L1T_TOA', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7']  },
      { id: 'LANDSAT/LT4_L1T_TOA', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7']  }
    ]
  },
  {
    name: 'SR',
    assets: [
      { id: 'LANDSAT/LC8_SR', bands: ['B2', 'B3', 'B4', 'B5', 'B6', 'B7'], multiplier: 0.0001 },
      { id: 'LANDSAT/LE7_SR', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], multiplier: 0.0001  },
      { id: 'LANDSAT/LT5_SR', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], multiplier: 0.0001  },
      { id: 'LANDSAT/LT4_SR', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], multiplier: 0.0001  }
    ]
  },
  {
    name: 'DN',
    assets: [
      { id: 'LANDSAT/LC8_L1T', bands: ['B2', 'B3', 'B4', 'B5', 'B6', 'B7'], multiplier: 1/65535 },
      { id: 'LANDSAT/LE7_L1T', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], multiplier: 1/255  },
      { id: 'LANDSAT/LT5_L1T', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], multiplier: 1/255  },
      { id: 'LANDSAT/LT4_L1T', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], multiplier: 1/255  }
    ]
  },
  {
    name: 'DN -> TOA',
    assets: [
      { id: 'LANDSAT/LC8_L1T', bands: ['B2', 'B3', 'B4', 'B5', 'B6', 'B7'], irradiances: [1996, 1807, 1536, 955.8, 235.1, 83.38] },
      { id: 'LANDSAT/LE7_L1T', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], irradiances: [1997, 1812, 1533, 1039, 230.8, 84.9], max: 254}, 
      { id: 'LANDSAT/LT5_L1T', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], irradiances: [1983, 1796, 1536, 1031, 220, 83.44]},
      { id: 'LANDSAT/LT4_L1T', bands: ['B1', 'B2', 'B3', 'B4', 'B5', 'B7'], irradiances: [1983, 1759, 1539, 1028, 219.8, 83.49]},
    ],
    algorithm: community.Algorithms.Landsat.TOA
  }
]

var only = [
  //'DN -> TOA',
  //'DN',
  //'TOA',
  'SR'
]

if(only.length) {
  info = info.filter(function(i) {
    return only.indexOf(i.name) != -1
  })
}

function createImageCollection(info) {
  var assets = info.assets
  
  // initialize collections
  var collections = assets.map(function(asset) {
    var images = ee.ImageCollection.load(asset.id)
      .filterBounds(point)
      .select(asset.bands)
    
    if(asset.multiplier) {
      images = images.map(function(i) { 
        return i.multiply(asset.multiplier)
          .copyProperties(i)
          .copyProperties(i, ['system:time_start'])
          .copyProperties(i, ['system:id'])
      })
    }

    if(info.algorithm) {
      images = images.map(function(i) { 
        return info.algorithm(i, asset.irradiances, asset.max)
          .copyProperties(i)
          .copyProperties(i, ['system:time_start'])
          .copyProperties(i, ['system:id'])
      })
    }

    return images.select(asset.bands, bands)
  })
  
  // merge collections
  var collection = ee.List(collections).iterate(function(c, p) {
    return ee.ImageCollection(p).merge(c)
  }, ee.ImageCollection([]))
  collection = ee.ImageCollection(collection)
  
  // get images
  collection = collection
    //.filterDate('2000-01-01', '2018-01-01')

  return collection
}

// initialize image collections
info = info.map(function(i) {
  i.collection = createImageCollection(i)
  return i
})

// preview a single image
info.map(function(i) {
  //var image = ee.Image(i.collection.toList(1, 0).get(0))
  var image = ee.Image(i.collection.filterDate('2010-06-01', '2010-07-01').first())
  Map.addLayer(image, {bands: ['swir1', 'nir', 'green'], min:0, max:0.3}, i.name + ' first image')
})

// sample locations around given point
// var radius = 300
// var samplingArea = point.buffer(radius)

var radius = 5000
var n = 2000
var samplingArea = point.buffer(radius)
samplingArea = ee.FeatureCollection.randomPoints(samplingArea, n)

Map.addLayer(samplingArea, {color:'grey'}, 'sampling area')

// create plot
var plot = new community.Charts.Scatter(Map, box.bounds());
plot.plotArea() // area + grid
plot.targetScale = 30

// add scatter plots
info.map(function(i) {
  var axesBands = ['green', 'nir']
  var renderBands = ['red', 'green', 'nir']
  //plot.plotValues(i.collection.select(['red', 'green', 'nir']), samplingArea, axesBands, renderBands, i.name + ' green vs nir', false)
})

info.map(function(i) {
  var axesBands = ['blue', 'swir1']
  var renderBands = ['swir1', 'nir', 'blue']
  
  i.collection = i.collection.select(['swir1', 'nir', 'blue'])

  var step = 1
  var years = ee.List.sequence(1984, 2017, step).getInfo()
  
  // add layer
  years.map(function(y) {
    var start = ee.Date.fromYMD(y, 1, 1)
    var stop = ee.Date.fromYMD(y + step, 1, 1)
    plot.plotValues(i.collection.filterDate(start, stop), samplingArea, axesBands, renderBands, y + ' ' + i.name + ' green vs swir1')
  })

  // get frames
  /*
  var images = ee.List(years).map(function(y) {
    var start = ee.Date.fromYMD(y, 1, 1)
    var stop = ee.Date.fromYMD(ee.Number(y).add(step), 1, 1)
    return plot.renderValues(i.collection.filterDate(start, stop), samplingArea, axesBands, renderBands)
  })
  
  Map.addLayer(ee.ImageCollection.fromImages(images).mosaic(), {}, 'merged')
  */
  
})

































/*
// >>> TEST
var image = ee.Image(ee.ImageCollection('LANDSAT/LE7_L1T').filterBounds(point).filter(ee.Filter.neq('REFLECTANCE_ADD_BAND_1', null)).first())
  .select(['B1', 'B2', 'B3', 'B4', 'B5'])

var toa = community.Algorithms.Landsat.TOA(image, [1970, 1842, 1547, 1044,  225.7])

toa = toa.select(image.bandNames(), bands)
image = image.select(image.bandNames(), bands)

Map.addLayer(image.divide(255), {bands: ['swir1', 'nir', 'green'], min:0, max:0.5}, ' first image DN')

Map.addLayer(toa, {bands: ['swir1', 'nir', 'green'], min:0, max:0.5}, ' first image TOA')

return
// <<< TEST

*/
