var assets = require('users/gena/packages:assets') 
var animation = require('users/gena/packages:animation')
var utils = require('users/gena/packages:utils')
var hydro = require('users/gena/packages:hydro')
var palettes = require('users/gena/packages:palettes')

/***
 * Removes very small polygons to prevent noise in results
 */
function removeSmallInteriors(features, count) {
  var features = features.map(function(f) {
    var c = f.geometry().coordinates()
    var exterior = c.get(0)

    var interior = c.slice(1).map(function(o) {
      var l = ee.List(o)
      return ee.Feature(null, { count: l.length(), values: l })
    })
    
    interior = ee.FeatureCollection(interior)
    
    // take only large enough interiors
    interior = interior
      .filter(ee.Filter.gt('count', count))
    
    interior = interior.toList(10000).map(function(f) {
      return ee.Feature(f).get('values')
    })
    
    return ee.Feature(ee.Geometry.Polygon(ee.List([exterior]).cat(interior)))
  })

  return features
}

/***
 * Generates equdistant points along perimeter(s).
 */
function generatePerimeterPoints(geom, step) {
  var p = geom.perimeter(error)
  
  var n = p.divide(step).int()
  
  print('Number of points along perimeter: ', n)
  
  var step = p.divide(n)

  // map over exterior and interiors
  var rings = geom.coordinates().map(function(coords) {
    var ring = ee.Algorithms.GeometryConstructors.LineString(coords)
    
    var p2 = ring.length(error)

    var distances = ee.List.sequence(0, p2, step)
    
    return ee.Feature(ring)
      .set({distances: distances})
      .set({distancesCount: distances.length()})
  })
  
  rings = ee.FeatureCollection(rings)
  
  var points = rings
    .filter(ee.Filter.gt('distancesCount', 2))
    .map(function(ring) {
      var distances = ring.get('distances')
      
      var segments = ring.geometry().cutLines(distances, error).geometries()
      
      var points = segments
        .map(function(g) { 
            return ee.Feature(ee.Geometry(g).centroid(error))
        })
      
      return ee.FeatureCollection(points)
    }).flatten()

  return ee.FeatureCollection(points)
}

/***
 * Generates Voronoi diagrams biven points and AOI.
 */
function generateThiessenPolygons(points, scale, aoi) {
  var distance = ee.Image(0).float().paint(points, 1)
    .fastDistanceTransform().sqrt().clip(aoi)
    .reproject(proj) // avoid artifacts when visualizing
    
  Map.addLayer(distance, { min: 0, max: 100 }, 'distance', false)

  var concavity = distance.convolve(ee.Kernel.laplacian8())
    .reproject(proj)
    
  concavity = concavity.multiply(distance)    

  Map.addLayer(concavity, { min: -2, max: 2 }, 'concavity', false)
  
  var concavityTh = 0
  
  var edges = concavity.lt(concavityTh)

  Map.addLayer(edges.mask(edges), { min: 0, max: 1 }, 'edges', false)
  
  Map.addLayer(aoi, {}, 'aoi', false)

  // label connected components
  var connected = edges.not().connectedComponents(ee.Kernel.circle(1), 256)
    .clip(aoi/*.buffer(-scale * 3, error)*/)
    .focal_max(scale * 3, 'circle', 'meters') // close holes
    .focal_min(scale * 3, 'circle', 'meters') 
    .focal_mode(scale * 3, 'circle', 'meters') // smoothen
    .reproject(proj)

  // fixing reduceToVectors() bug, remap to smaller int
  function fixOverflowError(i) {
    var hist = i.reduceRegion(ee.Reducer.frequencyHistogram(), aoi, scale)
    var uniqueLabels = ee.Dictionary(ee.Dictionary(hist).get('labels')).keys()
      .map(function(o) { 
        return ee.Number.parse(o) 
      })
    var labels = ee.List.sequence(0, uniqueLabels.size().subtract(1))
    return i.remap(uniqueLabels, labels).rename('labels').int()
  }
  
  connected = fixOverflowError(connected)
    .reproject(proj)

  Map.addLayer(connected.clip(aoi).randomVisualizer(), {}, 'connected', false)

  var polygons = connected.select('labels')
    .reduceToVectors({
      scale: scale,
      crs: proj,
      geometry: aoi,
      eightConnected: true,
      labelProperty: 'labels',
      tileScale: 4
    })
    
  polygons = polygons.map(function(f) {
    return f.snap(ee.ErrorMargin(1, 'projected'), proj)
  })
  
  Map.addLayer(polygons, {}, 'polygons (features)', false)
  Map.addLayer(polygons.style({color: 'black', fillColor: 'lightblue', width: 1}), {}, 'polygons', true, 0.3)
  Map.addLayer(polygons.map(function(f) { return f.simplify(scale * 2)}).style({color: 'black', fillColor: 'lightblue'}), {}, 'polygons (smoothed)', false)
  
  return { polygons: polygons, distance: distance }
}

Map.setCenter(-2.880740951509779,16.665542701138307, 13)

// =================================================================

hydro.Map.addDem({ asset: 'ALOS', extrusion: 10, layer: { name: 'DEM' }, palette: ["d9d9d9","bdbdbd","969696","737373","525252","252525","000000"].reverse()})
Map.addLayer(ee.Image(1), { palette: ['000000'] }, 'black', false, 0.5)

var land = ee.Image("users/gena/land_polygons_image")

var scale = Map.getScale()
var error = ee.ErrorMargin(scale / 2, 'meters')
var step = scale * 10 // step between points along perimeter
var simplifyCenterlineFactor = 15
var bounds = ee.Geometry(Map.getBounds(true)).buffer(scale * 100, error)

// 1. get water occurrence
var waterOccurrence = ee.Image("JRC/GSW1_0/GlobalSurfaceWater")
  .select('occurrence')
  .divide(100)
  .unmask(0)
  .resample('bilinear')

waterOccurrence = waterOccurrence
  .mask(waterOccurrence.multiply(2).multiply(land.mask()))

Map.addLayer(waterOccurrence, {min: 0, max: 1, palette: palettes.cb.YlOrRd[9].reverse().slice(1) }, 'water occurrence (lava)')

// 2. clean water mask
var water = waterOccurrence.unmask(0).gt(0.3)

Map.addLayer(water.mask(water), {palette: ['ffffff', '3182bd']}, 'water (JRC)', false)

// connect waterbodies with thin gaps (e.g. bridges)
var clean = water
  // .focal_max(scale * 3, 'circle', 'meters')
  .focal_mode(scale * 3, 'circle', 'meters')
  // .focal_min(scale * 2, 'circle', 'meters')

// mask
water = water.updateMask(clean)

// Map.addLayer(water.mask(water), {min: -0.05, max: 0.3, palette: ['ffffff', '3182bd']}, 'water (clean)')

var waterVector = clean.mask(clean).reduceToVectors({
  geometry: bounds, 
  scale: scale * 0.5, 
  eightConnected: true,
  tileScale: 4
})

Map.addLayer(waterVector, {}, 'water all (vector)')

// take the first feature only
waterVector = waterVector.map(function(f) { return f.set({ area: f.area(scale) }) })
waterVector = waterVector.sort('area', false).limit(1)

// waterVector = removeSmallInteriors(waterVector, 5)

waterVector = ee.Feature(waterVector.geometry())

// filter water mask manually
// waterVector = waterVector.filterBounds(geometry)

// Map.addLayer(waterVector, { color: 'lightblue' }, 'water (vector) 1', true, 0.85)
waterVector = waterVector.simplify(scale * 1.5)
// Map.addLayer(waterVector, { color: 'lightblue' }, 'water (vector) 2', true, 0.85)



Map.addLayer(waterVector, { color: 'lightblue' }, 'water (vector)', true, 0.85)

// network


var error = ee.ErrorMargin(1, 'meters')
var proj = ee.Projection('EPSG:4326').atScale(scale)

print('Scale: ', scale)

var geometry = waterVector.geometry()

var geometryBuffer = geometry
  .buffer(scale * 4, error)

//var perimeterGeometry = ee.Geometry.MultiLineString(geometry.coordinates())
var perimeterGeometry = geometryBuffer.difference(geometryBuffer.buffer(-scale * 3.5, error), error)
Map.addLayer(perimeterGeometry, { color: 'aa1111'}, 'perimeter geometry', false)

geometry = geometryBuffer

var points = generatePerimeterPoints(geometry, step)


Map.addLayer(points.style({color: 'white', pointSize: 1}), {}, 'points', false)

var t = generateThiessenPolygons(points, scale, geometry)

var polygons = t.polygons
var distance = t.distance

var distFilter = ee.Filter.and(
  ee.Filter.intersects({
    leftField: '.geo', 
    rightField: '.geo',
    maxError: error
  }),

  ee.Filter.notEquals({
    leftField: 'labels',
    rightField: 'labels',
  })
)

// Define a saveAll join.
var distSaveAll = ee.Join.saveAll({
  matchesKey: 'matches',
});

// Apply the join.
var spatialJoined = distSaveAll.apply(polygons, polygons, distFilter);

var features = spatialJoined

// define biparite
var f = features.map(function(ff1) { 
  var matches = ee.FeatureCollection(ee.List(ff1.get('matches'))) 
  
  return matches.map(function(ff2) {
    var i = ff2.intersection(ff1, error, proj)
    
    return i
          .set({ touchesPerimeter: i.intersects(perimeterGeometry, error, proj) })
          .set({ intersectsWithMask: i.intersects(geometry, error, proj) })
  })
}).flatten()

Map.addLayer(perimeterGeometry, {}, 'perimeter (line)', false)

var centerline = f
  .filter(ee.Filter.eq('touchesPerimeter', false))
  .filter(ee.Filter.eq('intersectsWithMask', true))
  
Map.addLayer(centerline.style({width: 1, color: 'yellow'}), {}, 'centerline', false)

var centerline = centerline.geometry().dissolve(scale, proj).simplify(scale * simplifyCenterlineFactor, proj)

centerline = centerline.geometries().map(function(g) {
  g = ee.Geometry(g)
  
  return ee.Feature(g)
})

centerline = ee.FeatureCollection(centerline)

centerline = centerline.map(function(f) {
  return f.set({ type: f.geometry().type() })
}).filter(ee.Filter.eq('type', 'LineString'))

Map.addLayer(centerline, { color: 'yellow' }, 'centerline (simplified)')
Map.addLayer(centerline, { color: 'black' }, 'centerline (simplified)', false)

print('Number of edges: ', centerline.aggregate_count('type'))

var chainageStep = scale * 15

// generate width at every chainage
centerline = centerline.map(function(line) {
  return line.set({ length: line.length(error) })
})


function getMiddlePoint(line) {
  var geom = ee.Geometry(line)
  return ee.Geometry.Point(geom.coordinates().get(0))

  // var segment = ee.Geometry(line.cutLines([0, line.length(error).multiply(0.5)], error).geometries().get(0))
  // return ee.Feature(ee.Geometry.Point(segment.coordinates().get(-1)))
}

var shortLines = centerline.filter(ee.Filter.lte('length', chainageStep))

print('Short lines: ', shortLines)

var shortLinePoints = shortLines.map(function(line) {
  var geom = line.geometry(error, 'EPSG:4326')
  return ee.Feature(ee.Geometry.Point(geom.coordinates().get(0), 'EPSG:4326'))
      .set({lineId: line.id() })
      .set({offset: 0})
})

var longLines = centerline.filter(ee.Filter.gt('length', chainageStep))

var longLinePoints = longLines.map(function(line) {
  var lineLength = line.length(error)
  var distances = ee.List.sequence(0, lineLength, chainageStep)
  var segments = line.geometry().cutLines(distances, error)
  
  segments = segments.geometries().zip(distances).map(function(o) { 
    o = ee.List(o)
    var d = ee.Number(o.get(1))
    var s = ee.Geometry(o.get(0))
    
    var centroid = ee.Geometry.Point(s.coordinates().get(0))
    
    return ee.Feature(centroid)
      .set({lineId: line.id() })
      .set({offset: d})
  })
  
  return ee.FeatureCollection(segments)
}).flatten()


longLinePoints = ee.FeatureCollection(longLinePoints)

var points = longLinePoints.merge(shortLinePoints)

// add width
points = points.map(function(f) {
  var centroid = f.geometry()
  
  var width = distance.reduceRegion({ reducer: ee.Reducer.max(), geometry: centroid, scale: scale }).values().get(0)

  return f
      .set({width: ee.Number(width).multiply(scale).multiply(2) })
})

Map.addLayer(shortLinePoints.style({color: 'brown', pointSize: 2, width: 1}), {}, 'sampling points (short)')
Map.addLayer(longLinePoints.style({color: 'brown', pointSize: 2, width: 1}), {}, 'sampling points (long)')

print('Network (GEO): ', centerline)
print('Network properties (GEO): ', points)

Export.table.toAsset(ee.FeatureCollection(waterVector), "example-water-mask", 'users/gena/eo-river/example-water-mask')
Export.table.toAsset(centerline, "example-water-network", 'users/gena/eo-river/example-water-network')
Export.table.toAsset(points, "example-water-network-properties", 'users/gena/eo-river/example-water-network-properties')

function toWebMercator(f) {
  return f.transform(ee.Projection('EPSG:3857').atScale(scale), 1)
}

print('Network (WEB): ', centerline.map(toWebMercator))
print('Network properties (WEB): ', points.map(toWebMercator))



// TODO: put into a graph
// TODO: prune short leaves






/*
print(waterVector.map(function(f) {
  return f.set({ geometryType: f.geometry().type() })
}).aggregate_array('geometryType'))



// // water occurrence (monthly)
// var waterOccurrence = ee.ImageCollection('JRC/GSW1_0/MonthlyHistory')
//   .filterDate('2010-01-01', '2016-01-01')
//   .map(function(i) { 
//     return i.resample('bicubic') 
//   })
//   .map(function(i) {
//     return i.eq(2).updateMask(i.neq(0))
//   })
//
// waterOccurrence = waterOccurrence.sum().divide(waterOccurrence.count())

// var waterOccurrenceMax = ee.Image('users/gena/JRC_MAX_ANNUAL_WATER_OCCURRENCE').resample('bicubic')
// var palette = ["ffffcc","ffeda0","fed976","feb24c","fd8d3c","fc4e2a","e31a1c","bd0026","800026"].reverse().slice(1)
// Map.addLayer(waterOccurrenceMax.mask(waterOccurrenceMax.multiply(2)), {min: 0, max: 1, palette: palette}, 'water occurrence (max)', false)

var f = ee.Filter.date('2017-01-01', '2018-01-01')

var s2 = assets.getImages(bounds, {
  missions: ['S2'],
  filter: f,
  resample: true
})

var image = s2
  .select(['swir', 'nir', 'green'])
  .reduce(ee.Reducer.percentile([15]))
  .rename(['swir', 'nir', 'green'])
  
Map.addLayer(image, {min: 0.05, max: 0.6, gamma: 1.3 }, "image", false)  
  
var ndwi = image  
  .select(['green', 'swir'])
  .normalizedDifference()

var water = ndwi.gt(0.1)  

Map.addLayer(ndwi.mask(ndwi.gt(0)), {min: -0.05, max: 0.3, palette: ['ffffff', '3182bd']}, 'water', false)

//Map.addLayer(water.focal_min(100, 'circle', 'meters').focal_max(100, 'circle', 'meters'), {min: -0.05, max: 0.3, palette: ['ffffff', '3182bd']}, 'water (clean)')

//var edge = ee.Algorithms.CannyEdgeDetector(ndwi, 0.5, 0.5)
//Map.addLayer(edge.mask(edge), {palette: ['ffffff']}, 'water edge', false)

var l8 = assets.getImages(bounds, {
  missions: ['L8'],
  filter: f
})

animation.animate(s2)

animation.animate(l8, {position: 'bottom-center'})


// Map.addLayer(clean, { color: 'lightblue' }, 'water (clean)', false)

// skeletonize (alternative method)
// var skeleton = utils.skeletonize(clean, 40, 2)
// Map.addLayer(skeleton.mask(skeleton), { palette: 'ff00ff' }, 'skeleton', false)





// Map.addLayer(clean, {}, 'closing', false)  

// // remove small waterbodies (morphological opening)
// var clean = clean
//   .focal_min(scale * 3, 'circle', 'meters')
//   .focal_max(scale * 3, 'circle', 'meters')

// Map.addLayer(clean, {}, 'opening', false)  

*/


var catchments = ee.FeatureCollection("users/gena/water-niger/wflow/catchments");

// rivers
var rivers = ee.FeatureCollection('users/gena/HydroEngine/riv_15s_lev05')
  .filterBounds(catchments.geometry())
  
Map.addLayer(rivers.style({ width: 1, color: 'cyan' }), {}, 'rivers', false)

var riversFA = ee.Image().int().paint(rivers, 'UP_CELLS')
Map.addLayer(riversFA.updateMask(riversFA.divide(2000)), { min: 10, max: 10000, palette: ['ffffff'] }, 'rivers (flow accumulation)')  
