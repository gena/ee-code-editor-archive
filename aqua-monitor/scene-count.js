var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').select(0);
var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').select(0);
var l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').select(0);
var l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').select(0);

var images = ee.ImageCollection(l8.merge(l7).merge(l5).merge(l4))

//var grid = ee.FeatureCollection('ft:1CH6u9UdsYgU6qsEtbsHxvYBf8ucnflmtbRVeTrU_'); // 4 degrees
var grid = ee.FeatureCollection('ft:1cmASWugzqQBLH93vRf9t7Zvfpx_RvtmVhy8IGd6H') // 3 degrees

grid = grid.map(function(f) {
  var count = images.filterBounds(f.geometry()).aggregate_count('system:time_start')
  return f.set('landsat_scene_count', count)
})

Export.table(grid, 'grid_3degree_landsat_count')