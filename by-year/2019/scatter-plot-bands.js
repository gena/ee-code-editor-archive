/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var images = ee.ImageCollection("COPERNICUS/S2");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var scale = Map.getScale()
var region = ee.Geometry(Map.getCenter()).buffer(scale*50)

Map.addLayer(region)

var image = ee.Image(images.filterBounds(region).toList(1,2).get(0))
  .divide(10000)
  .select(['B8A', 'B8','B4'])

Map.addLayer(image, {bands: ['B8','B8A','B4'], min:0.1, max:0.3}, 'image')

var values = image.sample({region: region, scale: 10, numPixels: 5000})

var chart = ui.Chart.feature.byFeature({
  features: values, 
  xProperty: 'B4', 
  yProperties: ['B8', 'B8A']
})

chart = chart.setOptions({
  hAxis: { title: "RED", viewWindow: {min:0, max:0.5} },
  vAxis: { title: 'NIR1, NIR2', viewWindow: {min:0, max:0.5} },
  width: 400,
  height: 400,
  pointSize: 1,
  lineWidth: 0,
  dataOpacity: 0.1
});

print(chart)
