/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var catchments = ee.FeatureCollection("users/gena/water-niger/wflow/catchments");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// arrow
function createCrossSection(origin, angle, length) {
  length = ee.Number(length)
  
  var ptOrigin = ee.Array([origin.coordinates()]).transpose()
  
  // get coordinates as a list
  var proj1 = origin.projection().translate(length.multiply(-0.5), 0)
  var pt1 = ee.Array([origin.transform(proj1).coordinates()]).transpose()

  // translate
  var proj2 = origin.projection().translate(length.multiply(0.5), 0)
  var pt2 = ee.Array([origin.transform(proj2).coordinates()]).transpose()
  
  // define rotation matrix
  angle = ee.Number(angle)
  var cosa = angle.cos()
  var sina = angle.sin()
  var M = ee.Array([
    [cosa, sina.multiply(-1)], 
    [sina, cosa]
  ])

  // rotate
  pt1 = M.matrixMultiply(pt1.subtract(ptOrigin)).add(ptOrigin)
  pt2 = M.matrixMultiply(pt2.subtract(ptOrigin)).add(ptOrigin)

  // get points
  pt1 = pt1.transpose().project([1]).toList()
  pt2 = pt2.transpose().project([1]).toList()
  
  // construct line
  var line = ee.Algorithms.GeometryConstructors.LineString([pt1, pt2], ee.Projection(crs))

  return line
}


// Map.setCenter(-2.880740951509779,16.665542701138307, 13)

// print(Map.getBounds(true))
// print(Map.getCenter())
// print(Map.getZoom())

var palettes = require('users/gena/packages:palettes')
var hydro = require('users/gena/packages:hydro')
var geometry = require('users/gena/packages:geometry')

Map.setOptions('HYBRID')

// dem
hydro.Map.addDem({ asset: 'ALOS', extrusion: 10, layer: { name: 'DEM' }, palette: ["d9d9d9","bdbdbd","969696","737373","525252","252525","000000"].reverse()})

// catchments
Map.addLayer(catchments, {}, 'catchments (features)', false)
Map.addLayer(ee.Image().int().paint(catchments, 1), { palette: ['black'] }, 'catchments (black)', true, 0.75)
Map.addLayer(ee.Image().int().paint(catchments, 'HYBAS_ID').randomVisualizer(), {}, 'catchments', false, 0.5)

// water occurrence
var waterOccurrence = ee.Image("JRC/GSW1_0/GlobalSurfaceWater")
  .select('occurrence')
  .divide(100)
  .unmask(0)
  .resample('bilinear')

var waterOccurrenceTh = 0.1

Map.addLayer(waterOccurrence.multiply(2).mask(waterOccurrence.multiply(2)), {min: 0, max: 1, palette: palettes.cb.YlOrRd[9].reverse().slice(1) }, 'water occurrence')
Map.addLayer(ee.Image(1).mask(waterOccurrence.gt(waterOccurrenceTh)), {palette: ['white'] }, 'water occurrence > ' + waterOccurrenceTh, false)


// rivers
var rivers = ee.FeatureCollection('users/gena/HydroEngine/riv_15s_lev05')
  .filterBounds(catchments.geometry())
  
  .filterBounds(Map.getBounds(true))
  
  
// smoothen
rivers = rivers.map(function(f) {
  return f.simplify(650)
})

  
Map.addLayer(rivers.style({ width: 1, color: 'cyan' }), {}, 'rivers', false)

var riversFA = ee.Image().int().paint(rivers, 'UP_CELLS')
Map.addLayer(riversFA.updateMask(riversFA.divide(2000)), { min: 10, max: 10000, palette: ['ffffff'] }, 'rivers (flow accumulation)')  

var riversID = ee.Image().int().paint(rivers, 'ARCID')
Map.addLayer(riversID.randomVisualizer(), {}, 'rivers (random)', false)  

var riversID = ee.Image().int().paint(rivers, 'ARCID', 3)
Map.addLayer(riversID.randomVisualizer(), {}, 'rivers (random, size=3)', false)  

// export river width per river segment
rivers = rivers.map(function(f) {
  return f.set({ length: f.length() })
})

var step = 1000

var shortRiverSegments = rivers.filter(ee.Filter.lte('length', step))
  .map(function(f) {
    return f.set({ 
      SEGMENT_ID: f.get('ARCID'),
      DISTANCE: f.length()
    })
  })

var longRiverSegments = rivers.filter(ee.Filter.gt('length', step)).map(function(f) {
  var length = f.length()
  var distances = ee.List.sequence(0, length, step)
  var segmentGeometries = f.cutLines(distances).geometry().geometries()
  
  var ARCID = ee.Number(f.get('ARCID'))
  
  var segmentFeatures = segmentGeometries.zip(distances).map(function(o) {
      o = ee.List(o)
      var segment = ee.Geometry(o.get(0))
      var distance = ee.Number(o.get(1))
      
      var segmentId = ARCID.multiply(10000000).add(distance)
      
      var segmentFeature = ee.Feature(segment, {
        SEGMENT_ID: segmentId,
        DISTANCE: distance
      })
      
      segmentFeature = segmentFeature.copyProperties(f)
      
      return segmentFeature
  })
  
  return ee.FeatureCollection(segmentFeatures)
}).flatten()

var riverSegments = longRiverSegments.merge(shortRiverSegments)

print(riverSegments.limit(10))

var segmentID = ee.Image().long().paint(riverSegments, 'SEGMENT_ID', 3)
Map.addLayer(segmentID.randomVisualizer(), {}, 'river segments (random, size=3)', true)

// generate cross-sections

var lengthMax = 5000
var lengthMin = 500

var maxError = 100

var crs = 'EPSG:3857'

var crossSections = riverSegments.map(function(f) {
  var geom = f.geometry().transform(crs, maxError)
  var centroid = geom.centroid(maxError, crs)
  var coords = geom.coordinates()
  
  var pt0 = coords.slice(0, 1)
  var pt1 = coords.slice(-1)
  var delta = ee.Array(pt1).subtract(pt0)
  var dx = delta.get([0, 0])
  var dy = delta.get([0, 1])
  var angle = dx.atan2(dy).add(Math.PI / 2)
  
  // use flow accumulation to scale cross-sections
  var length = ee.Number(f.get('UP_CELLS')).divide(2500).multiply(lengthMax).max(lengthMin).min(lengthMax)

  var vector = createCrossSection(centroid, angle, length)

  // estimate width
  var width = waterOccurrence.gt(waterOccurrenceTh).reduceRegion({
    reducer: ee.Reducer.sum().combine(ee.Reducer.count(), '', true),
    geometry: vector, 
    scale: 30, 
  })
  
  // estimate width as a fraction of cross-section length covered by water
  width = ee.Number(width.get('occurrence_sum')).divide(width.get('occurrence_count')).multiply(length)

  var crossSection = ee.Feature(vector)
    .set({ width: width })
    .copyProperties(f)
    
  return crossSection
})

Map.addLayer(crossSections, { color: 'ff00ff'}, 'cross-sections')

Export.table.toAsset({
  collection: riverSegments, 
  description: 'Niger-river-segments', 
  assetId: 'users/gena/water-niger/river_segments'
})

Export.table.toAsset({
  collection: crossSections, 
  description: 'Niger-river-crossSections', 
  assetId: 'users/gena/water-niger/river_cross_sections'
})

