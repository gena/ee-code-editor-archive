// ============================================
// CoastalMorphology/CoastlineScenes.js
// ============================================

// input required parameters
var coords = [[-71,12],[-70,13]] // bounding box for spatially limiting the coastline scene analysis [deg E,N]
var buffer_dist = 5000; // buffer distance for "finding" real coastline [m]

var path = 20
var row = 45

var wrs2 = ee.FeatureCollection('ft:1_RZgjlcqixp-L9hyS6NYGqLaKOlnhSC35AB5M5Ll')
  .filter(ee.Filter.eq('PATH', path))
  .filter(ee.Filter.eq('ROW', row))

var bounds = ee.Feature(wrs2.toList(1,0).get(0)).geometry()

// load GLOBAL inputs (coastline + wrs2 path)
//var bounds = ee.Geometry(ee.Geometry.Rectangle(coords)) //get spatial extents for limiting the analysis
var coastline = ee.FeatureCollection('ft:1MP_HIatHwTTRltyAPrHz785VCE_XNQJ2bfvOzFx8').filterBounds(bounds);
//var wrs2 = ee.FeatureCollection('ft:1_RZgjlcqixp-L9hyS6NYGqLaKOlnhSC35AB5M5Ll').filterBounds(bounds);
Map.addLayer(bounds,{color:'FFFF00',opacity:0.5},'Selected WRS2 Scene',true)
Map.centerObject(bounds,8)

// verify the coastline exists
var coastCheck = coastline.getInfo().features.length //total number of scenes

if (coastCheck === 0) {
  
    print('NO COASTLINES DETECTED')
    
} else {

  // intersect coastline with wrs2 path boxes
  var spatialFilter = ee.Filter.intersects({leftField: '.geo', rightField: '.geo', maxError: 10});
  var saveAllJoin = ee.Join.saveAll({matchesKey: 'features'});
  var intersectJoined = saveAllJoin.apply(wrs2, coastline, spatialFilter); //combine into feature collection
  
  //function to extract clipped intersections from all intersections
  var intersectedWithCount = intersectJoined.map(function(f) {
    var features = ee.List(f.get('features')); //put all intersected features into list
    var count = features.length(); //total number of intersections
    var clippedFeatures = features.map(function(f2) { 
      var clippedFeature = ee.Feature(f2).intersection(f); //intersection with wrs2 path?!?
      clippedFeature = clippedFeature.buffer(buffer_dist); //buffer result to get clipping
      return clippedFeature;
    });
    return f.set('feature_count', count).set('clipped_features', clippedFeatures); // add feature of number of intersections
  })
  
  // ensure all intersected scenes have features (i.e. not empty)
  var allIntersectedScenes = intersectedWithCount.filter(ee.Filter.gt('feature_count', 0))
  
  // visualize the background landsat image
  var bgIm = ee.ImageCollection('LANDSAT/LC8_L1T_TOA')
          .filterBounds(bounds).filterMetadata('CLOUD_COVER','less_than',10)
          .select(['B6','B5','B3']).mosaic().visualize({min:0,max:0.35,gamma:1.5})
  
  // visualize the intersected scenes with the global coastline
  var SceneEdgeIm = ee.Image().byte().paint(allIntersectedScenes,0,4).visualize({palette: '99CCFF',opacity:0.75,forceRgbOutput:true})
  var coastIm = ee.Image().byte().paint(coastline,0,2).visualize({palette: 'FF0000',forceRgbOutput:true})
  
  var bg = ee.ImageCollection([bgIm,SceneEdgeIm,coastIm]).mosaic()
  Map.addLayer(bg,{},'Overview',true)
    
  // Map.addLayer(allIntersectedScenes, {color: '909090', opacity: 0.75}, 'All Intersected Scenes',true); //add to map
  // Map.addLayer(coastline, {color:'0000ff'}, 'Global OSM Coastline',false); //coastline for end "goal"
  
  // visualize the Nth scene with the clipped/buffered coastline polygon
  var num = allIntersectedScenes.getInfo().features.length //total number of scenes
  
  for(var N = 0; N < num; N++) {
    var NScene = ee.Feature(ee.List(allIntersectedScenes.toList(1, N)).get(0)); //get Nth
    var clippedFeatures = ee.FeatureCollection(ee.List(NScene.get('clipped_features'))).union(); //combine polygons into a single shape
    
    // visualize the Nth scene
    var NSceneFillIm = ee.Image().byte().paint(NScene).visualize({palette: 'FF8484',opacity:0.25,forceRgbOutput:true})
    var NSceneEdgeIm = ee.Image().byte().paint(NScene,0,4).visualize({palette: 'FF8484',opacity:0.75,forceRgbOutput:true})
    var clipFillIm = ee.Image().byte().paint(clippedFeatures).visualize({palette: 'FFFF00',opacity:0.5,forceRgbOutput:true})
    var clipEdgeIm = ee.Image().byte().paint(clippedFeatures,0,3).visualize({palette: 'FFFF00',opacity:0.25,forceRgbOutput:true})
    // Map.addLayer(NScene, {color:'ffaaaa'}, 'Scene #'+N,false);
    // Map.addLayer(clippedFeatures, {color:'ffff00'}, 'Clipped Coastline for Scene #'+N,false);
    
    var flat = ee.ImageCollection([bgIm,SceneEdgeIm,NSceneFillIm,NSceneEdgeIm,coastIm.clip(clippedFeatures),clipFillIm,clipEdgeIm]).mosaic()
    Map.addLayer(flat,{},'Scene #'+N,false)
    
  }
}

// // extract data from feature
// var saveFt = clippedFeatures.geometry().getInfo()
// print(saveFt)

// // load it after...
// var saveFt_AGAIN = ee.Feature(saveFt)
// Map.addLayer(saveFt_AGAIN, {color:'ff0000'}, 'SAVE FT',true); //coastline for end "goal"

//print(bg.getThumbURL({'region':JSON.stringify(bounds.coordinates().getInfo()[0]),'dimensions':'2000'}))