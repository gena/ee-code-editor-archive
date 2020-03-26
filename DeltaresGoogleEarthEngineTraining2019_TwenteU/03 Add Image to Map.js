/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var srtm = ee.Image("USGS/SRTMGL1_003"),
    point = /* color: #d63000 */ee.Geometry.Point([4.381442070007324, 51.98525016185232]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.centerObject(point, 14)

print(srtm);

Map.addLayer(srtm, {min:0, max:10});

// TODO: add AHN to map