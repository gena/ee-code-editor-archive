/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var fa = ee.Image("WWF/HydroSHEDS/15ACC"),
    geometry = /* color: d63000 */ee.Geometry.Point([119.56480979919434, 31.243519408729505]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.addLayer(fa.mask(fa.gt(100)))

Map.setCenter(119.55, 31.22, 13)

var reservoirFA = fa.reduceRegion(ee.Reducer.first(), geometry, 100).get('b1')
var area = ee.Number(reservoirFA).multiply(450*450 / 1000000)
print('Reservoir drainage area (km2): ', area)