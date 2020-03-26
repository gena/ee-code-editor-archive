/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var srtm = ee.Image("USGS/SRTMGL1_003"),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
l8 = l8
  .filterDate('2017-01-01', '2017-01-02')
  .select(['B6','B5','B3'])
  
print(l8.mosaic().visualize({min:0.03, max:0.3}).getMap())

print(ee.Image().paint(l8.select(0).geometry(), 1, 1).visualize({palette:['000000']}).getMap())  

Map.addLayer(l8, {min:0.03, max:0.3})
print(srtm.getMap())