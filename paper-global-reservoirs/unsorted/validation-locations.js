/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// lake and reservoir validation locations retrieved from USGS NWIS: http://maps.waterdata.usgs.gov/mapper/nwisquery.html?URL=http://waterdata.usgs.gov/usa/nwis/current?type=lake&format=sitefile_output&sitefile_output_format=xml&column_name=agency_cd&column_name=site_no&column_name=station_nm&column_name=site_tp_cd&column_name=dec_lat_va&column_name=dec_long_va&column_name=agency_use_cd
var validationLocations = ee.FeatureCollection('ft:1POcfYkRBhBSZIbnrNudwnozHYtpva9vdyYBMf5QZ')

var index = 2
var dam = ee.Feature(validationLocations.toList(1, index).get(0))

print(dam)

Map.centerObject(dam, 13)

Map.addLayer(ee.Image(l8.filter(ee.Filter.lt('CLOUD_COVER', 10)).filterBounds(dam.geometry()).first()).select('B8'), {}, 'l8')

// add permanent watermask
var glcf = ee.ImageCollection('GLCF/GLS_WATER')
var waterMask = glcf.map(function(i) { return i.eq(2) }).sum().gt(0)
Map.addLayer(waterMask.mask(waterMask), {palette: ['0000aa'], opacity: 0.5}, 'permanent mask water (GLCF)')

var waterMaskEdge = ee.Algorithms.CannyEdgeDetector(waterMask, 0.99)
Map.addLayer(waterMaskEdge.mask(waterMaskEdge), {palette: ['ffffff']}, 'permanent water mask edge (GLCF)')

Map.addLayer(validationLocations, {color: 'ff0000', opacity:0.7}, 'validation locations (NWIS)')
Map.addLayer(dam, {color: 'ffff00', opacity:0.7}, 'validation locations (NWIS) selected')
