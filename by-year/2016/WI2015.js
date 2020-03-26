/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function getEdge(image) {
  var edge = ee.Algorithms.CannyEdgeDetector(image.resample('bicubic'), 0.9, 2)
  return edge.mask(edge)
}

var image = ee.Image(l7.filterBounds(Map.getBounds(true)).toList(1,14).get(0))
Map.addLayer(image, {bands: ['B5', 'B4', 'B2']})

var mndwi = image.normalizedDifference(['B5', 'B2'])
Map.addLayer(mndwi, {min:-1, max:1}, 'mndwi')
Map.addLayer(getEdge(mndwi.multiply(5)), {palette: ['ff0000']}, 'mndwi (edge)')

var ndwi = image.normalizedDifference(['B4', 'B2'])
Map.addLayer(ndwi, {min:-1, max:1}, 'ndwi')
Map.addLayer(getEdge(ndwi.multiply(5)), {palette: ['00ff00']}, 'ndwi (edge)')

var wi2015 = image.expression('1.7204 + 171 * b("B2") + 3 * b("B3") - 70 * b("B4") - 45 * b("B5")  - 71 * b("B7")')
Map.addLayer(wi2015, {min:16, max:-28}, 'wi2015')
Map.addLayer(getEdge(wi2015.divide(5)), {palette: ['ffff00']}, 'wi2015 (edge)')
