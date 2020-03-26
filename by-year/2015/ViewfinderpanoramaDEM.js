/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var srtm90 = ee.Image("CGIAR/SRTM90_V4"),
    srtm30 = ee.Image("USGS/SRTMGL1_003");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var demVFP = ee.ImageCollection.fromImages([
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM1'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM2'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM3'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM4'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM5'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM6'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM7'),
  ee.Image('users/gena/ViewfinderpanoramaDEM/VFP_DEM8')
  ]).mosaic()
  
  
Map.addLayer(demVFP, {min: 0, max: 4000}, 'VFP (Viewfinderpanorama) DEM')
Map.addLayer(srtm30, {min: 0, max: 4000}, 'SRTM30', false)

var mosaic = ee.ImageCollection.fromImages([demVFP.rename(['elevation']), srtm30]).mosaic();
Map.addLayer(mosaic, {min: 0, max: 4000}, 'SRTM30 / VFP mosaic', false)  
  
var paletteDiff = ['ff0000', 'ffffff', '0000ff']
Map.addLayer(srtm30.subtract(demVFP), {min:-500, max:500, palette: paletteDiff}, "SRTM30 - VFP", false)
Map.addLayer(srtm90.subtract(demVFP), {min:-500, max:500, palette: paletteDiff}, "SRTM90 - VFP", false)