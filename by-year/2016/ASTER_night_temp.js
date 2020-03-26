var image = ee.Image('ASTER/AST_L1T_003/20050724060659')
var image = ee.Image('ASTER/AST_L1T_003/20060929060700')
Map.addLayer(image.select('B12'), {min:500, max:1800})

