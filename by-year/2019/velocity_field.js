/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var uv = ee.ImageCollection("NOAA/NWS/RTMA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var uv0 = ee.Image(uv.select(['UGRD', 'VGRD']).first())

var region = uv0.geometry()
var scale = Map.getScale() * 10
var numPixels = 10000

var samples = uv0.rename(['u', 'v']).sample({
  region: region, 
  scale: scale, 
  numPixels: numPixels, 
  geometries: true
})

var geomUtils = require('users/gena/packages:geometry')

var scaleVector = 0.1

var vectors = samples.map(function(f) {
  var u = ee.Number(f.get('u')).multiply(scaleVector)
  var v = ee.Number(f.get('v')).multiply(scaleVector)
  
  var origin = f.geometry()

  // translate
  var proj = origin.projection().translate(u, v)
  var end = ee.Geometry.Point(origin.transform(proj).coordinates())

  // construct line
  var geom = ee.Algorithms.GeometryConstructors.LineString([origin, end], null, true)
  
  return f.setGeometry(geom)
})

var palettes = require('users/gena/packages:palettes')

Map.addLayer(uv0.pow(2).reduce(ee.Reducer.sum()).sqrt(), { palette: palettes.cmocean.Speed[7].reverse(), min: 0, max: 10 }, 'UV', true)
Map.addLayer(ee.Image(1), { palette: 'black' }, 'black', true, 0.5)
Map.addLayer(vectors.style({ color: 'white', width: 1 }), {}, 'UV (vectors)')
Map.addLayer(samples.style({ pointSize: 1, color: 'red' }), {}, 'UV (samples)', true, 0.5)



