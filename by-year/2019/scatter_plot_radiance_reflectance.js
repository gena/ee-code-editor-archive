/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var point = /* color: #98ff00 */ee.Geometry.Point([-120.14626979827881, 39.382543889164005]),
    box = /* color: #ff8a7e */ee.Geometry.LineString(
        [[-120.12531653117071, 39.360917651511265],
         [-120.06206799560834, 39.40429581166964]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
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
 * render
 */
community.Charts.Scatter.prototype.render = function(ic, region, axesBands, renderBands, name) {
  // grid
  this.renderGrid()
  
  // area
  var bg = ee.Image().int().paint(this.bounds, 1)
  this.map.addLayer(bg, {palette:['000000']}, name + ' area', true, 0.85)

  var wgs84 = ee.Projection('EPSG:4326');
  
  var w = this.getWidth()
  var h = this.getHeight()

  var origin = this.getOrigin()
  
  var vr = this.vranges
  var xr = vr.xmax - vr.xmin
  var yr = vr.ymax - vr.ymin
  
  var pointSize = this.pointSize
  
  var values = ic.getRegion(region, this.samplingScale).slice(1)

  var bandNames = ee.Image(ic.first()).bandNames()
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
    
  this.map.addLayer(image, {min:0, max:0.6}, name + ' values')
}

/***
 * render grid
 */
community.Charts.Scatter.prototype.renderGrid = function() {
  var ll = this.getCorners().ll
  var origin = ee.Image.constant(ll.get(0)).addBands(ee.Image.constant(ll.get(1)))

  var grid = ee.Image.pixelLonLat()
    .subtract(origin)
    .divide([this.getWidth(), this.getHeight()]).multiply([10, 10]).floor()
    .toInt().reduce(ee.Reducer.sum()).bitwiseAnd(1)
    .clip(this.bounds)
  
  this.map.addLayer(grid, {min:0, max:1}, 'grid')
}

var bands = ['red', 'green', 'blue', 'nir', 'swir1']
  
var assetsReflectance = [
  { id: 'LANDSAT/LC8_L1T_TOA', bands: ['B2', 'B3', 'B4', 'B5', 'B6'], multiplier: 1 },
  { id: 'LANDSAT/LE7_L1T_TOA', bands: ['B1', 'B2', 'B3', 'B4', 'B5'], multiplier: 1 },
  { id: 'LANDSAT/LT5_L1T_TOA', bands: ['B1', 'B2', 'B3', 'B4', 'B5'], multiplier: 1 },
  { id: 'LANDSAT/LT4_L1T_TOA', bands: ['B1', 'B2', 'B3', 'B4', 'B5'], multiplier: 1 }
]

var assetsRadiance = [
  { id: 'LANDSAT/LC8_L1T', bands: ['B2', 'B3', 'B4', 'B5', 'B6'], multiplier: 1/65535 },
  { id: 'LANDSAT/LE7_L1T', bands: ['B1', 'B2', 'B3', 'B4', 'B5'], multiplier: 1/255 },
  { id: 'LANDSAT/LT5_L1T', bands: ['B1', 'B2', 'B3', 'B4', 'B5'], multiplier: 1/255 },
  { id: 'LANDSAT/LT4_L1T', bands: ['B1', 'B2', 'B3', 'B4', 'B5'], multiplier: 1/255 }
]

function plotAssets(assets, name, bounds) {
  // initialize collections
  var collections = assets.map(function(asset, ic) {
    return ee.ImageCollection.load(asset.id).select(asset.bands, bands).map(function(i) { return i.multiply(asset.multiplier) })
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
  
  // add first image
  var image = ee.Image(collection.toList(1,2).get(0))
  Map.addLayer(image, {bands: ['swir1', 'nir', 'green'], min:0, max:0.5}, 'first image')
  
  // sample locations around given point
  var radius = 120
  var samplingArea = point.buffer(radius)
  Map.addLayer(samplingArea, {color:'grey'}, 'sampling area')
  
  // add scatter chart
  var plot = new community.Charts.Scatter(Map, bounds);
  plot.targetScale = 10
  var axesBands = ['green', 'swir1']
  var renderBands = ['swir1', 'nir', 'green']
  plot.render(collection, samplingArea, axesBands, renderBands, 'green vs swir1 ' + name)
  
  var axesBands = ['green', 'nir']
  var renderBands = ['red', 'green', 'nir']
  plot.render(collection, samplingArea, axesBands, renderBands, 'green vs nir ' + name)
}

var box2 = ee.Geometry.LineString(box.bounds().transform(box.projection().translate(-0.065,0), 1).coordinates().get(0))

plotAssets(assetsRadiance, 'radiance', box.bounds())

plotAssets(assetsReflectance, 'reflectance', box2.bounds())