/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var modis_myd = ee.ImageCollection("MODIS/MYD09GA"),
    modis_mod = ee.ImageCollection("MODIS/MOD09GA"),
    mod_gq = ee.ImageCollection("MODIS/MOD09GQ"),
    myd_gq = ee.ImageCollection("MODIS/MYD09GQ"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA"),
    l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    water = /* color: d63000 */ee.Feature(
        ee.Geometry.MultiPolygon(
            [[[[-48.33980966662443, 2.498657990863991],
               [-47.88401168705241, 3.184256837317869],
               [-47.94441699557376, 3.1897383979413445],
               [-48.394726606401434, 2.5206050964625435]]],
             [[[-52.99633026123047, 4.916174861119555],
               [-53.009376525878906, 4.916858980205344],
               [-53.01006317138672, 4.909675694775618],
               [-52.99873352050781, 4.910701883147453]]]]),
        {
          "system:index": "0"
        }),
    mud_water = /* color: 98ff00 */ee.Feature(
        ee.Geometry.MultiPolygon(
            [[[[-50.10181860149976, 0.689413754067861],
               [-49.05944365833136, 1.0930732024292777],
               [-49.07042994954156, 1.1164154766143117],
               [-50.1127692884852, 0.7099688800582521]]],
             [[[-51.601409912109375, 4.425828874929916],
               [-51.623382568359375, 4.420352070868226],
               [-51.584930419921875, 4.277941105866812],
               [-51.571197509765625, 4.283418945973975]]],
             [[[-49.49341182558874, 1.8343987043672196],
               [-49.438474175539, 1.809689289094106],
               [-49.40001763000964, 1.870089505090051],
               [-49.438474066158165, 1.8920528992790353],
               [-49.465950433694616, 1.8769589759752945]]],
             [[[-50.90240514918361, 3.0417831137197258],
               [-50.90515170682875, 3.077437416988045],
               [-50.97381554985162, 3.074694821522222],
               [-50.96008278619007, 3.014355919646032]]],
             [[[-51.895294189453125, 4.688666902768201],
               [-51.88911437988281, 4.716724593887823],
               [-51.89735412597656, 4.71946186902137],
               [-51.90284729003906, 4.691404288203818]]]]),
        {
          "system:index": "0"
        }),
    mud_water2 = /* color: 0B4A8B */ee.Feature(
        ee.Geometry.Polygon(
            [[[-52.662934671206415, 5.383574784298748],
              [-52.565461357988056, 5.4765760392855],
              [-52.58194799791272, 5.495709128255263],
              [-52.67667340524133, 5.3986074910947375]]]),
        {
          "system:index": "0"
        }),
    land = /* color: ffc82d */ee.Feature(
        ee.Geometry.MultiPolygon(
            [[[[-52.863316731166094, 5.246879934756819],
               [-54.39066948004432, 5.0362120223334275],
               [-54.404399284660656, 5.000624647974886],
               [-52.855071674145165, 5.219513242336069]]],
             [[[-55.6842041015625, 1.7987157028424698],
               [-55.6787109375, 1.7383196831793677],
               [-55.40679931640625, 1.809696584497972],
               [-55.40679931640625, 1.8591097232781972]]],
             [[[-52.15827941894531, 4.806364708499998],
               [-52.1630859375, 4.814575430505828],
               [-52.19123840332031, 4.777626403447634],
               [-52.18299865722656, 4.770783772016471]]],
             [[[-51.71882629394531, 4.371059019137522],
               [-51.779937744140625, 4.375166897767158],
               [-51.778564453125, 4.367635769748272],
               [-51.72088623046875, 4.36352784986188]]]]),
        {
          "system:index": "0"
        }),
    mud_water3 = /* color: 00ffff */ee.Feature(
        ee.Geometry.MultiPolygon(
            [[[[-54.46746826171875, 5.9821436683427125],
               [-54.262847900390625, 6.256602054794944],
               [-54.2779541015625, 6.25660205479493],
               [-54.481201171875, 5.990338482830232]]],
             [[[-52.74261474609375, 5.3029291433474395],
               [-52.672576904296875, 5.367194209228587],
               [-52.689056396484375, 5.387702915066553],
               [-52.752227783203125, 5.316603124716078]]],
             [[[-51.50115966796875, 4.521666342614791],
               [-51.494293212890625, 4.737938193476779],
               [-51.508026123046875, 4.746149734842935],
               [-51.52587890625, 4.5161902548267125]]]]),
        {
          "system:index": "0"
        });
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Mud bar analysis for French Guiana

/*
Satellites data to analyse:

http://landsat.usgs.gov/band_designations_landsat_satellites.php

temporal resolution ~16 days
Landsat 4   30m
Landsat 5   30m
Landsat 7   15m, 30m
Landsat 8   15m, 30m


http://modis.gsfc.nasa.gov/about/
MODIS       250m, 500m, 2x / day

*/

/*

TODO:

1. download times of satellite produts available for the study area
2. download video of MODIS RGB data
3. select landsat scenes to analyse and create training set <==

*/

//mod = mod

var bounds = ee.Geometry(Map.getBounds(true))

//var bounds = geometry;
//Map.centerObject(bounds, 8)

var p = 3;
var vmin = 0;
var vmax = 300;

function getAverageImage(ic, date) {
  var dateStart = ee.Date(date)

  var averagingPeriod = 6; // <<<<<<<<<<<<<<<<,
  var averagingUnit = 'month';
  var dateEnd = dateStart.advance(averagingPeriod, averagingUnit)

  var images = ic
    .filterDate(dateStart, dateEnd)
    // mod_gq
    .select(['sur_refl_b01', 'sur_refl_b02'])

    //.select(['sur_refl_b01', 'sur_refl_b02', 'sur_refl_b03', 'sur_refl_b04', 'sur_refl_b05', 'sur_refl_b06', 'sur_refl_b07'])
    
    // SWIR, NIR, GREEN
    //.select(['sur_refl_b07', 'sur_refl_b02', 'sur_refl_b04'])
    //.select(['sur_refl_b05', 'sur_refl_b02', 'sur_refl_b04'])

    // l7
    //.select(['B3', 'B2', 'B1'], ['red', 'green', 'blue'])
    

    // l8
    //.select(['B5', 'B4', 'B3'], ['red', 'green', 'blue'])
    
  return images.reduce(ee.Reducer.percentile([p]))
    
    //.normalizedDifference(['nir', 'red'])
    //.visualize({min:-0.5, max:0.5, gamma:1.0})

  //return images.median()
  //  .visualize({min:0.05, max:0.3, gamma:1.0})
}

var info = ee.Image(modis_mod.filterBounds(bounds).first()).getInfo().bands[0];

function train(i) {
  var f_land = ee.FeatureCollection([land.set('class', 0)])
  var f_water = ee.FeatureCollection([water.set('class', 1)])
  var f_mud_water = ee.FeatureCollection([mud_water.set('class', 2)])
  var f_mud_water2 = ee.FeatureCollection([mud_water2.set('class', 3)])
  var f_mud_water3 = ee.FeatureCollection([mud_water3.set('class', 4)])
  
  var trainingSet = f_water.merge(f_mud_water).merge(f_mud_water2).merge(f_mud_water3).merge(f_land)
  
  i = i.clip(trainingSet.geometry().bounds())

  var classifier = i.trainClassifier({
    'training_features': trainingSet,
    'training_property':'class',
    'classifier_name': 'Cart',
    'crs':info.crs,
    "crs_transform": info.crs_transform //[8.9831528411952135e-04, 0, -180, 0, -8.9831528411952135e-04, 90]
  });
  
  return classifier;
}

var dates = []
for(var i = 2000; i < 2015; i++) {
//for(var i = 2013; i < 2015; i++) { // l8

  if(i != 2000) {
    dates.push(i + '-01-01')
    dates.push(i + '-02-01')
    dates.push(i + '-03-01')
    dates.push(i + '-04-01')
    dates.push(i + '-05-01')
    dates.push(i + '-06-01')
  }
  dates.push(i + '-07-01')
  dates.push(i + '-08-01')
  dates.push(i + '-09-01')
  dates.push(i + '-10-01')
  dates.push(i + '-11-01')
  dates.push(i + '-12-01')
}

print(dates.length)

//var ic = new ee.ImageCollection(modis_mod.merge(modis_myd))
var ic = new ee.ImageCollection(mod_gq.merge(myd_gq))

Map.addLayer(ic.select(0).count(), {}, 'count', false)

var classifier = train(getAverageImage(ic, dates[0]))

function renderImage(date, imageType) {
  var image = getAverageImage(ic, date);
  
  var rgb = image
      //.select(['sur_refl_b05_p' + p, 'sur_refl_b02_p' + p, 'sur_refl_b04_p' + p], ['swir', 'nir', 'green'])
      //.select(['sur_refl_b07_p' + p, 'sur_refl_b02_p' + p, 'sur_refl_b04_p' + p], ['swir', 'nir', 'green'])
      
      //.select(['sur_refl_b01_p' + p, 'sur_refl_b02_p' + p, 'sur_refl_b03_p' + p, 'sur_refl_b04_p' + p], ['red', 'nir', 'blue', 'green'])
      //.select(['red', 'green', 'blue'])
      
      
      .select(['sur_refl_b01_p' + p, 'sur_refl_b02_p' + p, 'sur_refl_b01_p' + p], ['red', 'green', 'blue'])
      
      .visualize({min:vmin, max:vmax, gamma:1, forceRgbOutput:true});

  var classified = image.classify(classifier);
  
  var mud = classified.eq(2).focal_mode(3).focal_max(3).focal_min(3)
  mud = mud.subtract(mud.focal_min(1))
  mud = mud.mask(mud)
  
  var mud_edge = mud.visualize({palette:['ff0000'], opacity: 1.0})

  var mud2 = classified.eq(4).focal_mode(3).focal_max(3).focal_min(3)
  mud2 = mud2.subtract(mud2.focal_min(1))
  mud2 = mud2.mask(mud2)
  
  var mud2_edge = mud2.visualize({palette:['bb5050'], opacity: 0.6})

  if(imageType === 0) {
    return ee.ImageCollection.fromImages([rgb, mud2_edge, mud_edge]).mosaic()
  }

  if(imageType === 1) {
    return rgb
  }
  
  if(imageType === 2) {
    return classified.visualize({palette: ['ffffff','5050ff','aaaa00','cccc00', 'ffff00'], max: 5})
  }
}

Map.addLayer(renderImage(dates[0], 1), {}, dates[0] + ' rgb', false)
Map.addLayer(renderImage(dates[0], 2), {}, dates[0] + ' classified', false)

var crsTransformSetStep = function(step, t) {
  return [step, t[1], t[2], t[3], -step, t[5]];
}

var dateIndex = 0;

// var imageType = 0; // classified + RGB
var imageType = 1; // RGB

// show on a map
for(var i = 2000; i < 2001; i++) {
  for(var j = 0; j < 4; j++) {
    var image = renderImage(dates[dateIndex], imageType);
    Map.addLayer(image, {}, dates[dateIndex])
    dateIndex += 3
    print(dateIndex)
    print(dates[dateIndex])
  }
}


print(info.crs)

// print urls to download
for(var i = 2000; i < 2015; i++) {
  for(var j = 0; j < 4; j++) {
    var image = renderImage(dates[dateIndex], imageType);
    
    //Map.addLayer(image, {}, dates[dateIndex])
  
    var t = crsTransformSetStep(250, info.crs_transform)
  
    print(dates[dateIndex])
    var name = 'mud_banks_modis_' + dates[dateIndex];
    /*
    var url = image.getDownloadURL({
        name: name,
        crs: info.crs,
        format: 'png',
        crs_transform: JSON.stringify(t),
        region: JSON.stringify(ee.Geometry(bounds).coordinates().getInfo()[0]),
      });
      
    print(url)
    */

    dateIndex += 3
    
    if(dateIndex >= dates.length) {
      // stop
      i = 3000;
      j = 10;
    }
  }
}


/*
var ndvi = getAverageImage(ic, dates[0]).normalizedDifference(['sur_refl_b02_p' + p, 'sur_refl_b01_p' + p]);
Map.addLayer(ndvi, {min:-1, max:1}, 'NDVI', false)

var land_ndvi = ndvi.gt(0.6);
Map.addLayer(land_ndvi.mask(land_ndvi), {min:0, max:1, palette:['ffffff']}, 'land', false)

var water_ndvi = ndvi.eq(0).focal_mode(5).focal_max(3).focal_min(3);
Map.addLayer(water_ndvi.mask(water_ndvi), {min:0, max:1, palette:['ccccff']}, 'water', false)

*/

var images = ee.ImageCollection(dates.map(function(d) { return renderImage(d, imageType) }))

print(ic.first())

var images = ic.map(function(image) {
  var rgb = image
      .select(['sur_refl_b01', 'sur_refl_b02', 'sur_refl_b01'], ['red', 'green', 'blue'])
      
      //.select(['sur_refl_b01', 'sur_refl_b02', 'sur_refl_b03', 'sur_refl_b04'], ['red', 'nir', 'blue', 'green'])
      //.select(['red', 'green', 'blue'])

      //.select(['sur_refl_b05', 'sur_refl_b02', 'sur_refl_b04'], ['swir', 'nir', 'green'])
      //.select(['sur_refl_b07', 'sur_refl_b02', 'sur_refl_b04'], ['swir', 'nir', 'green'])

      .visualize({min:vmin, max:vmax, gamma:1.0, forceRgbOutput:true});
      
  // compute cloud score
  
  return rgb;
})

//Map.addLayer(ee.Image(images.first()), {}, dates[0])


//var l = ee.List(images.toList(3, 0))
//Map.addLayer(ee.Image(l.get(0)), {}, dates[0])
//Map.addLayer(ee.Image(l.get(1)), {}, dates[1])    
//Map.addLayer(ee.Image(l.get(2)), {}, dates[2])    

// compute bounds for video
var scale = 250;
var bounds = Map.getBounds();
var region = '[['+bounds[0]+', '+bounds[1]+'], ['+bounds[2]+', '+bounds[1]+'], ['+bounds[2]+', '+bounds[3]+'], ['+bounds[0]+', ' + bounds[3] + ']]';
var geom = ee.Geometry(Map.getBounds(true))
var coords = ee.List(geom.bounds(1, ee.Projection('EPSG:3857')).coordinates().get(0)).getInfo()
var w = Math.round((coords[1][0] - coords[0][0])/scale)
var h = Math.round((coords[2][1] - coords[1][1])/scale)
print(w + 'x' + h)

Export.video(images, 'MODIS', {
  dimensions: w + 'x' + h,
  framesPerSecond: 12,
  region: region});
  
  