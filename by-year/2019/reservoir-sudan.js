/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var images = ee.ImageCollection("COPERNICUS/S2"),
    dem = ee.Image("JAXA/ALOS/AW3D30_V1_1"),
    geometry = /* color: #d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var bounds = ee.Geometry(Map.getBounds(true))
var scale = Map.getScale()

var hs = ee.Terrain.hillshade(dem, 315, 35)
Map.addLayer(hs, {min: 130, max: 160}, 'hs')

var i = images
  .filterDate('2018-01-01', '2018-03-01')
  .filterBounds(bounds)
  .select(['B12','B8','B3'])
  
print(i.size())  
  
i = i  
  .reduce(ee.Reducer.percentile([10]))
  .divide(10000)
  .rename(['swir', 'nir', 'green'])
  

  
Map.addLayer(i, {min: 0.05, max: 0.25}, '10%')

var water = i.normalizedDifference(['green', 'nir']).gt(0)

Map.addLayer(ee.Image(1).mask(water), {palette: ['3182bd']}, 'water', true, 0.5)
  
var demWater = dem.updateMask(water)

print(ui.Chart.image.histogram(demWater.select('MED'), bounds, scale * 2, 100))