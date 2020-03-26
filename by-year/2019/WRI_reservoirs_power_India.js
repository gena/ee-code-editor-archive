/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var reservoirs = ee.FeatureCollection("users/gena/eo-reservoirs/waterbodies-reservoirs"),
    countries = ee.FeatureCollection("USDOS/LSIB_SIMPLE/2017"),
    power_plants = ee.FeatureCollection("WRI/GPPD/power_plants");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var india = countries.filter(ee.Filter.eq('country_na', 'India'))
Map.addLayer(india, {}, 'India')
Map.addLayer(power_plants.style({ pointSize: 2 }), {}, 'power plants')

// take reservoirs with A < 10km^2
reservoirs = reservoirs.filter(ee.Filter.lt('Lake_area', 10))

// EE filterBounds() seems to be broken (or country geometries), so use spatial join for filtering (slow)
var filter = ee.Filter.intersects({ leftField: '.geo', rightField: '.geo', maxError: 100 })
var reservoirsIndia = ee.Join.saveAll({ matchesKey: 'country' })
  .apply(reservoirs, india, filter)
  .filter(ee.Filter.neq('country', null))

print('Number of reservoirs in India in Deltares DB (A<10km^2):', reservoirsIndia.size())

Map.addLayer(reservoirsIndia.style({ color: '00ffff', fillColor: '00ffff33', width: 1 }), {}, 'reservoirs india')

print(ui.Chart.feature.histogram(reservoirsIndia, 'Lake_area', 100))
