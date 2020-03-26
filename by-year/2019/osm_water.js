/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var table = ee.FeatureCollection("users/gena/OpenStreetMap/waterways"),
    table2 = ee.FeatureCollection("users/gena/OpenStreetMap/water"),
    basins = ee.Image("users/gena/HydroBASINS_by_rivers_NE"),
    rivers = ee.FeatureCollection("users/gena/ne_10m_rivers_lake_centerlines_scale_rank"),
    reservoirPoints = ee.FeatureCollection("users/gena/eo-reservoirs/waterbodies-points-reservoirs"),
    basinsAqueduct = ee.FeatureCollection("users/gena/Aqueduct_basins");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.addLayer(reservoirPoints.style({width: 0, color: 'ffffff', pointSize: 1}), {}, 'reservoirs', false, 0.8)
Map.addLayer(basinsAqueduct, { color: 'black' }, 'basins Aqueduct', true)
Map.addLayer(basins, {}, 'NE (raw)', false)
Map.addLayer(basins.randomVisualizer(), {}, 'NE', false, 0.5)
Map.addLayer(reservoirPoints.style({width: 0, color: 'ffffff', pointSize: 1}), {}, 'reservoirs', true, 0.8)
Map.addLayer(rivers.style({color: '00ffff', width: 1}), {}, 'rivers NE', true)
Map.setOptions('SATELLITE')

// print(table.limit(100))
// print(table2.limit(100))

// print(ee.List(table.aggregate_array('fclass')).distinct())
// print(ee.List(table2.aggregate_array('fclass')).distinct())

// Map.addLayer(table.filter(ee.Filter.or(ee.Filter.eq('fclass', 'stream'), ee.Filter.eq('fclass', 'stre'), ee.Filter.eq('fclass', 'drain')).not()).style({color: '00ffff', width: 1}), {}, 'waterway', false)

// Map.addLayer(table2.filter(ee.Filter.eq('fclass', 'reservoir')).style({color: '0000ff', fillColor: '0000ff33', width: 1}), {}, 'reservoir', false)
// print('reservoirs', table2.filter(ee.Filter.eq('fclass', 'reservoir')).size())

// Map.addLayer(table.filter(ee.Filter.eq('fclass', 'stre').style({color: '00ffff', width: 1})), 'stre')
// Map.addLayer(table2.filter(ee.Filter.eq('fclass', 'river').style({color: '00ffff', width: 1})))


