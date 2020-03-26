/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8raw = ee.ImageCollection("LANDSAT/LC08/C01/T1_RT"),
    l8toa = ee.ImageCollection("LANDSAT/LC08/C01/T1_TOA"),
    goes16 = ee.ImageCollection("NOAA/GOES/16/FDCF");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
//kincade firee
var animation = require('users/gena/packages:animation')
var utils = require('users/gena/packages:utils')
var palettes = require('users/gena/packages:palettes')


var start = ee.Date("2019-10-24")
var stop = ee.Date("2019-10-28")

// add GOES images to map
var goes = goes16.filterDate(start, stop).select('Temp')

print(goes, 'goes')

// add white background
//Map.addLayer(ee.Image(0), {min: 0, max: 1}, 'black', true, 0.5)

goes = goes.map(function(i) {
  i = i.unmask().resample('bicubic')
  i = i.updateMask(i.unitScale(500, 12000))
  // i = i.updateMask(i.gt(0))
  // i = i.set({ label: i.date().format() })
  return i
})

Map.addLayer(ee.Image(0), { palette: ['000000']}, 'black', true, 0.5)

var goesFrames = ee.List.sequence(0, 24 * 5, 2).map(function(h) {
  var t = start.advance(h, 'hour')
  return goes.filterDate(t, t.advance(120, 'minute')).max().unitScale(500, 12000)
    .set({ label: t.format() })
})

animation.animate(goesFrames, {
  vis: { min: 0, max: 1,  palette: palettes.cb.YlOrRd[9].slice(0).reverse() },
  label: 'label',
  maxFrames: goesFrames.size(),
  opacity: 0.9
})


// animation.animate(goes, {
//   vis: { min: 0, max: 1, 
//   palette: [
//     'red',  // Good quality fire pixel
//     'white',           // Good quality fire free land
//   ], opacity: 0.8 },
//   label: 'label',
//   maxFrames: goes.size()
// })
// animation.animate(goes, {
//   vis: { 
//   min: 0, max: 1,  palette: palettes.cb.YlOrRd[9].slice(0).reverse(), 
//   opacity: 0.9 },
//   label: 'label',
//   maxFrames: goes.size()
// })

// animation.animate(goes, {
//   vis: { min: 0, max: 5, palette: [
//     'red',  // Good quality fire pixel
//     'white',           // Good quality fire free land
//     'white',            // Opaque cloud
//                       // Bad surface type, sunglint, LZA threshold exceeded,
//     'black',   // off earth, or missing input data
//     'black',    // Bad input data
//     'black'        // Algorithm failure
//   ], opacity: 0.8 },
//   label: 'label',
//   maxFrames: goes.size()
// })

//Landsat 8 raw image on 12/10/2018

// var i2 = ee.Image("LANDSAT/LC08/C01/T1_RT/LC08_044032_20181210");
// var post = ee.Algorithms.Landsat.simpleComposite({
//   collection: i2,
//   asFloat: true
// });
// Map.addLayer(post, {bands: ['B6', 'B5', 'B4'], max: 0.5}, 'SWIR-NIR-R-2');
//Map.addLayer(LT2, {bands: ['B6', 'B5', 'B4'], max: 0.5}, 'SWIR-NIR-R-2');
//Export (change dimensions or scale for higher quality).
// Export.video.toDrive({
//   collection: collection,
//   description: 'campfire',
//   dimensions: 720,
//   framesPerSecond: 12,
//   region: polygon
// });
Map.setCenter(-122.7483, 38.7307, 11)


var legend = ui.Panel({
  style: {
    position: 'top-right',
    padding: '8px 15px'
  }
});

var legend2 = ui.Panel({
  style: {
    position: 'bottom-right',
    padding: '8px 15px'
  }
});

// Create and add the legend title.
var legendTitle1 = ui.Label({
  value: 'Animation will start when all layers load after',
  style: {
    fontWeight: 'bold',
    fontSize: '10px',
    margin: '0 0 4px 0',
    padding: '0'
  }
});

var legendTitle2 = ui.Label({
  value: 'a few minutes. Please press play to start.',
  style: {
    fontWeight: 'bold',
    fontSize: '10px',
    margin: '0 0 4px 0',
    padding: '0'
  }
});

var checkbox = ui.Checkbox( 'Show Landsat layer',false);


checkbox.onChange(function(checked) {
  // Shows or hides the first map layer based on the checkbox's value.
  
  Map.layers().get(0).setShown(checked);
 
});

checkbox.style({
    fontWeight: 'bold',
    fontSize: '10px',
    margin: '0 0 4px 0',
    padding: '0'
  })


legend.add(legendTitle1).add(legendTitle2)
legend2.add(checkbox)
Map.add(legend).add(legend2)

Map.setOptions('HYBRID'); 