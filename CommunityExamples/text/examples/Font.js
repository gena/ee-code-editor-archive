/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var image = ee.Image("users/gena/fonts/Arial16");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
Map.setCenter(0, 0)

var proj = image.projection()
var scale = Map.getScale() // best seen at native resolution


image = image.changeProj(proj, proj.scale(scale, -scale))

Map.addLayer(image)
