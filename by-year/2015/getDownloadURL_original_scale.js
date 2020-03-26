/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var srtm30 = ee.Image("USGS/SRTMGL1_003");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// getDownloadURL_original_scale.js

var bounds = ee.Geometry(Map.getBounds(true))
// print(bounds.centroid(1))
Map.setCenter(-78.22, 33.92, 14)

Map.addLayer(srtm30, {min:0, max:20}, 'srtm 30m')

var info = srtm30.getInfo().bands[0]
var crs = info.crs;
var crs_transform = info.crs_transform
crs_transform = [crs_transform[0], crs_transform[1], 0.0, crs_transform[3], crs_transform[4], 0.0];

print(crs_transform)

var url = srtm30.clip(bounds).getDownloadURL({
  name: 'srtm30',
  crs: crs,
  crs_transform: JSON.stringify(crs_transform),
  region: JSON.stringify(bounds.coordinates().getInfo()[0])
})

print(url)