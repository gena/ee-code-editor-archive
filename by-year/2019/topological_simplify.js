/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var basins = ee.FeatureCollection("users/gena/HydroEngine/hybas_lev06_v1c");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// GOAL: reproduce https://bost.ocks.org/mike/topology/#extract

// FAIL: geometry processing is far too slow in GEE ... 8-[

basins = basins.filterBounds(Map.getBounds(true))

// show basins and simplified basins
Map.addLayer(basins, {}, 'original')
Map.addLayer(basins.map(function(f) { return f.simplify(20000) }), { color: 'grey' }, 'simplified', false)

basins = basins.filterBounds(Map.getBounds(true))

var scale = Map.getScale() 

function method1() {
  function identifyJunctions(features) {
    // detect junctions  
    var junctions = features.map(function(f) {
      var filtered = features.filterBounds(f.geometry())
      
      // exclude f
      filtered = filtered.filter(ee.Filter.bounds(f.geometry().centroid()).not())
  
      var coords = ee.List(f.geometry().coordinates().get(0))
      
      var ring = ee.Algorithms.GeometryConstructors.LinearRing(coords)
  
      return filtered.map(function(f2) {
        var coords = f2.buffer(1000, scale).intersection(ring, scale).geometry().coordinates()
        
        return ee.Feature(ee.Algorithms.GeometryConstructors.Point(coords.get(0)))
      })
    }).flatten()
    
    return ee.FeatureCollection(junctions)
  }
  
  // convert multipolygons to polygons
  basins = polygonsToLineStrings(basins)

  var junctions = identifyJunctions(basins.limit(20))
  Map.addLayer(junctions, {color: 'coral'})
  print(junctions)
}  
  
function method2() {
  // convert multipolygons to polygons
  basins = polygonsToLineStrings(basins)

  // try to join basins in a similar way to polylines: 
  // https://code.earthengine.google.com/99b2ae1d44a102f23cbb8ef7f1b64994
  var filter = ee.Filter.intersects({ leftField: '.geo', rightField: '.geo' });
  var joined = ee.Join.inner('basin1', 'basin2').apply(basins, basins, filter);
  
  var intersections = joined
    .map(function(tuple) {
      var dict = ee.Feature(tuple);
      
      var basin1 = ee.Feature(dict.get('basin1')).geometry();
      var basin2 = ee.Feature(dict.get('basin2')).geometry();
    
      var intersection = basin1.intersection(basin2);
      
      return ee.Algorithms.Feature(intersection).set({type: intersection.type()})
    }).filter(ee.Filter.inList('type', ['LinearRing', 'LineString']))
    .map(function(f) {
      var coords = f.geometry().coordinates()
      var geom = ee.Algorithms.GeometryConstructors.Point(coords.get(0))
      
      return ee.Algorithms.Feature(geom)
    })
  
  Map.addLayer(intersections, { color: 'coral' }, 'intersections');
}

function method3() {
  var basinsRaster = ee.Image().float().paint(basins, 'PFAF_ID')
  Map.addLayer(basinsRaster.randomVisualizer(), {}, 'PFAF_ID', false)

  var junctions = basinsRaster.reduceNeighborhood(ee.Reducer.countDistinct(), ee.Kernel.circle(1)).gte(3)
    .focal_max(1)
  junctions = junctions.mask(junctions)
  Map.addLayer(junctions, {}, 'junctions')
  
  // convert junctions to features
  var junctionsVector = junctions.reduceToVectors({scale: Map.getScale(), geometry: Map.getBounds(true)})
  Map.addLayer(junctionsVector.geometry().buffer(Map.getScale()*3), {color: 'yellow'}, 'junctions (vector)')

  // convert multipolygons to polygons
  basins = explodeMultipolygons(basins)

  // var basinsClipped = basins.map(function(f) {
  //   var junctionsVector = junctions.reduceToVectors({
  //     geometry: f.geometry(), 
  //     scale: scale,
  //     tileScale: 16
  //   })
    
  //   return f.set({size: junctionsVector.size(), junctions: junctionsVector})
  // }).filter(ee.Filter.gt('size', 0))
  
  // print(basinsClipped)
  
  // basinsClipped = basinsClipped.map(function(f) {
  //   var junctionsVector = ee.Feature(f.get('junctions'))

  //   //return junctionsVector

  //   return f.difference(junctionsVector, scale).simplify(scale * 10)
  // })//.flatten()
  
  // Map.addLayer(basinsClipped, {color: 'red'})
}

//method1()
//method2()
method3()







function explodeMultipolygons(polygons) {
  return polygons.map(function(f) {
    return ee.FeatureCollection(f.geometry().geometries().map(function(g) {
      return ee.Algorithms.Feature(g).copyProperties(f)
    }))
  }).flatten()
}


function polygonsToLineStrings(polygons) {
  return polygons.map(function(f) {
    return ee.FeatureCollection(f.geometry().geometries().map(function(g) {
      g = ee.Algorithms.GeometryConstructors.LineString(ee.Geometry(g).coordinates().get(0))
     
      return ee.Algorithms.Feature(g)//.copyProperties(f)
    }))
  }).flatten()
}

function printCoordinateCount() {
  // print total number of coordinates
  var counts = basins.map(function(f) { 
    return ee.Feature(null, {count: f.geometry().coordinates().flatten().size() })
  })
  print(counts.aggregate_sum('count'))
}

// printCoordinateCount()
