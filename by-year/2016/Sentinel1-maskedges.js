var collection = ee.ImageCollection('COPERNICUS/S1_GRD').filterMetadata('instrumentMode', 'equals', 'IW').
filter(ee.Filter.eq('transmitterReceiverPolarisation', 'VV'));

var c = ee.Geometry.Point(2.46, 48.57)

function maskEdge(img) { 
  var mask = img.select(0).unitScale(-25, 5).multiply(255).toByte().connectedComponents(ee.Kernel.rectangle(1,1), 100);
  return img.updateMask(mask.select(0));  
}

var im = ee.Image(collection.filterDate('2015-03-01', '2015-03-31').filterBounds(c).first())
Map.addLayer(im, {bands: ['VV'], min:-25, max: 0}, 'VV non-masked');

collection = collection.map(maskEdge);

var im = ee.Image(collection.filterDate('2015-03-01', '2015-03-31').filterBounds(c).first())
Map.addLayer(im, {bands: ['VV'], min:-25, max: 0}, 'VV masked');

var im = ee.Image(collection.filterDate('2015-03-01', '2015-03-31').filterBounds(c).first())
Map.addLayer(im, {bands: ['VH'], min:-25, max: 0}, 'VH masked');
