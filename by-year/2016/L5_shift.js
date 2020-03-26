/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8toa = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    l5toa = ee.ImageCollection("LANDSAT/LT5_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
l5toa = l5toa.select([4,3,1])
l8toa = l8toa.select([5,4,2])

print(l5toa.first())
print(l8toa.first())

Map.addLayer(l8toa.filterDate('2015-01-01', '2016-01-01').reduce(ee.Reducer.percentile([15])), {min:0.05, max:0.3}, '2016 l8toa')
Map.addLayer(l5toa.filterDate('1999-01-01', '2005-01-01').reduce(ee.Reducer.percentile([15])), {min:0.05, max:0.3, opacity: 0.7}, '1999 l5toa')
