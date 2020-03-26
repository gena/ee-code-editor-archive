var fc = ee.FeatureCollection('ft:1YQ1qpXis4Z9z0NvKLdz-FjxFP5q2_fABi6aNSFn0');

var mapBasins = fc.filterBounds(Map.getBounds(true))

Map.addLayer(mapBasins)

print(mapBasins)