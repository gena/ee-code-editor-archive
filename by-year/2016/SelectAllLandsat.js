// define image collections for LANDSAT 5, 7, and 8
var l5 = ee.ImageCollection('LANDSAT/LT5_L1T_TOA').select(['B3', 'B2', 'B1'], ['red', 'green', 'blue'])
var l7 = ee.ImageCollection('LANDSAT/LE7_L1T_TOA').select(['B3', 'B2', 'B1'], ['red', 'green', 'blue'])
var l8 = ee.ImageCollection('LANDSAT/LC8_L1T_TOA').select(['B4', 'B3', 'B2'], ['red', 'green', 'blue'])

// merge
var images = ee.ImageCollection(l5.merge(l7).merge(l8))

// filter images by path/row
images = images.filter(ee.Filter.and(ee.Filter.eq('WRS_PATH', 96), ee.Filter.eq('WRS_ROW', 71)))

// print
print(images.size())  

// show count and first
Map.addLayer(images.select(0).count(), {min: 0, max: 800, palette:['d7191c', '1a9641']}, 'count', false)
Map.addLayer(ee.Image(images.first()), {min: 0.05, max:0.3}, 'first')
