/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([-116.13647460937494, 40.21663547539124]),
    dem = ee.Image("USGS/NED");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function generateGrid(origin, dx, dy, scale, proj) {
  var scale = scale || Map.getScale()
  
  var coords = origin.transform(proj).coordinates()
  origin = ee.Image.constant(coords.get(0)).addBands(ee.Image.constant(coords.get(1)))

  var pixelCoords = ee.Image.pixelCoordinates(proj)

  var grid = pixelCoords
     .subtract(origin)
     .divide([dx, dy]).floor()
     .toInt().reduce(ee.Reducer.sum()).bitwiseAnd(1).rename('grid')

  var xy = pixelCoords.reproject(proj.translate(coords.get(0), coords.get(1)).scale(dx, dy))

  var id = xy.multiply(ee.Image.constant([1, 1000000])).reduce(ee.Reducer.sum()).rename('id')

  return grid
    .addBands(id)
    .addBands(xy)
}


// var proj = ee.Projection('EPSG:3857')
// var dx = scale * 100
// var dy = scale * 100

// var proj = ee.Projection('EPSG:4326')
// var dx = 3
// var dy = 3

var proj = ee.Projection('PROJCS["MODIS Sinusoidal",GEOGCS["WGS 84",DATUM["WGS_1984",SPHEROID["WGS 84",6378137,298.257223563,AUTHORITY["EPSG","7030"]],AUTHORITY["EPSG","6326"]],PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],UNIT["degree",0.01745329251994328,AUTHORITY["EPSG","9122"]],AUTHORITY["EPSG","4326"]],PROJECTION["Sinusoidal"],PARAMETER["false_easting",0.0],PARAMETER["false_northing",0.0],PARAMETER["central_meridian",0.0],PARAMETER["semi_major",6371007.181],PARAMETER["semi_minor",6371007.181],UNIT["m",1.0],AUTHORITY["SR-ORG","6974"]]')
var dx = 100000
var dy = 100000

// generate grid
// var origin = ee.Geometry.Point([0, 0])
var origin = geometry
var scale = Map.getScale()
var grid = generateGrid(origin, dx, dy, scale, proj, true)

Map.addLayer(grid.select('grid'), {min: 0, max: 1}, 'grid', true, 0.5)
Map.addLayer(grid.select('id').randomVisualizer(), {}, 'grid', false, 0.5)

// zonal statistics
var region = Map.getBounds(true)

// zonal statistics
var stats = dem.addBands(grid.select('id', 'x', 'y')).reduceRegion({
  reducer: ee.Reducer.mean().repeat(3).group({
    groupField: 3,
    groupName: 'id',
  }),
  geometry: region,
  scale: scale,
  maxPixels: 1e8
});

// Print the resultant Dictionary.
print(stats);