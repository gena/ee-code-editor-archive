/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var class1_1 = /* color: #98ff00 */ee.Geometry.Polygon(
        [[[-111.533203125, 37.03215840295834],
          [-114.2578125, 38.008066185425335],
          [-116.3671875, 36.75098882435508],
          [-115.48828125, 35.54451854272813]]]),
    class1_2 = /* color: #0b4a8b */ee.Geometry.Polygon(
        [[[-108.896484375, 33.80996124558631],
          [-110.21484375, 36.468785080411344],
          [-112.32421875, 36.468785080411344],
          [-113.02734375, 34.53710627387901]]]),
    class2_1 = /* color: #ffc82d */ee.Geometry.Polygon(
        [[[-112.1484375, 35.90128747814897],
          [-115.400390625, 37.66099365286694],
          [-116.19140625, 33.444047234512354]]]),
    class2_2 = /* color: #00ffff */ee.Geometry.Polygon(
        [[[-111.26953125, 32.03951245042539],
          [-108.896484375, 33.88295731069692],
          [-111.4453125, 36.32729635065908],
          [-114.2578125, 33.15019961880554]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var image1 = ee.Image().int()
  .paint(class1_1, 1)
  .paint(class1_2, 2)
  
var image1q = ee.Image().int().rename('quality')
  .paint(class1_1, 100)
  .paint(class1_2, 90)  
  
var image2 = ee.Image().int()
  .paint(class2_1, 3)
  .paint(class2_2, 4)  

var image2q = ee.Image().int().rename('quality')
  .paint(class2_1, 90)
  .paint(class2_2, 70)  
  
Map.addLayer(image1, {min:1, max:2, palette: ['ff0000', '00ff00']}, 'image1')
Map.addLayer(image2, {min:3, max:4, palette: ['0000ff', 'ffff00']}, 'image2')


var combined = ee.ImageCollection([
      image1.unmask().addBands(image1q.unmask()),
      image2.unmask().addBands(image2q.unmask())
  ])


var combined = combined.qualityMosaic('quality').select(0)
Map.addLayer(combined.mask(combined.neq(0)), {min:1, max:4, palette: ['ff0000', '00ff00', '0000ff', 'ffff00']}, 'combined')
