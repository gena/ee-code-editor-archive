var generateGrid = function(bounds, dx, dy) {
  var lon_start = bounds[0][0];
  var lon_end = bounds[1][0];
  var lat_start = bounds[0][1];
  var lat_end = bounds[2][1];
  
/*  var polys = [];
  for (var lon = lon_start; lon < lon_end; lon += dx) {
    var x1 = lon - dx/2;
    var x2 = lon + dx/2;
    for (var lat = lat_start; lat < lat_end; lat += dy) {
      var y1 = lat - dy/2;
      var y2 = lat + dy/2;
      polys.push(ee.Geometry.Rectangle(x1, y1, x2, y2));
    }
  }
*/
  var lons = ee.List.sequence(lon_start, lon_end, dx)
  var lats = ee.List.sequence(lat_start, lat_end, dy)
  var polys = lons.map(function(lon) {
    return lats.map(function(lat) {
      var x1 = ee.Number(lon).subtract(ee.Number(dx).multiply(0.5))
      var x2 = ee.Number(lon).add(ee.Number(dx).multiply(0.5))
      var y1 = ee.Number(lat).subtract(ee.Number(dy).multiply(0.5))
      var y2 = ee.Number(lat).add(ee.Number(dy).multiply(0.5))
      
      var coords = ee.List([x1, y1, x2, y2]);
      var rect = ee.Algorithms.GeometryConstructors.Rectangle(coords);
      return ee.Feature(rect)
    })
  }).flatten();

  return ee.FeatureCollection(polys);
}


var aoi = ee.FeatureCollection('ft:13dShZ5yGqCEqk3dsJvYEL3lsa1hEmpMRldxK7aSa') // Asia, level 3
.filter(ee.Filter.or(
        ee.Filter.eq('PFAF_ID', 442), // Mekong
        ee.Filter.eq('PFAF_ID', 441), // Ho Chi Minh
        ee.Filter.eq('PFAF_ID', 443) // Thailand
        )).geometry();
  
/* larger catchment
    .filter(ee.Filter.and(
        ee.Filter.gte('PFAF_ID', 440),
        ee.Filter.lte('PFAF_ID', 449))).union().first()).geometry();
*/

Map.addLayer(aoi)
Map.centerObject(aoi)
var bounds = aoi.bounds().coordinates().get(0).getInfo()

print(bounds)

// grid used to perform water mask analysis 
var grid = generateGrid(bounds, 0.2, 0.2).filterBounds(aoi);

Map.addLayer(grid)
//Map.addLayer(ee.Image(0).paint(grid, 1))
Export.table(grid, 'grid_analysis_Mekong', {driveFileNamePrefix: 'grid_analysis_Mekong', fileFormat: 'KML'})

print(grid.aggregate_count('system:index'))

// grid used to re-tile HAND
/*
var grid = generateGrid(bounds, 2, 2).filterBounds(aoi);
Map.addLayer(grid)
Export.table(grid, 'grid_tiles_Mekong', {driveFileNamePrefix: 'grid_tiles_Mekong', fileFormat: 'KML'})
*/


