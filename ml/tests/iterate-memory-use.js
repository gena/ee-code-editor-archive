// test memory use when iterating

// local / servcer looks the same ... logical

var image0 = ee.Image(Math.random()).multiply(ee.Image.pixelLonLat())
var n = 100

function server() {
  var iterations = ee.List.sequence(0, n)
  
  var result = iterations.iterate(function(i, prev) {
    return ee.Image(prev).add(0.01)
  }, image0)
  
  return ee.Image(result)
}

function client() {
  var current = null
  var prev = image0
  for(var i=0; i<n; i++) {
    current = prev.add(0.01)
  
    prev = current
  }
  
  return current
}

//Map.addLayer(client(), {min:-10, max:10})
Map.addLayer(server(), {min:-32, max:32})