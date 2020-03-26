/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var FirstZoneCapacity = ee.Image("users/gena/HydroEngine/static/FirstZoneCapacity"),
    FirstZoneKsatVer = ee.Image("users/gena/HydroEngine/static/FirstZoneKsatVer"),
    FirstZoneMinCapacity = ee.Image("users/gena/HydroEngine/static/FirstZoneMinCapacity"),
    InfiltCapSoil = ee.Image("users/gena/HydroEngine/static/InfiltCapSoil"),
    M = ee.Image("users/gena/HydroEngine/static/M"),
    PathFrac = ee.Image("users/gena/HydroEngine/static/PathFrac"),
    WaterFrac = ee.Image("users/gena/HydroEngine/static/WaterFrac"),
    thetaS = ee.Image("users/gena/HydroEngine/static/thetaS"),
    wflow_soil = ee.Image("users/gena/HydroEngine/static/wflow_soil"),
    wflow_landuse = ee.Image("users/gena/HydroEngine/static/wflow_landuse"),
    lai = ee.ImageCollection("users/gena/HydroEngine/static/LAI"),
    glocov = ee.Image("ESA/GLOBCOVER_L4_200901_200912_V2_3");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.setOptions('SATELLITE')

var landuseESA = glocov.select(0)
var land = landuseESA.neq(210)
Map.addLayer(landuseESA.mask(land), {}, 'ESA global cover map')
 
land = ee.Image(1)
 
Map.addLayer(FirstZoneCapacity.mask(land), {min:1589, max:2880}, 'FirstZoneCapacity', false)
Map.addLayer(FirstZoneKsatVer.mask(FirstZoneKsatVer.neq(0)), {min:0, max:2421}, 'FirstZoneKsatVer', false)
Map.addLayer(FirstZoneMinCapacity.mask(land), {min:1059, max:1920}, 'FirstZoneMinCapacity', false)
Map.addLayer(InfiltCapSoil.mask(InfiltCapSoil.neq(0)), {min:0, max:240}, 'InfiltCapSoil', false)
Map.addLayer(M.mask(M.neq(0)), {min:0, max:10000}, 'M', false)
Map.addLayer(PathFrac.mask(PathFrac.neq(0)), {min:0, max:0.237}, 'PathFrac', false)
Map.addLayer(WaterFrac.mask(WaterFrac.neq(0)), {min:0, max:0.1497}, 'WaterFrac', false)
Map.addLayer(thetaS.mask(thetaS.neq(0)), {min:0, max:0.59}, 'thetaS', false)
Map.addLayer(wflow_soil.mask(wflow_soil.neq(0)), {min:0, max:13}, 'wflow_soil', false)
Map.addLayer(wflow_landuse.mask(wflow_landuse.neq(0)), {min:0, max:16}, 'wflow_landuse', false)
    

var months = ee.List.sequence(1,12).getInfo()

months.map(function(i) {
  var image = ee.Image(lai.filter(ee.Filter.eq('month', i)).first())
  Map.addLayer(image.mask(land), {min:0, max:5}, 'LAI ' + i.toString(), false)
})


