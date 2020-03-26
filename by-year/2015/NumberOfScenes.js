/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l7 = ee.ImageCollection("LANDSAT/LE7"),
    l5 = ee.ImageCollection("LANDSAT/LT5_L1T"),
    l4 = ee.ImageCollection("LANDSAT/LT4_L1T"),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T"),
    l3 = ee.ImageCollection("LANDSAT/LM3_L1T"),
    l2 = ee.ImageCollection("LANDSAT/LM2_L1T"),
    l1 = ee.ImageCollection("LANDSAT/LM1_L1T");
/***** End of imports. If edited, may not auto-convert in the playground. *****/


var printSceneCount = function(year) {
    print(year)
    print(l1.filterDate(year.toString(), (year+1).toString()).aggregate_count('DATE_ACQUIRED'))
    print(l2.filterDate(year.toString(), (year+1).toString()).aggregate_count('DATE_ACQUIRED'))
    print(l3.filterDate(year.toString(), (year+1).toString()).aggregate_count('DATE_ACQUIRED'))
    print(l4.filterDate(year.toString(), (year+1).toString()).aggregate_count('DATE_ACQUIRED'))
    print(l5.filterDate(year.toString(), (year+1).toString()).aggregate_count('DATE_ACQUIRED'))
    print(l7.filterDate(year.toString(), (year+1).toString()).aggregate_count('DATE_ACQUIRED'))
    print(l8.filterDate(year.toString(), (year+1).toString()).aggregate_count('DATE_ACQUIRED'))
}

//printSceneCount(1972)
//printSceneCount(1999)
//printSceneCount(2014)

var countScenes = function(y) {
  var current = ee.String(ee.Number(y).toInt());
  var next = ee.String(ee.Number(y).add(1).toInt());
  var properties = {
    year: y,
    l1 : l1.filterDate(current, next).aggregate_count('DATE_ACQUIRED'),
    l2 : l2.filterDate(current, next).aggregate_count('DATE_ACQUIRED'),
    l3 : l3.filterDate(current, next).aggregate_count('DATE_ACQUIRED'),
    l4 : l4.filterDate(current, next).aggregate_count('DATE_ACQUIRED'),
    l5 : l5.filterDate(current, next).aggregate_count('DATE_ACQUIRED'),
    l7 : l7.filterDate(current, next).aggregate_count('DATE_ACQUIRED'),
    l8 : l8.filterDate(current, next).aggregate_count('DATE_ACQUIRED')
  }
  
  return ee.Feature(null, properties);
}

print(countScenes(1972))

var years = ee.List.sequence(1972, 2016);

var features = ee.FeatureCollection(years.map(countScenes))

Export.table(features)

/*  count.push([
    y,
    l4.filterDate(y.toString(), (y+1).toString()).aggregate_count('DATE_ACQUIRED').getInfo(),
    l5.filterDate(y.toString(), (y+1).toString()).aggregate_count('DATE_ACQUIRED').getInfo(),
    l7.filterDate(y.toString(), (y+1).toString()).aggregate_count('DATE_ACQUIRED').getInfo(),
    l8.filterDate(y.toString(), (y+1).toString()).aggregate_count('DATE_ACQUIRED').getInfo(),
  ])

print(JSON.stringify(count))*/