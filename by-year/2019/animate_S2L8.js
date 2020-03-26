/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[12.27448884972961, 45.457258557728196],
          [12.27448884972961, 45.40847127795317],
          [12.388643665403437, 45.40847127795317],
          [12.388643665403437, 45.457258557728196]]], null, false);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')

var images = assets.getImages(Map.getCenter(), { missions: ['S2', 'L8'], filter: ee.Filter.date('2019-03-24', '2020-03-24') })
print(images.size())
images = assets.getMostlyCleanImages(images, geometry, { scale: Map.getScale() * 5 })
print(images.size())

images = images.filterDate('2020-01-01', '2020-11-01').sort('system:time_start')
  .map(function(i) {
    return i.set({ label: i.date().format() })
  })
print(images.size())

animation.animate(images, { 
  label: 'label', 
  vis: { min:[0.06, 0.06, 0.1], max: [0.3, 0.3, 0.35], bands: ['red', 'green', 'blue'], gamma: 1.4 },
  maxFrames: 100
})