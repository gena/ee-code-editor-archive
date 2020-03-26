var animation = require('users/gena/packages:animation')
var assets = require('users/gena/packages:assets')

var images = assets.getImages(Map.getCenter(), {
  //missions: ['S2'],
  missions: ['S2', 'L8', 'L7'],
  includeTier2: true,
  resample: true,
  //filter: ee.Filter.date('2016-01-01', '2019-01-01')
  //filter: ee.Filter.date('2017-01-01', '2018-01-01')
  filter: ee.Filter.date('2017-05-01', '2017-09-01')
}).map(function(i) { return i.set({label: i.date().format().cat(', ').cat(i.get('MISSION')) })})
  
// images = assets.getMostlyCleanImages(images, Map.getBounds(true), {
//   //cloudFrequencyThresholdDelta: 0.15,
// })

images = images.sort('system:time_start')
print(images.size())

animation.animate(images, {
  vis: {min: 0.05, max: 0.4}, 
  label: 'label',
  maxFrames: 150
})
