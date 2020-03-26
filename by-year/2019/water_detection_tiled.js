/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var grid1 = ee.FeatureCollection("users/gena/eo-bathymetry/global_coastline_grid_3x2_1"),
    grid2 = ee.FeatureCollection("users/gena/eo-bathymetry/global_coastline_grid_3x2_2"),
    coastline = ee.FeatureCollection("users/gena/eo-bathymetry/osm-coastline"),
    scatterPlot1 = /* color: #d63000 */ee.Geometry.Point([6.3885498046875, 53.76657243186172]),
    scatterPlot1Area = /* color: #98ff00 */ee.Geometry({
      "type": "GeometryCollection",
      "geometries": [
        {
          "type": "LineString",
          "coordinates": [
            [
              7.337985874455171,
              52.94075329527181
            ],
            [
              8.185944398677293,
              52.43167103990884
            ]
          ],
          "geodesic": true
        },
        {
          "type": "Polygon",
          "coordinates": [
            [
              [
                6.48083044622831,
                53.550716351990566
              ],
              [
                6.480726564123074,
                53.554700450047214
              ],
              [
                6.47556730143026,
                53.554633195536354
              ],
              [
                6.475631022099151,
                53.55059706791549
              ]
            ]
          ],
          "geodesic": true,
          "evenOdd": true
        }
      ],
      "coordinates": []
    }),
    jrc = ee.Image("JRC/GSW1_0/GlobalSurfaceWater");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function app() {
  var bathymetryMin = -30

  var bathymetryGebco = ee.Image('users/gena/GEBCO_2014_2D')
    .resample('bicubic')

  Map.addLayer(bathymetryGebco, {min:5, max:bathymetryMin, palette: Palettes.water}, 'Bathymetry (GEBCO)', false)

  var bathymetryEmodnet = ee.Image('users/gena/EMODNET')
    .resample('bicubic')

  Map.addLayer(bathymetryEmodnet, {min:5, max:bathymetryMin, palette: Palettes.water}, 'Bathymetry (EMODNET)', false)

  Map.addLayer(grid1, {color:'green'}, 'grid1 (features)', false)
  Map.addLayer(grid2, {color:'yellow'}, 'grid2 (features)', false)
  Map.addLayer(ee.Image().paint(grid1, 1, 1), {palette:['aaaa00']}, 'grid1')
  Map.addLayer(ee.Image().paint(grid2, 1, 1), {palette:['aaaa00']}, 'grid2', false)
  
  var countries = ee.FeatureCollection('USDOS/LSIB/2013')
  Map.addLayer(countries, {palette: ['000000']}, 'countries')
  
  Map.addLayer(ee.Image().paint(coastline, 1, 1), {palette: ['ffffff']}, 'coastline')
  
  var aoi = ee.Feature(grid1.filter(ee.Filter.eq('id', '4520')).first()).geometry()

  Map.addLayer(aoi, {color:'yellow'}, 'aoi', true, 0.1)
  
  Map.setOptions('SATELLITE')



  // PDF
  var images = getImages(aoi)
  
  var pdf = images.select('green').map(function(i) {
    return i.focal_median(3)
  }).reduce(ee.Reducer.fixedHistogram(0, 1, 100))  
  
  Map.addLayer(pdf, {}, 'PDF', false)
  
  var poiLayer = ui.Map.Layer(null, {color:'red'}, 'current point')
  Map.layers().add(poiLayer)

  Map.onClick(function(pt) {
    pt = ee.Dictionary(pt)
    var lat = pt.get('lat')
    var lon = pt.get('lon')
    
    var poi = ee.Geometry.Point([lon, lat]).buffer(150)
    
    poiLayer.setEeObject(poi)
    
    var scale = Map.getScale()
    
    // plot histogram
    var values = pdf.reduceRegion({reducer: ee.Reducer.toList(), geometry: poi, scale: scale}).values().get(0)
    
    var features = ee.FeatureCollection(ee.List(values).map(function(hist) {
      return ee.Feature(null, {hist: hist})
    }))
    
    Export.table.toDrive(features)
    return 
    
    var reflectances = ee.Array(values).slice(1,0,1)
    var frequencies = ee.Array(values).slice(1,1,2)
    
    print(ui.Chart.array.values(frequencies, 0, reflectances).setOptions({lineWidth: 1, pointSize: 0}))
    print(ui.Chart.image.series(images, poi).setOptions({lineWidth: 1, pointSize: 0}))
    var ndwi = images.map(function(i) { 
      return i.normalizedDifference(['green', 'nir']).set({'system:time_start': i.get('system:time_start')})
    })

    print(ui.Chart.image.series(ndwi, poi).setOptions({lineWidth: 1, pointSize: 0}))
  })
  
  
  //return



  // grid
  var bounds = aoi.bounds().getInfo().coordinates[0]
  
  var xmin = bounds[0][0];
  var xmax = bounds[1][0];
  var ymin = bounds[0][1];
  var ymax = bounds[2][1];
  
  //var dx = 0.2
  //var dy = 0.12
  
  var dx = 0.2
  var dy = 0.2
  
  var e = 1000
  
  var land = countries.filterBounds(aoi).geometry(e).buffer(-2000, e)
  
  var coastlineAOI = coastline.filterBounds(aoi)
    .map(function(f) { return f.buffer(10000, e).difference(land, e) }).geometry(e).dissolve(e)

  Map.addLayer(coastlineAOI, {color:'white'}, 'coastline (aoi)')
  
  var grid = generateGrid(xmin, ymin, xmax, ymax, dx, dy)
    .filterBounds(coastlineAOI)
    

  var gridImage = ee.Image().toByte().paint(grid, 1, 2);
  Map.addLayer(gridImage.mask(gridImage), {palette:['aa00aa']}, 'grid')
  
  // for every cell, compute water intertidal water occurrence
  var waterOccurrence = ee.ImageCollection(grid.map(computeWaterOccurrence)).mean()

  Map.addLayer(waterOccurrence, {palette: Palettes.water, min:-0.1, max:0.5}, 'water occurrence')
  
  // simple mean
  var ndwi = images
    .map(function(i) {
      return i.normalizedDifference(['green', 'nir']).rename('water_score')
    })

  ndwi = ndwi
    .mean()
    .clip(Map.getBounds(true))
    // .clip(grid.geometry().dissolve(100))
    
  Map.addLayer(ndwi, {palette: Palettes.water, min:-0.1, max:0.21}, 'water occurrence (simple mean)', false)
  
  print(ui.Chart.image.histogram(ndwi, aoi, Map.getScale()*4, 200))


  // JRC
  Map.addLayer(jrc.select('occurrence').divide(100), {palette: Palettes.water, min:0, max:1}, 'water occurrence (JRC)', false)

  // scatter plot

  // sample locations around given point
  var radius = 900
  var samplingArea = scatterPlot1.buffer(radius)
  Map.addLayer(samplingArea, {color:'grey'}, 'sampling area')
  
  // add scatter chart
  var plot = new community.Charts.Scatter(Map, scatterPlot1Area.bounds());
  plot.targetScale = Map.getScale() 
  print(plot.targetScale)
  var axesBands = ['green', 'swir1']
  var renderBands = ['swir1', 'nir', 'green']
  plot.render(images, samplingArea, axesBands, renderBands, 'green vs swir1 ')
}

var s2 = ee.ImageCollection('COPERNICUS/S2')

s2 = s2
  .select(['B11','B8','B4','B3','B2'], ['swir1', 'nir', 'red', 'green', 'blue'])
  .filterDate('2015-01-01', '2018-01-01')

var l8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')

l8 = l8
  .select(['B6','B5','B4','B3','B2'], ['swir1', 'nir', 'red', 'green', 'blue'])
  .filterDate('2015-01-01', '2018-01-01')

function getImages(g) {
  var images1 = s2
    .filterBounds(g)
    //.map(function(i) { return i.resample('bicubic') })
    .map(function(i) { return i.addBands(i.multiply(0.0001).float(), i.bandNames(), true)})

  var images2 = l8
    .filterBounds(g)
    //.map(function(i) { return i.resample('bicubic') })

  return ee.ImageCollection(images1.merge(images2))
}

function computeWaterOccurrence(g) {
  var gOld = g
  
  g = g.geometry().buffer(300)
  
  var cloudFrequency = 70 // TODO: estimate from http://www.earthenv.org/cloud
  var clearRange = [0, 0.16] // min/max score for mostly cloud-free images (TODO: guess from CDF)
  var scorePercentile = 95
  var scale = 300

  var images = getImages(g)
  

  images = images
    .map(function(i) { return i.set({score: i.select('green').reduceRegion(ee.Reducer.percentile([scorePercentile]), g, scale).values().get(0)})
    })
    
  //var scoreMax = images.reduceColumns(ee.Reducer.percentile([100-cloudFrequency]), ['score']).values().get(0)
  //clearRange[1] = scoreMax
  
    
  images = images
    .filter(ee.Filter.and(ee.Filter.gte('score', clearRange[0]), ee.Filter.lte('score', clearRange[1])))

  var ndwi = images
    .map(function(i) {
      return i.normalizedDifference(['green', 'nir']).rename('water_score')
    })

  ndwi = ndwi
    .mean()
    //.median()
    .clip(g)

  return ndwi
}

var Palettes = {
    water: ['f7fbff', 'deebf7', 'c6dbef', '9ecae1', '6baed6', '4292c6', '2171b5', '08519c', '08306b']
};


/***
 * Generates regular grid using given bounds, specified as geometry.
 */
/***
 * Generates regular grid using given bounds, specified as geometry.
 */
var generateGrid = function(xmin, ymin, xmax, ymax, dx, dy) {
  var xx = ee.List.sequence(xmin, ee.Number(xmax).subtract(dx), dx)
  var yy = ee.List.sequence(ymin, ee.Number(ymax).subtract(dy), dy)
  
  var cells = xx.map(function(x) {
    return yy.map(function(y) {
      var x1 = ee.Number(x)
      var x2 = ee.Number(x).add(ee.Number(dx))
      var y1 = ee.Number(y)
      var y2 = ee.Number(y).add(ee.Number(dy))
      
      var coords = ee.List([x1, y1, x2, y2]);
      var rect = ee.Algorithms.GeometryConstructors.Rectangle(coords, 'EPSG:4326', false);
      return ee.Feature(rect)
    })
  }).flatten();

  return ee.FeatureCollection(cells);
}



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
  
/*  var values = ic.getRegion(region, this.samplingScale).slice(1)

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
*/  

  var samplingScale = this.samplingScale
  
  var features = ic.select(renderBands).map(function(i) { 
    return i.sample({region: region, scale: 10, numPixels: 50})
  }).flatten()
  
  features = features.map(function(f) {
    var vx = f.get(axesBands[0])
    var vy = f.get(axesBands[1])
      
    // fix empty :(
    vx = ee.Algorithms.If(ee.Algorithms.IsEqual(vx, null), 0, vx)
    vy = ee.Algorithms.If(ee.Algorithms.IsEqual(vy, null), 0, vy)
  
    var x = ee.Number(vx).multiply(w).divide(xr).add(origin.x)
    var y = ee.Number(vy).multiply(h).divide(yr).add(origin.y)
    
    var g = ee.Algorithms.GeometryConstructors.Point([x, y])

    return f.setGeometry(g)
  })
  
  print(features.size())

  var image = features
    .reduceToImage(renderBands, ee.Reducer.max(3))
    //.reduceToImage([renderBands[0]], ee.Reducer.count()).clip(this.bounds) // count
    
  image = image.mask(image.gt(0))
    
  image = image    
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



app()