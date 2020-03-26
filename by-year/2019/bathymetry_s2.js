/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Setting aoi 
var aoi = Map.getBounds(true);
//Map.centerObject(aoi)
//var aoi = Map.getBounds(true);

// -------------------------------------------------------------------------------------------
// Select L8 collection
var s2 = s2
  .filter(ee.Filter.dayOfYear(180, 270))
  .filterBounds(aoi);


// Select first cloud free image in collection
var image = ee.Image(s2.toList(1, 1).get(0)).divide(10000).resample('bicubic'); //with least cloud cover
//var image = s2.select(['B4','B3','B2']).reduce(ee.Reducer.percentile([15])).divide(10000).rename(['B4','B3','B2']).reproject('EPSG:3857', null, Map.getScale())

  

print(image);

Map.addLayer(image.select('B4','B3','B2'),{min:0.0, max:0.2},'Landsat 8 image');

// -------------------------------------------------------------------------------------------
// Extracting SDB

// Elevation Z = a0 + ai Xi + aj Xj + ak Xk 
// In which Xi = ln(Rw(i) - Rw_inf(i)); Xj = ln(Rw(j) - Rw_inf(i));  Xk = ln(Rw(k) - Rinf(i)); 
// i = coastal aerosaol; j = blue; k = green; Rw_inf = deep water value (min of Rw)

// fitting found in paper
var a0 = ee.Image(-2.39);
var ai = ee.Image(-6.05);
var aj = ee.Image(-0.33);
var ak = ee.Image(8.25);

// select reflactance bands
var aero = image.select('B1');
var blue = image.select('B2');
var green = image.select('B3'); 

// find info values
var minvalue_i = ee.Image(image.select('B1').reduceRegion(ee.Reducer.min(),aoi).toArray());
var minvalue_j = ee.Image(image.select('B2').reduceRegion(ee.Reducer.min(),aoi).toArray());
var minvalue_k = ee.Image(image.select('B3').reduceRegion(ee.Reducer.min(),aoi).toArray());

// find elevation Z
var Xi = (aero.subtract(minvalue_i)).log();
var Xj = (blue.subtract(minvalue_j)).log();
var Xk = (green.subtract(minvalue_k)).log();
var Z = ai.multiply(Xi).add(aj.multiply(Xj)).add(ak.multiply(Xk)).add(a0);
Z = Z.cast({'constant':'float'});


// image = image.addBands(Z)
Map.addLayer(Z, {min:-15,max:0}, 'Bathymetry from Landsat 8');

return

// Plot along transect
var distances = ee.List.sequence(0, transect.length(),130);
var lines = transect.cutLines(distances) // cut transect into equal elemens

var N = distances.length().getInfo()
var elevations = []

for (var i = 0; i < N ; i++) {  // loop over lines
    var l1 = ee.Geometry.LineString(lines.coordinates().get(i));
    var buf = l1.buffer(20);
    
    var z = ee.FeatureCollection(Z.sample(buf));
    elevations.push(ee.Array(z.aggregate_first('constant')));
}
var n = ee.Array.cat(elevations);

print(ui.Chart.array.values(n,0,distances)) // make chart