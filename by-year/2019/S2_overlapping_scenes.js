/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: #d63000 */ee.Geometry.Point([-4.625244140625, 58.58543569119917]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var animation = require('users/gena/packages:animation')
var palettes = require('users/gena/packages:colorbrewer').Palettes

Map.centerObject(geometry, 12)

var imagesAll = ee.ImageCollection('COPERNICUS/S2')

Map.addLayer(imagesAll.filterDate('2018-01-01', '2018-02-01').select(0).count(), {min: 9, max: 68, palette: palettes.RdYlGn[5]}, 'count', true, 0.7)

var images = imagesAll 
  .filterBounds(geometry)
  .map(function(i) { 
    return i.visualize({bands: ['B12', 'B8', 'B8A'], min: 500, max: 3500})
      .set({label: i.date().format()})
  })

animation.animate(images, {maxFrames: 50})