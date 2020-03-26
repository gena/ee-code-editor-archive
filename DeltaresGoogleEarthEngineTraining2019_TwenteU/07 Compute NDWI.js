var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    dam = /* color: d63000 */ee.Geometry.Point([65.50529479980469, 38.33761692801908]);

Map.centerObject(dam, 12)

var image = ee.Image(l8
  .filterBounds(Map.getCenter())
  .filterMetadata('CLOUD_COVER', 'less_than', 15)
  .select(['B6','B5','B3'])
  .toList(1, 10).get(0))
  
Map.addLayer(image, {min: 0.05, max: 0.5}, 'landsat 8')  

// add NDWI masked values
var ndwi = image.normalizedDifference(['B3', 'B6'])
Map.addLayer(ndwi.mask(ndwi), {palette:['000055', '0000ff'], opacity: 0.5}, 'water mask')

// show water edge
var edge = ee.Algorithms.CannyEdgeDetector(ndwi, 0.99)
Map.addLayer(edge.mask(edge), {palette:['ffffff']}, 'reservoir edge')



// TODO: check changes around Twente University in Aqua Monitor with extra options:
// http://aqua-monitor.appspot.com/?mode=dynamic&from=2000&to=2017&view=52.23958515709845,6.834585182425323,14z&water_slope_opacity=0.5&averaging_months1=24&averaging_months2=24&min_year=1985
