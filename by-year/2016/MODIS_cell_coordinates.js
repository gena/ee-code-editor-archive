/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var images = ee.ImageCollection("MODIS/MYD09GA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// get a single MODIS image
var image = ee.Image(images.first()).select(['sur_refl_b06', 'sur_refl_b02', 'sur_refl_b01'])
Map.addLayer(image, {min: 200, max: 6000})

// generate a new image containing lat/lon of the pixel and reproject it to MODIS projection
var coordsImage = ee.Image.pixelLonLat().reproject(image.projection())

// extract lat/lon coordinates as a list
var coordsList = coordsImage.reduceRegion({
  reducer: ee.Reducer.toList(2), 
  geometry: Map.getBounds(true)
}).values().get(0)

coordsList = ee.List(coordsList)

print(coordsList)

// convert coordinates to points and add to map
var coordsPoints = coordsList.map(function(xy) {
  var geom = ee.Algorithms.GeometryConstructors.Point(xy)
  
  return ee.Feature(geom, {})
})

coordsPoints = ee.FeatureCollection(coordsPoints)

Map.addLayer(coordsPoints)

