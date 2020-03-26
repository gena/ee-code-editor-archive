/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var srtm = ee.Image("USGS/SRTMGL1_003"),
    hand = ee.ImageCollection("users/gena/global-hand/hand-100"),
    hand1000 = ee.Image("users/gena/GlobalHAND/30m/hand-1000");
/***** End of imports. If edited, may not auto-convert in the playground. *****/


//Get angles in radians
function radians(deg) {
  return deg.multiply(3.1415927).divide(180);
}


//Return constant images of solar zenith and azimuth (in radians) from L1 metadata
function getSolarGeom(l1timg){
  var az = ee.Number(l1timg.get("SUN_AZIMUTH"));
  var el = ee.Number(l1timg.get("SUN_ELEVATION"));
  var ze = ee.Number(90.0).subtract(el);
  var azimuth = radians(az);
  var elevation = radians(el);
  var zenith = radians(ze);
  var dummy = l1timg.multiply(ee.Image(0));
  return ee.Image.cat(dummy.add(azimuth), dummy.add(elevation), dummy.add(zenith))
                  .select([0,1,2], ['azimuthrad', 'elevationrad', 'zenithrad'])
                  .set({'system:time_start': l1timg.get("system:time_start"),
                        'system:id': l1timg.get("system:id"),
                        'SUN_AZIMUTH_DEG': az,
                        'SUN_AZIMUTH_RAD': azimuth,
                        'SUN_ZENITH_DEG' : ze,
                        'SUN_ZENITH_RAD' : zenith,
                        'SUN_ELEVATION_DEG':el,
                        'SUN_ELEVATION_RAD':elevation
                  });
}


// Call DEM of choice, in this case SRTM 30m
// Swap this with other DEM if needed.
function getTerrain(){
  var terrain = ee.Algorithms.Terrain(srtm.resample('bicubic'));
  return terrain;
}

Map.addLayer(getTerrain().select(0), {min: 2903, max: 5082}, 'DEM')

//Return constant images of terrain stuff (slope/aspect in radians)
function getTerrainRads(){
  var terrain = getTerrain();
  var elev = terrain.select(0); 
  var slope = radians(terrain.select(['slope']));
  var aspect = radians(terrain.select(['aspect']));
  var bandnames = ["elevation", "sloperad", "aspectrad"];
  return ee.Image.cat(elev, slope, aspect).select([0,1,2], bandnames);
}


//Return direct illumination factor
function getDirectFactor(solgeo, normalize, nonegatives){
  var terr = getTerrainRads();
  var direct = solgeo.select('azimuthrad')
                    .subtract(terr.select('aspectrad')).cos()
                    .multiply(terr.select('sloperad').sin())
                    .multiply(solgeo.select('zenithrad').sin())
                    .add(solgeo.select('zenithrad').cos()
                    .multiply(terr.select('sloperad').cos()));
  // Values normalized to horizontal conditions are useful for mapping relative changes in solar radiation.
  var seldirect = ee.Algorithms.If(normalize, 
                                   direct.divide(solgeo.select('zenithrad').cos()),
                                   direct);
  // Negative values do not make physical sense (e.g. when cosine method is appled), 
  // but they should be used in the rotation method
  var finaldirect = ee.Algorithms.If(nonegatives,
                                     ee.Image(seldirect).max(ee.Image(0)),
                                     ee.Image(seldirect));
  return ee.Image(ee.Image(finaldirect).select([0], ['DIRECT']).copyProperties(solgeo))
} 


//Get the parameters of the linear regression between illumination and reflectance.
function singleBandRotoCorr(singlebandimg, dirillum, fitgeometry){
  var pairimg = ee.Image.cat(dirillum, singlebandimg);
  var reduce_args = {
    'reducer':ee.Reducer.linearFit(), 
    'scale':120,
    'tileScale':1,
    'bestEffort':false, 
    'geometry':fitgeometry,
    'maxPixels':1e9
  };
  var r = pairimg.reduceRegion(reduce_args);
  var scale = ee.Number(r.get('scale'));
  var offset = ee.Number(r.get('offset'));
  var zencos = ee.Number(dirillum.get('SUN_ZENITH_RAD')).cos();
  var rotocorr = singlebandimg.subtract(
    ee.Image.constant(scale).multiply(dirillum.subtract(ee.Image.constant(zencos)))
    );
  return rotocorr.set({
    scale:scale,
    offset:offset
  });
}

/* Get scatter plot between illumination and reflectance */
function getScatter(refl, dirillum, poly){
  var img = ee.Image.cat(dirillum, refl).toArray()
  var result = ee.Image(img).reduceRegion(ee.Reducer.toList(), poly, 30);
  result = result.get('array');
  var array = ee.Array(result.getInfo());
  var xValues = array.slice(1, 0, 1).project([0]);
  var yValues = array.slice(1, 1, 2);
  var chart = ui.Chart.array.values(yValues, 0, xValues);
  chart = chart.setOptions({
    'hAxis': {
      'title': "Illumination Factor",
    },
    'vAxis': {
      'title': 'Reflectance'
    }
  });
  print(chart);
}


function mergeLandsat(start, stop, startdoy, enddoy, region) {
  var bands = ['swir1', 'nir', 'blue'];
  var l8 = new ee.ImageCollection('LANDSAT/LC8_L1T_TOA').filterDate(start, stop).select(['B6', 'B5', 'B2'], bands);
  var l7 = new ee.ImageCollection('LANDSAT/LE7_L1T_TOA').filterDate(start, stop).select(['B5', 'B4', 'B1'], bands);
  var l5 = new ee.ImageCollection('LANDSAT/LT5_L1T_TOA').filterDate(start, stop).select(['B5', 'B4', 'B1'], bands);
  var l4 = new ee.ImageCollection('LANDSAT/LT4_L1T_TOA').filterDate(start, stop).select(['B5', 'B4', 'B1'], bands);
  var images = ee.ImageCollection(l8.merge(l7).merge(l5).merge(l4)).filter(ee.Filter.dayOfYear(startdoy, enddoy))
    .filterBounds(region)
    .filter(ee.Filter.lt('CLOUD_COVER', 10))
    .sort('system:time_start');
  return images;
}


var reg = ee.Geometry.Point(94.7955322265625, 29.47314131293348); //China
// var reg = ee.Geometry.Point(-117.5478744506836, 33.72922457968426); //Southern Cali

//Map.centerObject(reg, 11);
Map.addLayer(reg, {color:'FC3050'});


var start = ee.Date.fromYMD(2004,1,1);
var end = ee.Date.fromYMD(2010,1,1);

var imgcoll_wint = mergeLandsat(start, end, 1, 60, reg);
var imgcoll_sumr = mergeLandsat(start, end, 120, 150, reg);

var testimg_wint = ee.Image(imgcoll_wint.first());
var testimg_sumr = ee.Image(imgcoll_sumr.first());

var hs = getDirectFactor(getSolarGeom(testimg_sumr), false, false);

//Map.addLayer(hs, {min:-1, max:1, palette:['ffaaaa', '000000', 'aaffaa']}, 'hs')
//return

var nircorr = singleBandRotoCorr(testimg_sumr.select('nir'), hs, reg.buffer(5000));
var swircorr = singleBandRotoCorr(testimg_sumr.select('swir1'), hs, reg.buffer(5000));
var bluecorr = singleBandRotoCorr(testimg_sumr.select('blue'), hs, reg.buffer(5000));
var testimg_sumr_corr = ee.Image.cat([nircorr, swircorr, bluecorr])

var diff = testimg_sumr_corr.reduce(ee.Reducer.mean())
Map.addLayer(diff, {min:-1, max:1, palette:['ff0000','ffffff','0000ff']}, 'diff', false)

// take the brightest
var br = testimg_sumr.reduceRegion(ee.Reducer.max(), reg.buffer(5000), 120);
var br_corr = testimg_sumr_corr.reduceRegion(ee.Reducer.max(), reg.buffer(5000), 120);

print(br)
print(br_corr)

var nircorr_br = nircorr.add(ee.Number(br.get('nir')).subtract(br_corr.get('nir')));
var swircorr_br = swircorr.add(ee.Number(br.get('swir1')).subtract(br_corr.get('swir1')));
var bluecorr_br = bluecorr.add(ee.Number(br.get('blue')).subtract(br_corr.get('blue')));
var testimg_sumr_corr_br = ee.Image.cat([nircorr_br, swircorr_br, bluecorr_br])

var diff = testimg_sumr_corr_br.reduce(ee.Reducer.mean())
Map.addLayer(diff, {min:-1, max:1, palette:['ff0000','ffffff','0000ff']}, 'diff br', false)

print("Before Correction - NIR");
// getScatter(testimg_sumr.select('nir'), hs, reg.buffer(2000));

print("After Correction - NIR");
// getScatter(nircorr, hs, reg.buffer(2000));


// Map.addLayer(hs, null, 'HS');
var viz= {bands:['swir1', 'nir', 'blue'], min:0, max:0.4, gamma:0.9}
Map.addLayer(testimg_sumr, viz, 'Original');
Map.addLayer(testimg_sumr_corr, viz, 'Corrected');
Map.addLayer(testimg_sumr_corr_br, viz, 'Corrected (BR)');


