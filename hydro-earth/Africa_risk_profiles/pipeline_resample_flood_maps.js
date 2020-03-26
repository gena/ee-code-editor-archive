/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: d63000 */ee.Geometry.MultiPoint();
/***** End of imports. If edited, may not auto-convert in the playground. *****/
//resample flood maps

var fine_scale = [0.00083333333333333333333333333, 0, -180, 0, -0.00083333333333333333333333333, 60];
var scale_60_arc = [0.01666666666666667, 0, -179.9958333333333333, 0, -0.01666666666666667, 59.9958333333333333];

var colors_dem = ['006837', '1a9850', '66bd63', 'a6d96a', 'd9ef8b', 'ffffbf', 'fee08b', 'fdae61', 'f46d43', 'd73027', 'a50026', 'ffffff'];


var admin1 = ee.FeatureCollection('ft:1zEDcUlSsLAQwrpxAZfpUJNLEghCxUGraceB2bFfc');
//var features = admin1.getInfo().features;

//var dem = ee.Image('srtm90_v4');

var dem_senegal = ee.Image('GME/images/12702757807442970300-04328481494314888890')
var dem_niger = ee.Image('GME/images/12702757807442970300-07321328812910646410')
var dem_horn = ee.Image('GME/images/12702757807442970300-15376670774087721723')

var hand = ee.ImageCollection.fromImages([dem_horn,
  dem_niger,
  dem_horn,
  dem_horn,
  dem_senegal]);

//var dem = hand.mosaic().reproject('EPSG:4326', fine_scale)
//var dem = dem_niger;

// load real *yr floods for HadGEM2
var coll_flood = ee.ImageCollection('GME/layers/12702757807442970300-01814814738877344612');
var coll_flood_info =coll_flood.getInfo();

var countries = ['ET','NE','UG','KE',null];
var countries_full = ['Ethiopia','Nigeria','Uganda','Kenya','Senegal'];


function resample_overlap(imageColl,country,dem){
  
  var dem_min_ = dem.clip(country)
  .toFloat()
  .focal_min(10, 'square', 'pixels')
  .reproject('EPSG:4326', fine_scale)
  .reproject('EPSG:4326', scale_60_arc);
  
  print(country)
  // normalize DEM
  var dem_norm = dem.clip(country)
  .toFloat()
  .subtract(dem_min_);


  var resample = function(image){
    
    //var dem_max = ee.Image(10).mask(image.neq(0)).reproject('EPSG:4326', scale_60_arc).clip(admin1.filterMetadata('ISO_A2', 'equals', country));
    //var dem_min = ee.Image(0).reproject('EPSG:4326', scale_60_arc).clip(admin1.filterMetadata('ISO_A2', 'equals', country));
  
    var dem_max = ee.Image(10).mask(image.neq(0)).reproject('EPSG:4326', scale_60_arc).clip(country);
    var dem_min = ee.Image(0).reproject('EPSG:4326', scale_60_arc).clip(country);
    
    //var flood_60 = image.clip(admin1.filterMetadata('ISO_A2', 'equals', country))
    var flood_60 = image.clip(country)
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
    var flood_depth = (flood_level.subtract(dem_norm)).max(0).reproject('EPSG:4326', fine_scale);
 
  
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
  return polys
}

// prepare polys
var xmin = -18;
var xmax = 49;
var ymin = -5;
var ymax = 24;
var dx = 2;
var dy = 2;


var polys = prepare_tiles([], xmin, xmax, ymin, ymax, dx, dy);
var grid = ee.FeatureCollection(polys);

// loop over countries
//countries.length
for (var i = 0; i < 1; ++i) {

  var dem = ee.Image(hand.toList(1,0).get(0));
  var grid_select = ee.Join.simple().apply(grid, admin1.filterMetadata('ISO_A2', 'equals', countries[i]), ee.Filter.withinDistance(0, '.geo', null, '.geo'));
  
  //var images_resampled = resample_overlap(coll_flood, countries[i],dem);
  var images_resampled = resample_overlap(coll_flood, grid_select,dem);
  print(images_resampled)
  
/*  
  var flood_60 = ee.Image(coll_flood.toList(1, 0).get(0)).clip(admin1.filterMetadata('ISO_A2', 'equals', countries[i]))
  .toFloat() //.divide(10)
  .focal_mean(10, 'square', 'pixels')
  .toFloat()
  .reproject('EPSG:4326', fine_scale).reproject('EPSG:4326', scale_60_arc);
    
  var flood_60 = flood_60.mask(flood_60.gt(0));
  
  Map.addLayer(ee.Feature(grid_select.toList(10, 0).get(8)), {}, 'grid', true);
  
  Map.addLayer(flood_60, {   //
      min: 0, max: 5, palette: ['00ff00', '0000ff']},
      'flood_60', false);
*/  

  //loop over image collection
  //9,100
  //images_resampled.toList(1).length().getInfo()
  //grid_select.toList(1).length().getInfo()
  for (var i = 0; i < 1; ++i) {
    for (var j = 0; j < 1;++i){
      var image = ee.Image(images_resampled
      .toList(9, 0).get(i))
      .clip(ee.Feature(grid_select.toList(10, 0).get(j)).geometry());
    
      var info = image.getInfo();
      var crs = info.bands[0].crs;
      var aoiRegion = image.geometry(1e-2).bounds(1e-2).coordinates().getInfo()[0];
      
      var url = image.getDownloadURL({
        name:countries_full[i]+'_'+j.toString()+'_'+coll_flood_info.features[i].properties.name,
        //scale: fine_scale,
        crs: crs,
        region: JSON.stringify(aoiRegion),
        });
      print(url);
      //download(url,
      //countries_full[i]+'_'+j.toString()+'_'+coll_flood_info.features[i].properties.name +'.zip');
    }

  }
}



//print(ee.Image(images_resampled
//  .toList(1, 0).get(0)).reduceRegion(ee.Feature(grid_select.toList(1, 0).get(0)).geometry()))
//Map.centerObject(ee.Feature(grid_select.toList(1, 0).get(0)));
/*
Map.addLayer(ee.Image(images_resampled
  .toList(1, 0).get(0)).clip(ee.Feature(grid_select.toList(10, 0).get(8)).geometry()),
  {min: 0, max: 10, palette: ['FFFFFF, FF04AA']},
  'flood',
  true);
*/
  
  //Export.image(image.mask(image),list[i])//ee.String(list.get(i)).getInfo())
  //print(ee.String(list.get(i)))
//}


//Map.addLayer(flood_.mask(flood_), {min: 0, max: 5, palette: ['00ff00', '0000ff']}, 'flood', true);
//var coll = list.map(clip)

//var clip = function(image) {
//  return flood.clip(admin1.filterMetadata('ISO_A2', 'equals', image));}
//print(a)
//var flood_Ethiopia = flood.clip(admin1);
//Map.addLayer(a.get(0), {min: 0, max: 5, palette: ['00ff00', '0000ff']}, 'flood', true);