/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_SR"),
    l8toa = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var percentiles = ee.List.sequence(0, 100, 1)

var percentilesSR = l8.select(['B6', 'B5', 'B3']).reduce(ee.Reducer.percentile(percentiles))
Map.addLayer(percentilesSR, {}, 'percentiles SR', false)

var percentilesTOA = l8toa.select(['B6', 'B5', 'B3']).reduce(ee.Reducer.percentile(percentiles))
Map.addLayer(percentilesTOA, {}, 'percentiles TOA', false)

l8 = l8
  .select(['B6', 'B5', 'B3'])

var count = l8.select(0).count()

l8 = l8.map(function(f) { return f.updateMask(count.gt(10)).unitScale(0, 30000)})

var vis = {min: 0.01, max:0.3, gamma:1.5}

Map.addLayer(count, {min: 0, max:100}, 'count')
Map.addLayer(l8.reduce(ee.Reducer.percentile([5])), vis, '5%')
Map.addLayer(l8.reduce(ee.Reducer.percentile([10])), vis, '10%')
Map.addLayer(l8.reduce(ee.Reducer.percentile([20])), vis, '20%')


l8toa = l8toa
  .select(['B6', 'B5', 'B3'])

var count = l8toa.select(0).count()

l8toa = l8toa.map(function(f) { return f.updateMask(count.gt(10))})

var vis = {min: 0.01, max:0.3, gamma:0.8}

Map.addLayer(count, {min: 0, max:100}, 'count')
Map.addLayer(l8toa.reduce(ee.Reducer.percentile([5])), vis, 'TOA 5%')
Map.addLayer(l8toa.reduce(ee.Reducer.percentile([10])), vis, 'TOA 10%')
Map.addLayer(l8toa.reduce(ee.Reducer.percentile([20])), vis, 'TOA 20%')