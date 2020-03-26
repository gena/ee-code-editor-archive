/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var gsmap = ee.ImageCollection("JAXA/GPM_L3/GSMaP/v6/operational");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var animation = require('users/gena/packages:animation')
var palettes = require('users/gena/packages:palettes')
var palette = palettes.cb.PuRd[7]

Map.setOptions('HYBRID')

var p = gsmap.select('hourlyPrecipRate').filterDate('2017-06-06', '2017-06-08')
  .map(function(i) { return i.resample('bicubic')})

var frames = p
.map(function(i) {
  return i.updateMask(i.unitScale(0, 15)).visualize({palette: palette, min: 0, max: 15}) 
    .set({label: i.date().format()})
})

var total = p.sum()
Map.addLayer(total.updateMask(total.unitScale(0, 15)), {min: 0, max: 450, palette: palette}, 'total')

animation.animate(frames, {maxFrames: 100, label: 'label'})