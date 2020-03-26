/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var srtm30 = ee.Image("USGS/SRTMGL1_003"),
    dam_geom = /* color: 98ff00 */ee.Geometry.LineString(
        [[-113.0683708190918, 36.20854607573818],
         [-113.06283473968506, 36.20158569932057]]),
    source_geom = /* color: 0b4a8b */ee.Geometry.Point([-113.05734157562256, 36.207230231127504]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// Determine the elevation at the point.

// Use a linestring (dam_geom) to indicate where the dam is located.
// Use a point (source_geom) to seed the flooded area.

var dam_elevations = srtm30.reduceRegion({
      reducer: ee.Reducer.min().combine({
        reducer2: ee.Reducer.max(),
        sharedInputs: true
      }),
      geometry: dam_geom,
      bestEffort: true
    });
var min_elevation = ee.Number(dam_elevations.get('elevation_min'));
var max_elevation = ee.Number(dam_elevations.get('elevation_max'));

print('min_elevation', min_elevation); 
print('max_elevation', max_elevation);   

var dam_image = ee.Image().byte().paint(dam_geom, 1, 10);
var potential = srtm30.gt(min_elevation).and(srtm30.lt(max_elevation))
    .updateMask(
      srtm30.lt(max_elevation).and(dam_image.mask().not()) 
    );

var cost = potential.cumulativeCost({
  source: ee.Image().byte().paint(source_geom, 1, 1),
  maxDistance: 1e5
});

Map.addLayer(srtm30, {min:500, max:2000}, 'elevation', false);
Map.addLayer(dam_image, {min:0, max:2}, 'dam_image', false);
Map.addLayer(potential, {min:0, max:2}, 'potential pixels v2', false);
Map.addLayer(
  srtm30.updateMask(cost.mask()),
  {min: min_elevation.getInfo(), max: max_elevation.getInfo(), palette:"black, blue"},
  'flooded region'
);
