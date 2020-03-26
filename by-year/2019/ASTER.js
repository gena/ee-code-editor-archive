var image = ee.Image('ASTER/AST_L1T_003/20160120185720')

print(image)

Map.addLayer(image, {}, 'aster')

//  http://www.pancroma.com/downloads/ASTER%20Temperature%20and%20Reflectance.pdf
//  https://lpdaac.usgs.gov/sites/default/files/public/product_documentation/aster_l1t_users_guide.pdf

var Aster = {
  temperature: {
    fromDN: function(image) {
      var bands = ['B10', 'B11', 'B12', 'B13', 'B14']
      var multiplier = ee.Image([0.006822, 0.006780, 0.006590, 0.005693, 0.005225])
      var k1 = ee.Image([3040.136402, 2482.375199, 1935.060183, 866.468575, 641.326517])
      var k2 = ee.Image([1735.337945, 1666.398761, 1585.420044, 1350.069147, 1271.221673])
  
      var radiance = image.select(bands).subtract(1).multiply(multiplier)
      var t = k2.divide(k1.divide(radiance).add(1).log())
      
      return t
    }
  }
}

var temperaturePalette = ['0571b0', '92c5de', 'f7f7f7', 'f4a582', 'ca0020']

var t = Aster.temperature.fromDN(image)
print(ui.Chart.image.histogram(t, ee.Geometry(Map.getBounds(true)), Map.getScale()))
Map.addLayer(t.select(0), {
  min: 273.15 - 20, max: 273.15 + 45, 
  palette: temperaturePalette
}, 'ASTER temperature')

