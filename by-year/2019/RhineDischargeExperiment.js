/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2"),
    geometry = /* color: #d63000 */ee.Geometry({
      "type": "GeometryCollection",
      "geometries": [
        {
          "type": "LineString",
          "coordinates": [
            [
              7.615456581115723,
              50.383375888694566
            ],
            [
              7.615499496459961,
              50.38132347956321
            ]
          ],
          "geodesic": true
        },
        {
          "type": "LinearRing",
          "coordinates": [
            [
              7.63850212097168,
              50.38808241157777
            ]
          ],
          "geodesic": true
        }
      ],
      "coordinates": []
    });
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.addLayer(s2.filterBounds(Map.getBounds(true)).select(['B8','B3','B2']).map(function(i) { return i.resample('bicubic')})
  .reduce(ee.Reducer.percentile([15])), {min:500, max:2500}, '15%')
Map.addLayer(s2.filterBounds(Map.getBounds(true)).select(['B8','B3','B2']).map(function(i) { return i.resample('bicubic')})
  .reduce(ee.Reducer.percentile([35])), {min:500, max:2500}, '35%')


var spring = s2.filterBounds(Map.getBounds(true)).filter(ee.Filter.dayOfYear(60, 150)).select(['B8','B3','B2'])
Map.addLayer(ee.Image(spring.toList(1,2).get(0)), {min:500, max:2500}, 'spring')

var autumn = s2.filterBounds(Map.getBounds(true)).filter(ee.Filter.dayOfYear(270, 330)).select(['B8','B3','B2'])
Map.addLayer(ee.Image(autumn.toList(1,0).get(0)), {min:500, max:2500}, 'autumn')

Map.addLayer(s2.filterBounds(Map.getBounds(true)).select(['B8']).map(function(i) { return i.resample('bicubic')})
  .reduce(ee.Reducer.stdDev()), {min:0, max:500}, 'stddev')

Map.addLayer(s2.filterBounds(Map.getBounds(true)).map(function(i) { return i.resample('bicubic').normalizedDifference(['B3', 'B8'])})
  .reduce(ee.Reducer.stdDev()), {min:0, max:500}, 'stddev, NDWI')

Map.addLayer(s2.filterBounds(Map.getBounds(true)).select(['B8']), {}, 'S2 RAW', false)

// https://developers.google.com/earth-engine/sentinel1

// Load the Sentinel-1 ImageCollection.
var sentinel1 = ee.ImageCollection('COPERNICUS/S1_GRD');


print(sentinel1.filterBounds(Map.getBounds(true)).select(0).size())
print(sentinel1.filterBounds(Map.getBounds(true)).aggregate_array('orbitProperties_pass'))

// Filter by metadata properties.
var vh = sentinel1
  // Filter to get images with VV and VH dual polarization.
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  // Filter to get images collected in interferometric wide swath mode.
  .filter(ee.Filter.eq('instrumentMode', 'IW'));

// Filter to get images from different look angles.
var vhAscending = vh.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));
var vhDescending = vh.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));

Map.addLayer(vh.filterBounds(Map.getBounds(true)), {}, 'RAW', false)

// Create a composite from means at different polarizations and look angles.
var composite = ee.Image.cat([
  vhAscending.select('VH').mean(),
  ee.ImageCollection(vhAscending.select('VV').merge(vhDescending.select('VV'))).mean(),
  vhDescending.select('VH').mean()
]).focal_median();

// Display as a composite of polarization and backscattering characteristics.
Map.addLayer(composite, {min: [-25, -20, -25], max: [0, 10, 0]}, 'composite');
    
var composite5 = ee.Image.cat([
  vhAscending.select('VH').reduce(ee.Reducer.percentile([5])),
  ee.ImageCollection(vhAscending.select('VV').merge(vhDescending.select('VV'))).reduce(ee.Reducer.percentile([5])),
  vhDescending.select('VH').reduce(ee.Reducer.percentile([5]))
]).focal_median();

// Display as a composite of polarization and backscattering characteristics.
Map.addLayer(composite5, {min: [-25, -20, -25], max: [0, 10, 0]}, 'composite 5%');

var composite75 = ee.Image.cat([
  vhAscending.select('VH').reduce(ee.Reducer.percentile([75])),
  ee.ImageCollection(vhAscending.select('VV').merge(vhDescending.select('VV'))).reduce(ee.Reducer.percentile([75])),
  vhDescending.select('VH').reduce(ee.Reducer.percentile([75]))
]).focal_median();

// Display as a composite of polarization and backscattering characteristics.
Map.addLayer(composite75, {min: [-25, -20, -25], max: [0, 10, 0]}, 'composite 75%');
