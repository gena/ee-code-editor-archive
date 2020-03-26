/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s2 = ee.ImageCollection("COPERNICUS/S2"),
    s1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    geometry = /* color: #d63000 */ee.Geometry.Polygon(
        [[[-90.08222579956055, 29.962593879274845],
          [-90.08162498474121, 29.946233430223234],
          [-90.06514549255371, 29.93820095194503],
          [-90.06360054016113, 29.94489472888879],
          [-90.06368637084961, 29.956570572537522]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var images = s2.filterBounds(ee.Geometry(Map.getBounds(true)))

var imageAverage = images.select('B11','B8','B3').reduce(ee.Reducer.percentile([15])).visualize({min:300, max:2500})
Map.addLayer(imageAverage, {}, 'image')

var water = images.select(['B3', 'B8']).map(function(i) { return i.normalizedDifference() }).mean().gte(0.01)
Map.addLayer(water.mask(water), {palette: ['0000ff']}, 'water')

var waterVector = water.mask(water).reduceToVectors({scale: Map.getScale(), geometry: Map.getBounds(true)}).geometry()


images = images.filterBounds(Map.getCenter()).toList(10)

for(var i=0; i<10; i++) {
  var image = ee.Image(images.get(i))

  Map.addLayer(image, {bands:['B11','B7','B3'], min:300, max:3000}, i.toString() + ' no resampling', i===0)

  Map.addLayer(image.resample('bicubic'), {bands:['B11','B7','B3'], min:300, max:3000}, i.toString(), i===0)
  
  var water = image.normalizedDifference(['B3', 'B8'])  
  Map.addLayer(water.mask(water.gt(0.1)), {palette:['0000ff']}, i.toString() + ' water, no resampling', i===0)

  var water = image.normalizedDifference(['B3', 'B8'])  
  Map.addLayer(water.mask(water.gt(0.1).focal_mode(15, 'circle', 'meters', 3)), {palette:['0000ff']}, i.toString() + ' water, no resampling, smoothing', i===0)

  var water = image.resample('bicubic').normalizedDifference(['B3', 'B8'])  
  Map.addLayer(water.mask(water.gt(0.1)), {palette:['0000ff']}, i.toString() + ' water', i===0)

}

var images = s1.filterBounds(ee.Geometry(Map.getBounds(true)).centroid(1))

var waterBoundary = ee.Algorithms.CannyEdgeDetector(water, 0.9, 0)
waterBoundary = waterBoundary.mask(waterBoundary).visualize({palette:['ffffff']})

var rendered = ee.ImageCollection(images.map(function(i) {
  var imageS1 = ee.Image(i).select(0).clip(waterVector.difference(geometry, Map.getScale()))
  var imageS1Edges = ee.Algorithms.CannyEdgeDetector(imageS1, 0.999, 5)
  imageS1Edges = imageS1Edges.mask(imageS1Edges).visualize({palette:['ff0000']})
  
  return ee.ImageCollection.fromImages([
    imageAverage,
    //waterBoundary,
    imageS1.visualize({min:-15, max:0, forceRgbOutput: true}),
    imageS1Edges
    ]).mosaic()
}))

var renderedList = rendered.toList(10)

for(var i=0; i<10; i++) {
  var image = ee.Image(renderedList.get(i))
  Map.addLayer(image, {}, 'rendered-' + i.toString(), i === 0)
}

Export.video.toDrive({collection: rendered, region: Map.getBounds(true), dimensions: 1920})


images = images.toList(12)

for(var i=0; i<10; i++) {
  var image1 = ee.Image(images.get(i)).select(0)
  
  Map.addLayer(image1.clip(waterVector), {min:-20, max:0}, i.toString(), i===0)
}

/*
images = images.toList(12)

for(var i=0; i<10; i++) {
  var image1 = ee.Image(images.get(i)).resample('bicubic').select(0)
  var image2 = ee.Image(images.get(i+1)).resample('bicubic').select(0)
  
  Map.addLayer(ee.Image([image1, image2, image1]).clip(waterVector), {min:-20, max:0}, i.toString(), i===0)
}*/