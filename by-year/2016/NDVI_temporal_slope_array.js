Map.setCenter(11.75, 45.5, 9);

// Define start and finish date of interest 
var start = ee.Date('2015-01-01');
var finish = ee.Date('2016-12-31');

var poly = ee.Geometry.Rectangle(11.464233419392258, 45.909307934788764,
                                 12.425537109375, 46.307289598592085)

// Filter collection based on geomtry, date
var filteredCollection = ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
  .filterBounds(poly)
  .filter(ee.Filter.lt('CLOUD_COVER',70))
  .filterDate(start, finish);
  
var p192_28 = filteredCollection
  .filterMetadata('WRS_PATH', 'equals', 192)
  .filterMetadata('WRS_ROW', 'equals', 28);

// ========================

var ndvi = p192_28.sort('system:start_time')
  .map(function(i) { return i.normalizedDifference(['B5', 'B4'])})
  
var arr = ndvi.toArray();

var slope3 = arr.arraySlice(0, 1).subtract(arr.arraySlice(0, 0, -1)).arrayProject([0]) // diff
  .arrayReduce(ee.Reducer.mean(), [0]).arrayFlatten([['slope']]) // slope


// fix slope mask
slope3 = slope3
  .mask(ndvi.map(function(i) { return i.mask().not(); }).reduce(ee.Reducer.anyNonZero()).not())

Map.addLayer(slope3, {min:-0.05, max:0.05}, 'slope3')






