
/***
 * Computes export video / image parameters: scale, rect.
 */
function generateExportParameters(bounds, w, h) {
  bounds = ee.Geometry(bounds).bounds()
  w = ee.Number(w)
  h = ee.Number(h)
  
  // get width / height
  var coords = ee.List(bounds.coordinates().get(0))
  var ymin = ee.Number(ee.List(coords.get(0)).get(1))
  var ymax = ee.Number(ee.List(coords.get(2)).get(1))
  var xmin = ee.Number(ee.List(coords.get(0)).get(0))
  var xmax = ee.Number(ee.List(coords.get(1)).get(0))
  var width = xmax.subtract(xmin)
  var height = ymax.subtract(ymin)

  // compute new height, ymin, ymax and bounds
  var ratio = w.divide(h)
  var ycenter = ymin.add(height.divide(2.0))

  height = width.divide(ratio)
  ymin = ycenter.subtract(height.divide(2.0))
  ymax = ycenter.add(height.divide(2.0))
  
  bounds = ee.Geometry.Rectangle(xmin, ymin, xmax, ymax)
  
  var scale = width.divide(w)
  
  print('Scale: ', bounds.projection().nominalScale().multiply(scale))

  return {scale: scale, bounds: bounds}  
}

var params = generateExportParameters(Map.getBounds(true), 1920, 1080)

print(params)
Map.addLayer(params.bounds)
print(Map.getBounds(true))

print(JSON.stringify(params.bounds.getInfo()))