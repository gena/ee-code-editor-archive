var assets = require('users/gena/packages:assets')
var animation = require('users/gena/packages:animation')

var bounds = Map.getBounds(true)
var images = assets.getImages(bounds, { 
  missions: ['S2', 'L8', 'L7'], 
  filter: ee.Filter.date('2016-01-01', '2019-01-01'),
  resample: true
})
images = assets.getMostlyCleanImages(images, bounds).sort('system:time_start')
images = images.map(function(i) { return i.log().set({label: i.date().format('YYYY-MM-dd HH:mm').cat(', ').cat(i.get('MISSION'))})})

print(images.size())
animation.animate(images, { maxFrames: 100, vis: { min: -2.2, max: -1.5, bands: ['red', 'green', 'blue'] }, label: 'label'  })
