var str = ee.Blob('gs://hydro-earth-v2/hello.geojson').string()

var features = str.split('{ "type": "Feature", ', 'g').slice(1).map(function(f) {
  var parts = ee.String(f).split("geometry\": { \"type\": ")
  
  // parse properties
  var properties = ee.String(parts.get(0))
  
  // parse geometry
  var geometry = ee.String(parts.get(1))
  var coords = ee.String(geometry.split('"coordinates": ').get(1)).slice(0, -5)

  var rings = coords
    .slice(1).slice(0, -1) // brackets
    .split('\\[ \\[', 'g') // rings
    .slice(1).map(function(s) {
      var points = ee.String(s)
      .replace('\\[ ', '', 'g').split('\\], ').slice(1).map(function(s) { // coords
        var xy = ee.String(s).replace('[\\]\\}]', '', 'g').split(',')
        
        var x = ee.Number.parse(xy.get(0))
        var y = ee.Number.parse(xy.get(1))
        
        return [x, y]
      })
    
      return points
    })
    
  var geom = ee.Algorithms.GeometryConstructors.Polygon(rings)
  
  return ee.Feature(geom)
})

var fc = ee.FeatureCollection(features)

Map.addLayer(fc)
