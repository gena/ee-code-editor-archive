var region = ee.Geometry.Polygon([[[-6.7236328125, 39.40224434029275],[-1.845703125, 39.50404070558415],[-1.7578125, 41.9022770409637],[-7.119140625, 41.9022770409637]]]);

var image_collection = ee.ImageCollection('MODIS/MCD43A4').filterDate('2016-01-01', '2016-12-31');
var Composite = function(image)  {
    var img = image.multiply(0.0001);
    var red = img.select('Nadir_Reflectance_Band1');
    var blue = img.select('Nadir_Reflectance_Band3'); 
    var green = img.select('Nadir_Reflectance_Band4');
    var out = ee.Image.cat(green,red,blue).rename(['green','red','blue']);
    return out.copyProperties(image, ['system:time_start']);
};   

var collects = image_collection.map(Composite)

function getPercentileBandwise(collection, percentile, bandIndex) {
  var bandNames = ee.Image(collection.first()).bandNames();
  
  var axes = {image:0, band:1}

  var array = collection.toArray()

  // sort array by the given band
  var sort = array.arraySlice(axes.band, bandIndex, ee.Number(bandIndex).add(1)); 
  var sorted = array.arraySort(sort);
  
  // Map.addLayer(array, {}, 'unsorted', false)
  // Map.addLayer(sorted, {}, 'sorted', false)

  // find index of the percentile
  var index = sorted.arrayLength(axes.image).multiply(ee.Number(percentile).multiply(0.01)).int();
  
  // get values of all bands
  var values = sorted.arraySlice(axes.image, index, index.add(1));
  
  return values.arrayProject([axes.band]).arrayFlatten([bandNames])
}

var sortBand = 0 // green

var p25 = getPercentileBandwise(collects, 25, sortBand)
Map.addLayer(p25.clip(region), {bands: ['red'], min:0, max:0.3}, '25%', false)

var p0 = getPercentileBandwise(collects, 0, sortBand)
Map.addLayer(p0.clip(region), {bands: ['red'], min:0, max:0.3}, '0% (min)')



// compute min value using qualityMosaic()
collects = collects.map(function(i) { 
  var score = ee.Image.constant(1).subtract(i.select('green')).rename('score');
  return ee.Image(i).addBands(score).copyProperties(i, ['system:time_start']);
});

var red_when_green_was_minimum = collects.qualityMosaic('score').select('red').clip(region);
Map.addLayer(red_when_green_was_minimum, {min:0, max:0.3}, 'min qualityMosaic');

// compute mean within region
var min = red_when_green_was_minimum.reduceRegion(ee.Reducer.min(), region, 1000).get('red')
print(min);

// show location
var minImage = red_when_green_was_minimum.eq(ee.Image.constant(min))
Map.addLayer(minImage.mask(minImage).focal_max(2), {palette:['ff0000']}, 'min location')


// this is very strange, what does qualityMosaic() do ?!?
var diff = p0.subtract(red_when_green_was_minimum).abs().select('red')
Map.addLayer(diff.mask(diff.multiply(100)), {min:0, max:0.1, palette:['ffffff','ff0000']}, 'error')
