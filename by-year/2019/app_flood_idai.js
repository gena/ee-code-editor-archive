/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var image2 = ee.Image("users/gena/DISASTERS/CycloneIdai/20190324_075145_ssc2_u0001_pansharpened"),
    image3 = ee.Image("users/gena/DISASTERS/CycloneIdai/20190323_130708_ss02_u0001_pansharpened"),
    image = ee.Image("users/gena/DISASTERS/CycloneIdai/20190324_103949_ssc11_u0001_pansharpened"),
    image4 = ee.Image("users/gena/DISASTERS/CycloneIdai/20190329_074053_ssc2_u0001_pansharpened"),
    s1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    geometry = 
    /* color: #98ff00 */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[33.920296688700205, -18.761179783777227],
          [33.920296688700205, -20.502098914938028],
          [35.142525692606455, -20.502098914938028],
          [35.142525692606455, -18.761179783777227]]], null, false);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var animation = require('users/gena/packages:animation')
var assets = require('users/gena/packages:assets')

Map.setOptions('HYBRID')

function appSentinel1() {
  Map.centerObject(geometry)
  var bounds = geometry
  
  var images = assets.getImages(bounds, {
    missions: ['L8', 'S2'],
    resample: true,
    filter: ee.Filter.date('2019-01-01', '2019-05-05')
  })
  print(images.sort('system:time_start', false).first())
  
  
  // Functions to convert from dB
  function toNatural(i) {
    return ee.Image(ee.Image.constant(10.0).pow(i.divide(10.0)).copyProperties(i, ['system:time_start']));
  }
  
  var bands = ['B1', 'B2']
  function processS1(i) {
    i = i.select([0, 1]).rename(bands)
    //i = i.clip(i.geometry().buffer(-250))
    return toNatural(i).set({label: i.date().format()})
      .set({'system:time_start': i.get('system:time_start')})
  }
  
  var image1 = s1.filterBounds(bounds)
    //.filterDate('2018-12-01', '2019-03-10')
    .filterDate('2018-03-01', '2018-04-10')
    .map(processS1)
  
  image1 = image1.reduce(ee.Reducer.percentile([2])).rename(bands)
  
  var image2 = s1.filterBounds(bounds).filterDate('2019-03-01', '2019-04-10').map(processS1)
    .sort('system:time_start')
    
  animation.animate(image2, {vis: {min: 0, max: 0.2, bands: ['B1', 'B1', 'B2'] }, label: 'label', preload: false, position: 'bottom-center'})
  
  print(image2.size())
  image2 = image2.reduce(ee.Reducer.min()).rename(bands)
  
  var flood = image1.subtract(image2)
  
  /// Map.addLayer(images.reduce(ee.Reducer.percentile([20])), { min: 0.0, max: 0.3 }, 'S2', false)
  Map.addLayer(image1, { bands: [bands[0], bands[0], bands[1]], min: 0, max: 0.15 }, 'image before cyclone (2018, Mar)', false)
  Map.addLayer(image2, { bands: [bands[0], bands[0], bands[1]],  min: 0, max: 0.2 }, 'image, after cyclone (2019, Mar)', true)
  
  Map.addLayer(flood.updateMask(flood.select('B1').unitScale(0, 0.02)), { bands: ['B2', 'B1', 'B1'], min: 0, max: 0.2 }, 'flood')

  
  var panel = ui.Panel([ui.Label('Planet SkySat', null, 'https://gena.users.earthengine.app/view/cycloneidai')])
  panel.style().set({ position: 'bottom-left'})
  Map.add(panel)
}

var imagesS = ee.ImageCollection([
  image3.multiply(2).float().set({ 'system:time_start': ee.Date('2019-03-23T13:07:08').millis() }),
  image2.set({ 'system:time_start': ee.Date('2019-03-24T07:51:45').millis() }), 
  image.set({ 'system:time_start': ee.Date('2019-03-24T10:39:49').millis() }), 
  image4.set({ 'system:time_start': ee.Date('2019-03-29T07:40:53').millis() })
  ])

imagesS = imagesS.map(function(i) {
  return i.divide(100)
    .set({label: i.date().format()})
})


function appSkySat() {
  // add composite image and water
  var image = imagesS.reduce(ee.Reducer.firstNonNull()).rename(['b1', 'b2', 'b3', 'b4'])
  
  var layerImage = ui.Map.Layer(image, {min: 10, max: [70, 70, 70], gamma: 1.4, bands: ['b4', 'b4', 'b3']}, 'image (2019, March 23-29), Planet SkySat')
  Map.layers().add(layerImage)
  
  var water = image.normalizedDifference(['b3', 'b4'])
  water = water.updateMask(water.unitScale(0.0, 0.25)).visualize({min: 0, max: 0.25, palette: ['000000', '00ffff']})
  var black = ee.Image(0).visualize({ palette: ['000000'], opacity: 0.4})
  
  var layerWater = ui.Map.Layer(black.blend(water), {}, 'water')
  Map.layers().add(layerWater)
  
  // animate raw images
  
  // animate water images
  var imagesSwater = imagesS.map(function(i) {
    var water = i.normalizedDifference(['b3', 'b4'])
    water = water.updateMask(water.unitScale(0.0, 0.25)).visualize({min: 0, max: 0.25, palette: ['000000', '00ffff']})
    var black = ee.Image(0).visualize({ palette: ['000000'], opacity: 0.4})
    
    return black.blend(water).set({ 'label': i.get('label') })
  })
  
  
  var buttonAnimate = ui.Button('Animate')
  
  buttonAnimate.onClick(function() {
    if(buttonAnimate.getDisabled()) {
      return
    }
    
    buttonAnimate.setDisabled(true)
    
    layerImage.setShown(false)
    layerWater.setShown(false)
    
    animation.animate(imagesS, { vis: {min: 10, max: [80, 80, 80], gamma: 1.4, bands: ['b4', 'b4', 'b2']}, label: 'label', position: 'bottom-center' })
    animation.animate(imagesSwater, { label: 'label', preload: false })
  })
  
  var panel = ui.Panel([buttonAnimate, ui.Label('Sentinel-1', null, 'https://gena.users.earthengine.app/view/cyclone-idais1')])
  
  panel.style().set({ position: 'bottom-left'})
  Map.add(panel)
  
  Map.setCenter(34.890515, -19.835301, 15)
}

appSkySat()
// appSentinel1()