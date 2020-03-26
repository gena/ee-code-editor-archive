var stationsGRDC = ee.FeatureCollection('ft:1sLCtbxs9GWGMWq8JAJL1ivn8lQ5pVuZRdHgRdiSS')

Map.addLayer(stationsGRDC, {}, 'stations (GRDC)')

print(stationsGRDC)