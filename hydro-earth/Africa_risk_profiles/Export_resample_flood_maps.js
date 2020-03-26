//resample flood maps

// heeft Genna geprogrammeerd, let op!
// I(n+1, i, j) = I(n, i, j) + lambda * (cN * dN(I) + cS * dS(I) + cE * dE(I), cW * dW(I))
var peronaMalikFilter = function(I, iter, K, method) {
    var dxW = ee.Kernel.fixed(3, 3,
                           [[ 0,  0,  0],
                            [ 1, -1,  0],
                            [ 0,  0,  0]]);
  
  var dxE = ee.Kernel.fixed(3, 3,
                           [[ 0,  0,  0],
                            [ 0, -1,  1],
                            [ 0,  0,  0]]);
  
  var dyN = ee.Kernel.fixed(3, 3,
                           [[ 0,  1,  0],
                            [ 0, -1,  0],
                            [ 0,  0,  0]]);
  
  var dyS = ee.Kernel.fixed(3, 3,
                           [[ 0,  0,  0],
                            [ 0, -1,  0],
                            [ 0,  1,  0]]);

  var lambda = 0.1;

  var k1 = ee.Image(-1.0/K);
  var k2 = ee.Image(K).multiply(ee.Image(K));

  for(var i = 0; i < iter; i++) {
    var dI_W = I.convolve(dxW)
    var dI_E = I.convolve(dxE)
    var dI_N = I.convolve(dyN)
    var dI_S = I.convolve(dyS)

    switch(method) {
      case 1:
        var cW = dI_W.multiply(dI_W).multiply(k1).exp();
        var cE = dI_E.multiply(dI_E).multiply(k1).exp();
        var cN = dI_N.multiply(dI_N).multiply(k1).exp();
        var cS = dI_S.multiply(dI_S).multiply(k1).exp();
    
        I = I.add(ee.Image(lambda).multiply(cN.multiply(dI_N).add(cS.multiply(dI_S)).add(cE.multiply(dI_E)).add(cW.multiply(dI_W))))
        break;
      case 2:
        var cW = ee.Image(1.0).divide(ee.Image(1.0).add(dI_W.multiply(dI_W).divide(k2)));
        var cE = ee.Image(1.0).divide(ee.Image(1.0).add(dI_E.multiply(dI_E).divide(k2)));
        var cN = ee.Image(1.0).divide(ee.Image(1.0).add(dI_N.multiply(dI_N).divide(k2)));
        var cS = ee.Image(1.0).divide(ee.Image(1.0).add(dI_S.multiply(dI_S).divide(k2)));
    
        I = I.add(ee.Image(lambda).multiply(cN.multiply(dI_N).add(cS.multiply(dI_S)).add(cE.multiply(dI_E)).add(cW.multiply(dI_W))))
        break;
    }
  }

  return I;
}


function resample_overlap(imageColl,country,dem){
  
  var dem_min_ = dem.clip(admin1.filterMetadata('ISO_A2', 'equals', country))
  .toFloat()
  .focal_min(10, 'square', 'pixels')
  .reproject('EPSG:4326', fine_scale)
  .reproject('EPSG:4326', scale_60_arc);
  
  print(country)
  // normalize DEM
  var dem_norm = dem.clip(admin1.filterMetadata('ISO_A2', 'equals', country))
  .toFloat()
  .subtract(dem_min_);


  var resample = function(image){
    
    var dem_max = ee.Image(10).mask(image.neq(0)).reproject('EPSG:4326', scale_60_arc).clip(admin1.filterMetadata('ISO_A2', 'equals', country));
    var dem_min = ee.Image(0).reproject('EPSG:4326', scale_60_arc).clip(admin1.filterMetadata('ISO_A2', 'equals', country));
  
    //var dem_max = ee.Image(10).mask(image.neq(0)).reproject('EPSG:4326', scale_60_arc).clip(country);
   //var dem_min = ee.Image(0).reproject('EPSG:4326', scale_60_arc).clip(country);
    
    var flood_60 = image.clip(admin1.filterMetadata('ISO_A2', 'equals', country))
    //var flood_60 = image.clip(country)
    .toFloat().divide(10)
    .focal_mean(10, 'square', 'pixels')
    .toFloat()
    .reproject('EPSG:4326', fine_scale)
    .reproject('EPSG:4326', scale_60_arc);
  
    flood_60.mask(flood_60.gt(0));

   
    var flood_level = (dem_min.add(dem_max)).divide(2).reproject('EPSG:4326', scale_60_arc);
    var iter = 10;
    // loop over min/max
    for(var i = 0; i < iter; i++) {
      //Map.addLayer(dem_min, {min:0, max: 50}, 'min')
      //Map.addLayer(dem_max, {min:0, max: 50}, 'max')
      flood_level = (dem_min.add(dem_max)).divide(2).reproject('EPSG:4326', scale_60_arc);
      //Map.addLayer(flood_level, {min: 0, max: 5}, 'flood layer');
      // compute depth values in small scale cells and compute average
      var depth_av = ((flood_level.subtract(dem_norm)).max(0))
        .toFloat()  // convert to floats
      .focal_mean(10, 'square', 'pixels')  // estimate moving mean at very fine resolution
      .reproject('EPSG:4326', fine_scale)  // select very fine resolution (10 meter)
      .reproject('EPSG:4326', scale_60_arc);  // then upscale again to the 900 (0.0083333 deg.) meter scale
      var error = flood_60.subtract(depth_av).reproject('EPSG:4326', scale_60_arc);
      var err_positive = error.gt(0);
      dem_min = dem_min.where(err_positive, flood_level);
      dem_max = dem_max.where(err_positive.not(), flood_level);
      //print(dem_max)
      var error_abs = error.abs();
      //Map.addLayer(error_abs, {min: 0, max: 5}, 'error');
    

    //Map.addLayer(flood_depth.mask(flood_depth), {min: 0, max: 5}, 'error');
    }
    var flood_depth_temp = (flood_level.subtract(dem_norm)).max(0).reproject('EPSG:4326', fine_scale);
    var image0 = ee.Image(0).reproject('EPSG:4326', fine_scale).clip(flood_depth_temp.geometry(1e-2).bounds(1e-2));
    var flood_depth = flood_depth_temp.mask(image0.gte(0));
    
    return flood_depth;   
    
  };
  
  var images = imageColl.map(resample);  
  
  return images;  
    
  
} 

function prepare_tiles(polys, lon_start, lon_end, lat_start, lat_end, dx, dy){
  //var polys = [];
  for (var lon = lon_start; lon < lon_end; lon += dx) {
    var x1 = lon - dx/2;
    var x2 = lon + dx/2;
    for (var lat = lat_start; lat < lat_end; lat += dy) {
      var y1 = lat - dy/2;
      var y2 = lat + dy/2;
      polys.push(ee.Geometry.Rectangle(x1, y1, x2, y2));
    }
  }
  return polys;
}

function clipImageColl(imageColl,poly){
  var clipImage = function(image) {
    return image.clip(poly);
    
  };
  
  var images = imageColl.map(clipImage);
  return images;
}

var fine_scale = [0.00083333333333333333333333333, 0, -180, 0, -0.00083333333333333333333333333, 60];
var scale_60_arc = [0.01666666666666667, 0, -179.9958333333333333, 0, -0.01666666666666667, 59.9958333333333333];

var colors_dem = ['006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027', 'a50026', 'ffffff'];


var admin1 = ee.FeatureCollection('ft:1zEDcUlSsLAQwrpxAZfpUJNLEghCxUGraceB2bFfc');
//var features = admin1.getInfo().features;

//var dem = ee.Image('srtm90_v4');

var dem_senegal = ee.Image('GME/images/12702757807442970300-04328481494314888890')
var dem_niger = ee.Image('GME/images/12702757807442970300-07321328812910646410')
var dem_horn = ee.Image('GME/images/12702757807442970300-15376670774087721723')

var dem_senegal_f = peronaMalikFilter(dem_senegal,20,2,1)
var dem_niger_f = peronaMalikFilter(dem_niger,20,2,1)
var dem_horn_f = peronaMalikFilter(dem_horn,20,2,1)


var hand = ee.ImageCollection.fromImages([dem_horn_f,
  dem_niger_f,
  dem_horn_f,
  dem_horn_f,
  dem_senegal_f]);

//var dem = hand.mosaic().reproject('EPSG:4326', fine_scale)
//var dem = dem_niger;

// load real *yr floods (54 maps)
var coll_flood = ee.ImageCollection('GME/layers/12702757807442970300-16617043393034901554');
var coll_flood_info =coll_flood.getInfo();

print(coll_flood_info =coll_flood.getInfo());

var countries = ['ET','NE','UG','KE',null];
var countries_full = ['Ethiopia','Nigeria','Uganda','Kenya','Senegal'];



// prepare polys
var xmin = -18;
var xmax = 49;
var ymin = -5;
var ymax = 24;
var dx = 4;
var dy = 4;


var polys = prepare_tiles([], xmin, xmax, ymin, ymax, dx, dy);
var grid = ee.FeatureCollection(polys);

// loop over countries
//countries.length
for (var i = 0; i < 1; ++i) {
  j=0;
  var dem = ee.Image(hand.toList(5,0).get(i));
  //var grid_select = ee.Join.simple().apply(grid, admin1.filterMetadata('ISO_A2', 'equals', countries[i]), ee.Filter.withinDistance(0, '.geo', null, '.geo'));
  
  var images_resampled = resample_overlap(coll_flood, countries[i],dem);
  

  //for(var n = 0; n < grid_select.toList(50).length().getInfo(); ++n ){
  //var images_resampled_clip = clipImageColl(images_resampled,ee.Feature(grid_select.toList(50, 0).get(n)).geometry());
    for (var j = 0; j < images_resampled.toList(54).length().getInfo(); ++j ){
      var image = ee.Image(images_resampled.toList(54).get(j));
      var info = image.getInfo();
      var crs = info.bands[0].crs;
      var aoiRegion = image.geometry(1e-2).bounds(1e-2).coordinates().getInfo()[0];
      Export.image(image,
      countries_full[i]+'_'+j.toString()+'_'+coll_flood_info.features[j].properties.name,
      {crs:crs,
      driveFolder:'RiSA_'+countries_full[i],
      maxPixels:800000000,
      scale:90,
      region:aoiRegion});
    }
  }