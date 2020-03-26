var community = { Algorithms: {} }

/***
 * Construct FeatureCollection from GeoJSON stored in Google Storage.
 * 
 * 1. ogr2ogr -f GeoJSON hello.geojson hello.shp 
 * 2. gsutil cp hello.geojson gs://<...>
 * 3. create Features from Storage
 * 
 * @param {string} path
 *     Path to the Google Storage file containing GeoJSON FeatureCollection.
 * 
 * @return {ee.FeatureCollection} A new feature collection.
 */
community.Algorithms.fromStorage = function(path) {
  var str = ee.Blob(path).string().getInfo()
  var o = JSON.parse(str)
  var features = o.features.map(function(f) { return ee.Feature(f) })

  return ee.FeatureCollection(features)
};

// =========================================================================================

var fc = community.Algorithms.fromStorage('gs://hydro-earth-v2/hello.geojson')

print('First feature: ', fc.first())

Map.addLayer(fc, {}, 'feature collection')
