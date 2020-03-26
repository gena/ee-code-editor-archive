/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    geometry = /* color: d63000 */ee.Geometry.Polygon(
        [[[48.87422561645508, 30.070282433306616],
          [48.9961051940918, 30.070282433306616],
          [48.99456024169922, 30.154181926961897],
          [48.873023986816406, 30.15373663113731]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var bands = ['B6', 'B5', 'B3']

l8 = l8
  .filterDate('2013-01-01', '2015-01-01')
  .select(bands)

var min = l8.reduce(ee.Reducer.percentile([20])).rename(bands).clip(geometry.bounds())
var max = l8.reduce(ee.Reducer.percentile([70])).rename(bands).clip(geometry.bounds())

var vis = {min: 0.05, max: 0.4}

Map.addLayer(min, vis, 'min')
Map.addLayer(max, vis, 'max')

var minNdwi = min.normalizedDifference(['B3', 'B6'])
var maxNdwi = max.normalizedDifference(['B3', 'B6'])

var visNdwi = {min: -0.5, max:0.5}
Map.addLayer(minNdwi, visNdwi, 'min ndwi')
Map.addLayer(maxNdwi, visNdwi, 'max ndwi')

var minEdge = ee.Algorithms.CannyEdgeDetector(minNdwi, 0.70, 0.5)
var maxEdge = ee.Algorithms.CannyEdgeDetector(maxNdwi, 0.70, 0.5)

minEdge = minEdge.mask(minEdge.mask().focal_min(1).multiply(minEdge))
maxEdge = maxEdge.mask(maxEdge.mask().focal_min(1).multiply(minEdge))

var visEdge = {palette:['ffffff']}
Map.addLayer(minEdge, visEdge, 'min edge')
Map.addLayer(maxEdge, visEdge, 'max edge')

var minWater = minNdwi.gt(0.31).focal_max(3).focal_mode(4, 'circle', 'pixels', 5).focal_min(3)
var maxWater = maxNdwi.gt(0.48).focal_max(3).focal_mode(4, 'circle', 'pixels', 5).focal_min(3)
var visWater = {palette:['5050ff']}
Map.addLayer(minWater.mask(minWater), visWater, 'min water')
Map.addLayer(maxWater.mask(maxWater), visWater, 'max water')

var minEdgeWater = ee.Algorithms.CannyEdgeDetector(minWater, 0.99, 0)
var maxEdgeWater = ee.Algorithms.CannyEdgeDetector(maxWater, 0.99, 0)
minEdgeWater = minEdgeWater.mask(minEdgeWater.mask().focal_min(1).multiply(minEdgeWater))
maxEdgeWater = maxEdgeWater.mask(maxEdgeWater.mask().focal_min(1).multiply(maxEdgeWater))

var visEdge = {palette:['ffffff']}
Map.addLayer(minEdgeWater, visEdge, 'min edge water')
Map.addLayer(maxEdgeWater, visEdge, 'max edge water')

var intertidalZone = minWater.and(maxWater.not())
Map.addLayer(intertidalZone.mask(intertidalZone), {palette:['ffff00']}, 'intertidal zone')
