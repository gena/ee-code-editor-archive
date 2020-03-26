var wflow = {
  rivers: ee.FeatureCollection('users/gena/water-niger/wflow/rivers'),
  riversMask: ee.Image('users/gena/water-niger/wflow/wflow_river'),
  catchments: ee.FeatureCollection('users/gena/water-niger/wflow/catchments'),
}

Map.addLayer(wflow.catchments, {}, 'catchments')
Map.addLayer(wflow.riversMask, { palette: ['yellow'] }, 'rivers (raster)')
Map.addLayer(wflow.rivers.style({ color: 'cyan' }), {}, 'rivers')
