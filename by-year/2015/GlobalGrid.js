/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var countries = ee.FeatureCollection("ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var generateGrid = function(xmin, ymin, xmax, ymax, dx, dy) {
  var polys = [];
  var i = 0;
  for (var x = xmin; x < xmax; x += dx) {
    var j = 0;

    var x1 = Math.max(-179.99, Math.min(179.99, x));
    var x2 = Math.max(-179.99, Math.min(179.99, x + dx));
    
    for (var y = ymin; y < ymax; y += dy) {
      var y1 = Math.max(-89.99, Math.min(89.99, y));
      var y2 = Math.max(-89.99, Math.min(89.99, y + dy));

      polys.push(ee.Feature(ee.Geometry.Rectangle(x1, y1, x2, y2)).set('i',i).set('j', j));
      j++;
    }
    i++;
  }
  print("Cell count: " + polys.length)

  return ee.FeatureCollection(polys);
}

function getIntersection(left, right) {
  var spatialFilter = ee.Filter.intersects({leftField: '.geo', rightField: '.geo', maxError: 1000});
  var saveAllJoin = ee.Join.saveAll({matchesKey: 'match'});
  var intersectJoined = saveAllJoin.apply(left, right, spatialFilter);

  return intersectJoined.map(function(f) { 
    var match = ee.List(f.get('match'));
    return f.set('count', match.length())
  }).filter(ee.Filter.gt('count', 0))
}

var countries = countries.filter(ee.Filter.neq('Country', 'Antarctica'))
Map.addLayer(countries, {}, 'countries', false)

// generate global grid
var xmin = -180, xmax = 180, ymin = -90, ymax = 90, dx = 10, dy = 10;
var grid = generateGrid(xmin, ymin, xmax, ymax, dx, dy);
Map.addLayer(grid, {}, 'grid', false)


var countriesGrid = getIntersection(grid, countries)
print(countriesGrid)

Map.addLayer(countriesGrid, {}, 'countries grid')


// add HydroBASINS, level 3
var basins = ee.FeatureCollection('ft:13dShZ5yGqCEqk3dsJvYEL3lsa1hEmpMRldxK7aSa').geometry()

//var basinsImage = ee.Image(0).toByte().paint(basins, 1);
//Map.addLayer(basinsImage.mask(basinsImage), {}, 'basins')

var intersected = getIntersection(grid, basins)
print(intersected.first())
Map.addLayer(intersected, {}, 'intersected cells', false);

// export
Export.table(grid)
//Export.table(ee.FeatureCollection(intersected))
