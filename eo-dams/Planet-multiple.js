/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var imageCollection = ee.ImageCollection("users/gena/eo-dams/Planet-Feijao-dam"),
    geometry = /* color: #d63000 */ee.Geometry.MultiPoint(
        [[-44.12022302724665, -20.11997556335665],
         [-44.12106524087733, -20.12136578328207],
         [-44.12147830106562, -20.117802060703667]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// print(imageCollection)

Map.centerObject(geometry, 17)

imageCollection = imageCollection.map(function(i) {
  var label = i.date().format()
  
  var coefs = [
    i.get('reflectance_coefficient_b1'),
    i.get('reflectance_coefficient_b2'),
    i.get('reflectance_coefficient_b3'),
    i.get('reflectance_coefficient_b4')
  ]
  
  i = i.resample('bicubic')
  
  var s = Map.getScale()
  var r = 2 * s
  var f = s
  i = i.subtract(i.convolve(ee.Kernel.gaussian(r, f, 'meters')).convolve(ee.Kernel.laplacian8(1))) // LoG
  
  
  i = i.multiply(ee.Image.constant(coefs))
  
  var water = i.normalizedDifference(['b2', 'b4']).unitScale(-0.25, 0.15).clamp(0, 1)
  
  var offset = ee.Image([0, i.select('b4').multiply(0.05), water.multiply(0.1)])
  
  var isEmpty = i.select(0).mask().reduceRegion(ee.Reducer.allNonZero(), geometry, 3).values().get(0)
  
  return i.select(['b3', 'b2', 'b1']).add(offset)
    .set({ isEmpty: isEmpty })
    .set({ label: label })
})

//print(imageCollection)
imageCollection = imageCollection.filter(ee.Filter.eq('isEmpty', 1))

var a = require('users/gena/packages:animation')

a.animate(imageCollection, { vis: { 
    bands: ['b3', 'b2', 'b1'],
    min: 0.08, 
    max: 0.15
  },
  label: 'label'
})