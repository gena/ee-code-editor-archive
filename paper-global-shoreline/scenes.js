/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var table = ee.FeatureCollection("users/gena/eo-bathymetry/osm-coastline"),
    l4 = ee.ImageCollection("LANDSAT/LT04/C01/T1_TOA"),
    l5 = ee.ImageCollection("LANDSAT/LT05/C01/T1_TOA"),
    l7 = ee.ImageCollection("LANDSAT/LE07/C01/T1_RT_TOA"),
    l8 = ee.ImageCollection("LANDSAT/LC08/C01/T1_RT_TOA"),
    gridCoastline = ee.FeatureCollection("users/gena/eo-bathymetry/global_coastline_grid_3x2_1"),
    gridAll = ee.FeatureCollection("users/gena/global_grid");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var palettes = require('users/gena/packages:colorbrewer').Palettes

// var bounds = table
var bounds = gridCoastline

Map.addLayer(bounds)

function computeCount(images, name) {
 images = images
    .select(0)
    .filterBounds(bounds)

  print(name, images.size())

  var count = images
    .count()
    
  Export.table.toDrive({
    collection: ee.FeatureCollection([ee.Feature(null, {name: name, size: images.size()})]),
    description: name + 'count',
    fileFormat: 'CSV'
  })
    
  Map.addLayer(count, {min: 0, max: 1000, palette: palettes.RdYlGn[9]}, name + ' count')
}

computeCount(l4, 'l4')
computeCount(l5, 'l5')
computeCount(l7, 'l7')
computeCount(l8, 'l8')


print(gridCoastline.size().divide(gridAll.size()))