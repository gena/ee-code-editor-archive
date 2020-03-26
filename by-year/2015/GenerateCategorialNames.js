//specify regions corresponding to different vegetation types, here as representative rectangles with specified coordinates
var regions = ee.FeatureCollection([
 ee.Feature(ee.Geometry.Rectangle(-121.657, 38.109, -121.654, 38.108), {name: 'Rice'}),
 ee.Feature(ee.Geometry.Rectangle(-122.024, 38.199, -122.02, 38.197), {name: 'Annual grassland'}),
 ee.Feature(ee.Geometry.Rectangle(-121.875, 37.847, -121.873, 37.8455), {name: 'Forest'}),
 ee.Feature(ee.Geometry.Rectangle(-121.803, 37.8615, -121.8015, 37.8603), {name: 'Shrubland'}),
 ee.Feature(ee.Geometry.Rectangle(-121.825, 38.049, -121.823, 38.0473), {name: 'Wetland'}),
 ee.Feature(ee.Geometry.Rectangle(-121.825, 38.049, -121.823, 38.0473), {name: 'Wetland'}),
 ee.Feature(ee.Geometry.Rectangle(-121.825, 38.049, -121.823, 38.0473), {name: 'Wetland'}),
]);

function categorize(fc, prop) {
  var uniqueValues = ee.List(fc.distinct(ee.SelectorSet(prop)).sort(prop).aggregate_array(prop))
  
  return fc.map(function(f) {
    return f.set(prop + '_category', uniqueValues.indexOf(f.get(prop)))
  })
}

var count = regions.aggregate_count_distinct('name').getInfo();

var palette=['FF0000','00FF00','0000FF', '8b4500', '000000', '00FFFF'];
var regionsimage=ee.Image().toByte();
var paintimage=regionsimage.paint(categorize(regions, 'name'), 'name_category', 4);
Map.addLayer(paintimage, {palette:palette, min:0, max:count});

Map.centerObject(regions)