/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
/***
 * Server-side list stride
 */
function stride_ee(list, start, end, step, size) {
  var indices = ee.List.sequence(start, end, step)
  
  return indices.map(function(i) {
    return ee.List(list).slice(i, ee.Number(i).add(size))
  }).flatten()
}

/***
 * Client-side array stride
 */
function stride(array, start, end, step, size) {
  var result = []
  for(var i=start; i<end; i+=step) {
    for(var j=0; j<size; j++) {
      result.push(array[i+j])
    }
  }
  
  return result
}


//print(stride([1,2,3,4,5], 0, 5, 2, 1))  // [1,3,5]
//print(stride([1,2,3,4,5,6], 0, 6, 3, 2)) // [1,2,4,5]

var count = 10
var bounds = ee.Geometry(Map.getBounds(true))
var scale = Map.getScale()

var images = s2
  .filterBounds(bounds.centroid(1))
  .select(['B4','B3','B2'])
  .toList(count)

ee.List.sequence(0, count-1).getInfo(function(indices) {
  indices.map(function(i) {
    var image = ee.Image(images.get(i))
    
    var minMax = image.reduceRegion(ee.Reducer.percentile([2,98]), bounds.centroid(1).buffer(100), scale)
    
    minMax.values().getInfo(function(minMax) {
      //var min = stride(minMax, 0, 6, 2, 1)
      //var max = stride(minMax, 1, 6, 2, 1)
      
      var min = [300,300,300]
      var max = [2000,2000,3000]

      Map.addLayer(image, {min:min, max:max}, i.toString())
    })
  })
})