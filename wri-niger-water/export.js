var outlet = /* color: #d63000 */ee.Geometry.Point([-2.684560401409044, 16.732788605838515]);

var hydro = require('users/gena/packages:hydro')

var c = hydro.Map.addCatchments({ outlet: outlet, layer: { name: 'catchments', opacity: 0.5, color: 'yellow' } })

Export.table.toAsset({
  collection: c, 
  description: 'Niger_catchments_vector_l06', 
  assetId: 'users/gena/water_niger/catchments_vector_l06'
})

var rivers = ee.FeatureCollection('users/gena/HydroEngine/riv_15s_lev05')
  .filterBounds(c.geometry())
  
Export.table.toAsset({
  collection: rivers, 
  description: 'Niger_rivers', 
  assetId: 'users/gena/water_niger/rivers_vector'
})

var catchmentsImage = ee.Image().int().paint(c, 'hybas_id')

Map.addLayer(catchmentsImage.randomVisualizer(), {}, 'catchments (image)')

function addCatchments(level, edgesOnly) {
  // Rasterized geometries on PFAF12 
  // Author: rutgerhofste@gmail.com
  var HydroBASINSimage = ee.Image("users/rutgerhofste/PCRGlobWB20V04/support/global_Standard_lev00_30sGDALv01");

  var catchments = HydroBASINSimage.divide(ee.Number(10).pow(ee.Number(12).subtract(level))).floor();
  catchments = catchments.unmask().focal_mode(900, 'circle', 'meters')
  
  var edges = ee.Algorithms.CannyEdgeDetector(catchments, 0.99, 0)//.focal_max(1).focal_mode(1)
  edges = edges.mask(edges)

    var name = 'catchments (level ' + level + ')'

  Map.addLayer(catchments, {}, name + ' raw', false)
  
  // export
  var catchmentsVector = catchments.int().reduceToVectors({
    // geometry: Map.getBounds(true), 
    geometry: c.geometry(), 
    scale: 90, 
    eightConnected: true, 
    labelProperty: 'b1', 
    tileScale: 4
  })
  
  Export.table.toAsset({
    collection: catchmentsVector, 
    description: 'Niger_catchments_vector_l08', 
    assetId: 'users/gena/water_niger/catchments_vector_l08'
  })
  
  //Map.addLayer(catchmentsVector)

  catchments = catchments.randomVisualizer().select([0, 1, 2])
  
  // var palette = ["a6cee3","1f78b4","b2df8a","33a02c","fb9a99","e31a1c","fdbf6f","ff7f00","cab2d6"]
  // catchments = catchments.mod(palette.length).visualize({min: 0, max: palette.length-1, palette: palette})

  if(edgesOnly) {
    Map.addLayer(edges.visualize({ palette: ['ffffff'], forceRgbOutput: true }), {}, 'catchments (edges, level ' + level + ')', false)
  } else {
    
    // addDem(catchments.blend(edges.visualize({ palette: ['ffffff'], forceRgbOutput: true })), name + ' + DEM', 0.75)

    Map.addLayer(catchments.blend(edges.visualize({ palette: ['ffffff'], forceRgbOutput: true })), {}, name, true, 0.5)
  }
}

addCatchments(8, false)

Map.addLayer(rivers, {color: 'cyan'}, 'rivers')  


// wflow layers
var wflow = {
  rivers: ee.FeatureCollection('users/gena/water-niger/wflow/rivers'),
  riversMask: ee.Image('users/gena/water-niger/wflow/wflow_river'),
  catchments: ee.FeatureCollection('users/gena/water-niger/wflow/catchments'),
}

Map.addLayer(wflow.catchments, {}, 'wflow, catchments')
Map.addLayer(wflow.riversMask, { palette: ['yellow'] }, 'wflow, rivers (raster)')
Map.addLayer(wflow.rivers.style({ color: 'cyan' }), {}, 'wflow, rivers')
