/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var aoiPortugal = /* color: d63000 */ee.Geometry.Polygon(
        [[[-8.320898515378985, 36.993809867076806],
          [-7.645750844830559, 36.878523751996696],
          [-7.6086613850974345, 37.170790504145316],
          [-8.311283343389277, 37.10727845134723]]]),
    transect = /* color: 98ff00 */ee.Geometry.LineString(
        [[-8.009719851252157, 37.021133269682174],
         [-8.025083544489462, 37.00680948863398]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Extract bathymetry (Satellite Detected Bathymetry from Landsat TOA satellite images
// Based on paper of: Pacheco, A. et. al; Retrieval of nearshore bathymetry from Landsat 8 images: A tool for coastal monitoring in shallow waters

// Setting aoi 
var aoi = aoiPortugal;
Map.centerObject(aoi)
//var aoi = Map.getBounds(true);

// -------------------------------------------------------------------------------------------
// Select L8 collection
var landsat8Collection = ee.ImageCollection('LANDSAT/LC8_L1T_TOA') //true landsat8 collection
  .filterDate('2013-10-01','2016-11-01')
  .filterBounds(aoi);
print(landsat8Collection);

// Select first cloud free image in collection
var image = ee.Image(landsat8Collection.sort('CLOUD_COVER',true).first()); //with least cloud cover
var date = image.get('DATE_ACQUIRED');
print(date);
print(image);
Map.addLayer(image.select('B4','B3','B2'),{min:0.0, max:0.2},'Landsat 8 image ' + date.getInfo());

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

// Plot along transect
var distances = ee.List.sequence(0,transect.length(),130);
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