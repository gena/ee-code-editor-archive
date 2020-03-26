/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var monthlyWater = ee.ImageCollection("JRC/GSW1_0/MonthlyHistory");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
print(monthlyWater.first())

var water2010 = monthlyWater.filterDate('2010-01-01', '2011-01-01').mean()
Map.addLayer(water2010.mask(water2010), {palette:['ffffff', '0000ff']}, '2010-2011')

var water2013 = monthlyWater.filterDate('2013-01-01', '2014-01-01').mean()
Map.addLayer(water2013.mask(water2013), {palette:['ffffff', '0000ff']}, '2013-2014')

var water2014 = monthlyWater.filterDate('2014-01-01', '2015-01-01').mean()
Map.addLayer(water2014.mask(water2014), {palette:['ffffff', '0000ff']}, '2014-2015')
