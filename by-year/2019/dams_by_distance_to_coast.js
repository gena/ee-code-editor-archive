var rivers = ee.FeatureCollection('users/basins/ne_10m_rivers_lake_centerlines_scale_rank'); 
var coast = ee.FeatureCollection('users/basins/GSHHS_i_L1'); 
var grandDams = ee.FeatureCollection('users/basins/GRanD_dams_v1_3');

// rivers = rivers.filterBounds(Map.getBounds(true))
grandDams = grandDams.filterBounds(Map.getBounds(true))

var minUpSize = 5 // minimum size of upstream catchment
var riversHydro = ee.FeatureCollection('users/gena/HydroRIVERS_v10')
  .filter(ee.Filter.gt('UPLAND_SKM', minUpSize * minUpSize))

Map.addLayer(coast, {}, 'coast')
Map.addLayer(rivers.style({ color: '9ecae1', width: 1.5 }), {}, 'rivers')
Map.addLayer(riversHydro.style({ color: '00ffff55', width: 1 }), {}, 'rivers (HydroRIVERS)')
Map.addLayer(grandDams, {}, 'dams', false)

// Define a spatial filter, with distance of 2 km. 
var distFilter = ee.Filter.withinDistance({ 
  distance: 2000, 
  leftField: '.geo', 
  rightField: '.geo', 
  maxError: 100 }); 

var saveAllJoin = ee.Join.saveBest({ measureKey: 'distance', matchKey: 'river', }); 

var damRiver = saveAllJoin.apply(grandDams, riversHydro, distFilter)
  .map(function(f) {
    return f.set({ DIST_DN_KM: ee.Feature(f.get('river')).get('DIST_DN_KM') })
  })

Map.addLayer(damRiver, { color: 'cyan' }, 'dams (neareast)', false)

// show dams styled by distance to outlow
damRiver = damRiver.map(function(f) {
  var maxDistance = 800 // km
  var maxSize = 8
  var d = ee.Number(f.get('DIST_DN_KM')).divide(maxDistance).multiply(maxSize - 1).int().add(1)
  var style = { pointSize: d, width: 1, color: 'fc9272', fillColor: 'fc9272aa', neighborhood: 10 }
  
  return f.set({ style: style })
})

print(damRiver.aggregate_array('style'))

Map.addLayer(damRiver.style({ styleProperty: 'style', neighborhood: 10 }), {}, 'dams (styled)')

Map.setOptions('SATELLITE')