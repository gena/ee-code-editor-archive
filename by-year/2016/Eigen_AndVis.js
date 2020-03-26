/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var images = ee.ImageCollection("LANDSAT/LC8_L1T"),
    pt1 = /* color: #d63000 */ee.Geometry.Point([-122.67089366912842, 45.493081658660095]),
    pt2 = /* color: #98ff00 */ee.Geometry.Point([-122.6567530632019, 45.49160754991878]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function app() {
  // get an image  
  images = images.filterBounds(pt1)
  var image = ee.Image(images.toList(1,2).get(0))  
  
  // get values around geometry
  var bounds = pt1.buffer(100)

  // show bounds
  Map.addLayer(bounds)

  // compute covariance using all pixels within bounds
  // this eventually should be computer on every uber-pixel instead of a vector
  var cov = image.toArray().reduceRegion({
    reducer: ee.Reducer.covariance(),
    geometry: bounds,
    scale: 30
  })
  
  // visualize (symmetric) covariance matrix
  showCovariance(cov, pt2, 30)
}





















/*return
  
print(ee.ImageCollection.fromImages([image]).getRegion(geometry, 10))


print(cov.reduceRegion(ee.Reducer.first(), geometry, 10))

Map.addLayer


*/













function showCovariance(cov, pos, scale) {
  var a = ee.Array(cov.values().get(0))
  var shape = a.length()
  var size = shape.get([0])
  
  var image = ee.Image(a)
  
  // determine step in degrees
  var web = ee.Projection('EPSG:3857')
  var geo = ee.Projection('EPSG:4326 ')

  var coords = pos.transform(web).coordinates()
  var origin = ee.Image.constant(coords.get(0)).addBands(ee.Image.constant(coords.get(1)))

  var grid = ee.Image.pixelLonLat().changeProj(geo, web)
    .subtract(origin)
    .divide(100)
//    .multiply([size, size])
    .toInt()
    //.select(0)
    
    //.multiply([10, 10])
    //.toInt().reduce(ee.Reducer.sum()).bitwiseAnd(1)

  var rgb = grid.select(0).randomVisualizer()
    .add(grid.select(1).randomVisualizer())
    .divide(2)

  Map.addLayer(rgb, {}, 'grid')

}

app()