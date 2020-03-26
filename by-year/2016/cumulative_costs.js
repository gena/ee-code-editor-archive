/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.MultiPoint(
        [[-117.05245971679688, 32.616243412727385],
         [-117.03598022460938, 32.71219987946374],
         [-116.92337036132812, 32.7907379828099],
         [-117.1417236328125, 32.9257074887604],
         [-117.1856689453125, 32.766490959951085]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
 
//import road feature. Convert to Raster
var road = ee.FeatureCollection( 'ft:1Fkokk727DPRTyjDIcR0AN25IFqoYUiX1Ye-_rEij');
var road_raster = ee.Image().toByte().paint(road, 1);

//convert points to raster
var points_raster = ee.Image().toByte().paint(geometry, 1);

//create mask grid of 10s
var road_mask = ee.Image(10);

//create friction layer where roads will have a value of 1
//and non-roads a value of 10 (high cost to access)
var road_friction = road_mask.where(road_raster.eq(1), 1);

//cumulative cost 
var cumulativeCost = road_friction.cumulativeCost({
  source: points_raster,
  maxDistance: 10000 // 80 kilometers
});


Map.addLayer(road_friction)
Map.addLayer(cumulativeCost, {min: 0, max: 1e4}, 'accumulated cost');
