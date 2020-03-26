/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
l8 = l8
  .filterBounds(Map.getBounds(true))
  .filter(
      ee.Filter.or(
          ee.Filter.lessThan('SUN_ELEVATION', 5),
          ee.Filter.greaterThan('WRS_ROW', 120)
      )
    )
    
print(l8.size())

Map.addLayer(l8.select([5,4,2]).reduce(ee.Reducer.percentile([20])))

