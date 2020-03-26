/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var evi = ee.ImageCollection("Oxford/MAP/EVI_5km_Monthly");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var eviMean = evi.select('Mean').reduce(ee.Reducer.mean());
var vis = {min:0, max:0.6, palette:['663300','EAEAAE','93DB70','2F4F2F']};
Map.addLayer(eviMean, vis);

// A function to construct a legend for the given single-band vis
// parameters.  Requires that the vis parameters specify 'min' and 
// 'max' but not 'bands'.
function makeLegend(vis) {
  var lon = ee.Image.pixelLonLat().select('longitude');
  var gradient = lon.multiply((vis.max-vis.min)/100.0).add(vis.min);
  var legendImage = gradient.visualize(vis);
  
  // In case you really need it, get the color ramp as an image:
  print(legendImage.getThumbURL({bbox:'0,0,100,8', dimensions:'256x20'}));
  
  // Otherwise, add it to a panel and add the panel to the map.
  var thumb = ui.Thumbnail({
    image: legendImage, 
    params: {bbox:'0,0,100,8', dimensions:'256x20'},  
    style: {padding: '1px', position: 'bottom-center'}
  });
  var panel = ui.Panel({
    widgets: [
      ui.Label(String(vis['min'])), 
      ui.Label({style: {stretch: 'horizontal'}}), 
      ui.Label(vis['max'])
    ],
    layout: ui.Panel.Layout.flow('horizontal'),
    style: {stretch: 'horizontal'}
  });
  return ui.Panel().add(panel).add(thumb);
}

Map.add(makeLegend(vis));
