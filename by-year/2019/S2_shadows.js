/***
 * Estimate cloud shadows by projecting cloud mask using sun parameters.
 * 
 * @author Gennadii Donchyts (gennadiy.donchyts@gmail.com)
 * @author Ian Housman (ian.housman@gmail.com)
 * 
 */

/***
 * Projects cloud shadow from cloud mask using sun parameters.
 * 
 * @param {ee.Image} cloud mask
 * @param {number} sun azimuth in degrees
 * @param {number} shadow offset, currently empirical parameter used to scale the shadow offset
 */
function projectShadows(cloudMask, sunAzimuth, offset) {
  var azimuth = ee.Number(sunAzimuth).multiply(Math.PI).divide(180.0).add(ee.Number(0.5).multiply(Math.PI))
  var x = azimuth.cos().multiply(10.0).round();
  var y = azimuth.sin().multiply(10.0).round();
  var shadow = cloudMask.changeProj(cloudMask.projection(), cloudMask.projection().translate(x.multiply(ee.Number(offset)), y.multiply(ee.Number(offset))))

  return shadow
}

// ==================================== example

var point = ee.Geometry(Map.getBounds(true)).centroid(1);

var sentinel2 = ee.ImageCollection('COPERNICUS/S2').filterBounds(point); 
var bands = ['B4', 'B3', 'B2', 'QA60'];



var image = ee.Image(sentinel2.filterDate('2016-03-15', '2016-12-31').first()).select(bands);

Map.addLayer(image, { bands:['B4','B3','B2'], min:600, max: [4000, 4000, 5000], gamma:1.5}, 'image');

var cloud = image.select('QA60')

var cloud2 = cloud.focal_max(10)
var shadow = projectShadows(cloud2, image.get('MEAN_SOLAR_AZIMUTH_ANGLE'), 5)

Map.addLayer(shadow, {palette: ['000000'], opacity: 0.7}, 'shadow');

Map.addLayer(cloud2, {palette: ['ffff00'], opacity: 0.5}, 'cloud (dilated)');
Map.addLayer(cloud, {palette: ['ffff00'], opacity: 0.5}, 'cloud');


function arraySort(collection, bandIndex) {
  var bandNames = ee.Image(collection.first()).bandNames();
  
  var axes = {image:0, band:1}

  var array = collection.toArray()

  // sort array by the given band
  var sort = array.arraySlice(axes.band, bandIndex, ee.Number(bandIndex).add(1)); 
  var sorted = array.arraySort(sort);
  
  var sorted = ee.List.sequence(0, collection.size().subtract(1)).map(function(i) {
    var from = ee.Image.constant(i).int()
    var to = ee.Image.constant(ee.Number(i).add(1)).int()
    
    return sorted
        .arraySlice(axes.image, from, to)
        .arrayProject([axes.band]).arrayFlatten([bandNames])
  })
  
  sorted = ee.ImageCollection(sorted)

  Map.addLayer(sorted, {}, 'sorted', false)
  
  return sorted
}

var sorted = arraySort(sentinel2, 7) // nir

var list = sorted.toList(46)
for(var i=0; i<46; i++) {
  Map.addLayer(ee.Image(list.get(i)).select(bands), {min:600, max: [4000, 4000, 5000], gamma:1.5}, i.toString(), i === 0)
}
 
Map.addLayer(ee.Image(sorted), {}, 'raw (sorted)', false)

/*
Map.addLayer(sentinel2, {}, 'raw', false)
Map.addLayer(sentinel2.select(0).count(), {}, 'count', false)
Map.addLayer(sentinel2.select(bands).reduce(ee.Reducer.percentile([5])), {min:600, max: [4000, 4000, 5000], gamma:1.5}, '5%')
Map.addLayer(sentinel2.select(bands).reduce(ee.Reducer.percentile([1])), {min:600, max: [4000, 4000, 5000], gamma:1.5}, '1%')
Map.addLayer(sentinel2.select(bands).reduce(ee.Reducer.percentile([1])), {min:600, max: [4000, 4000, 5000], gamma:1.5}, '10%')
Map.addLayer(sentinel2.select(bands).reduce(ee.Reducer.percentile([1])), {min:600, max: [4000, 4000, 5000], gamma:1.5}, '15%')
*/