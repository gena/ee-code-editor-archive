var image = ee.Image("LE7_TOA_1YEAR/2014").select(["B3", "B2", "B1"]);
Map.addLayer(image, {min:0, max: 100, bands: ["B3", "B2", "B1"]})

var hillshade = ee.Terrain.hillshade(ee.Image("srtm90_v4"))
var image1 = image.add(hillshade.int().subtract(180))
Map.addLayer(image1, {min:0, max: 100})

var weight = 0.5
var hsv = image.unitScale(0, 100).rgbToHsv()
var intensity = hsv.select('value').multiply(ee.Image(1).toFloat().subtract(weight))
  .add(hillshade.unitScale(50,255).multiply(weight))
var image2 = ee.Image.cat(hsv.select('hue', 'saturation'), intensity).hsvtorgb()
Map.addLayer(image2, {min:0.3, max: [0.9,0.9,1]})
