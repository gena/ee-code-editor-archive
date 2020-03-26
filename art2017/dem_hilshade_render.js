var image = ee.Image("LE7_TOA_1YEAR/2014");
Map.addLayer(image, {min:0, max: 100, bands: ["B3", "B2", "B1"]})

var hillshade = ee.Terrain.hillshade(ee.Image("srtm90_v4"))
image = image.add(hillshade.int().subtract(180))

Map.addLayer(image, {min:0, max: 100, bands: ["B3", "B2", "B1"]})