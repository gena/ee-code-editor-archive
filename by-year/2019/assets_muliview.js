/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var aster = ee.ImageCollection("ASTER/AST_L1T_003"),
    s2 = ee.ImageCollection("COPERNICUS/S2"),
    l8 = ee.ImageCollection("LANDSAT/LC08/C01/T1_RT_TOA"),
    l7 = ee.ImageCollection("LANDSAT/LE07/C01/T1_RT_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var assets = require('users/gena/packages:assets')

// TODO: add per-pixel viewer angles from S2, L8
//
// Landsat 8 viewing angle: 
//    https://landsat.usgs.gov/solar-illumination-and-sensor-viewing-angle-coefficient-file


var bounds = ee.Geometry(Map.getBounds(true))
var start = '2010-01-01'
var stop = '2018-01-01'

aster = aster
  .filterBounds(bounds)
  .filterDate(start, stop)  
  .map(function(i) {
    return i.set({
      SUN_ELEVATION: i.get('SOLAR_ELEVATION'),
      SUN_AZIMUTH: i.get('SOLAR_AZIMUTH'),
      MISSION: 'ASTER'
    })
  })
  //.filter(ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B04'))
  .filter(ee.Filter.and(ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B3N'), ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B02')))
  .map(assets.Aster.TOA)

print(aster)

s2 = s2
  .filterBounds(bounds)
  .filterDate(start, stop)  
  .map(function(i) {
    return i.set({
      SUN_ELEVATION: ee.Number(90).subtract(i.get('MEAN_SOLAR_ZENITH_ANGLE')).subtract(5),
      SUN_AZIMUTH: i.get('MEAN_SOLAR_AZIMUTH_ANGLE'),
      MISSION: 'S2'
    })
  })
  .select(['B11', 'B8', 'B4'], ['swir1', 'nir', 'red'])
  .map(function(i) {
    return i.divide(1000).copyProperties(i)
  })
  
print(s2)  

l8 = l8
  .filterBounds(bounds)
  .filterDate(start, stop)  
  .map(function(i) {
    return i.set({
      MISSION: 'L8'
    })
  })
  .select(['B6', 'B5', 'B4'], ['swir1', 'nir', 'red'])

print(l8)

l7 = l7
  .filterBounds(bounds)
  .filterDate(start, stop)  
  .map(function(i) {
    return i.set({
      MISSION: 'L7'
    })
  })
  .select(['B5', 'B4', 'B3'], ['swir1', 'nir', 'red'])

print(l7)

var images = l7.merge(l8).merge(s2).merge(aster)
  
  
print(images)

var chart = ui.Chart.feature.groups(images, 'SUN_AZIMUTH', 'SUN_ELEVATION', 'MISSION')
  .setChartType('ScatterChart')
  .setOptions({
      pointSize: 1,
      hAxis: {
        viewWindow: {
          min: 0,
          max: 360
        }
      },
      vAxis: {
        viewWindow: {
          min: 0,
          max: 90
        }
      }
  })

print(chart)

chart.onClick(function(a, z) {
  var i = images.filter(ee.Filter.and(
      ee.Filter.gt('SUN_AZIMUTH', a-0.001),ee.Filter.lt('SUN_AZIMUTH', a+0.001),
      ee.Filter.gt('SUN_ELEVATION', z-0.001),ee.Filter.lt('SUN_ELEVATION', z+0.001)
  ))
  
  print(i)
  
  Map.addLayer(i.select(['swir1','nir','red']), {min:0.05, max:0.6}, a + ' - ' + z)
})
