var n = 10
var loop = ee.List.sequence(0, n).getInfo()
var times = []

// client-side profiling
function profile(f, i) {
  var t0 = new Date()
  
  f.getInfo(function(f) {
    var t1 = new Date()
    
    var elapsed = t1.getTime() - t0.getTime()
    
    times.push(elapsed)

    if(i === n) {
        print(ui.Chart.array.values(times, 0))
    }
  })
  
  return f
}

// client-side delay
function delay(millis) {
  var before = Date.now();
  while (Date.now() < before + millis) {};
}

// server-side function
function f(i) {
  var image = ee.Image(ee.ImageCollection('LANDSAT/LC8_L1T_TOA').first())
  var value = image.reduceRegion(image.geometry().centroid())

  profile(value, i)
}

// 1. call function n times
loop.map(function(i) {
  f(i)
})

return

delay(5000)

// 2. call function n times with delay
loop.map(function(i) {
  f(i)
})
