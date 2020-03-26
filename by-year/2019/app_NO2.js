/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var no2 = ee.ImageCollection("COPERNICUS/S5P/NRTI/L3_NO2");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var palettes = require('users/gena/packages:palettes')
var utils = require('users/gena/packages:utils')
var animation = require('users/gena/packages:animation')

// TODO: refactor this, encapsulate everything

/*** 
 * UI control for image layer styling
 * 
 */
var buttonApply = null

function ImageStylePanel() {
  function OnSelectStyleChange() {
      buttonApply.setDisabled(true)
      selectStyle.setDisabled(true)
      textMin.setDisabled(true)
      textMax.setDisabled(true)

      var currentStyle = selectStyle.getValue()

      var p1 = 10
      var p2 = 90

      switch(currentStyle) {
        case 'Custom':
          min = parseFloat(textMin.getValue()) / 1000000
          max = parseFloat(textMax.getValue()) / 1000000

          buttonApply.setDisabled(false)
          selectStyle.setDisabled(false)
          textMin.setDisabled(false)
          textMax.setDisabled(false)
          break;
        case 'Stretch: 90%':
          p1 = 10
          p2 = 90
          break;
        case 'Stretch: 98%':
          p1 = 2
          p2 = 98
          break;
        case 'Stretch: 99%':
          p1 = 1
          p2 = 99
          break;
        case 'Stretch: 100%':
          p1 = 0
          p2 = 100
          break;
      }
      
      if(currentStyle !== 'Custom') {
        var stat = image.reduceRegion({
          reducer: ee.Reducer.percentile([p1, p2]), 
          geometry: Map.getBounds(true), 
          scale: Map.getScale() * 10,
          bestEffort: true
        })

        stat.evaluate(function(stat) {
          var values = Object.keys(stat).map(function(key) { return stat[key] })
          min = values[0]
          max = values[1]
          
          textMin.setValue(min * 1000000)
          textMax.setValue(max * 1000000)
          
          selectStyle.setDisabled(false)
          buttonApply.setDisabled(false)
        })
      }
  }
  
  function OnButtonApplyClick() {
    updateImageLayer()
  }
  
  function OnTextMinChanged() {
    min = parseFloat(textMin.getValue()) / 1000000
    buttonApply.setDisabled(false)
  }

  function OnTextMaxChanged() {
    max = parseFloat(textMax.getValue()) / 1000000
    buttonApply.setDisabled(false)
  }

  var layout = ui.Panel.Layout.flow('horizontal')

  var styles = ['Custom', 'Stretch: 90%', 'Stretch: 98%', 'Stretch: 99%', 'Stretch: 100%']
  var selectStyle = ui.Select({ items: styles, value: 'Custom', onChange: OnSelectStyleChange })
  buttonApply = ui.Button({ label: 'Apply', onClick: OnButtonApplyClick, disabled: true })
  var textMin = ui.Textbox({ value: min * 1000000, style: { width: '50px' }, onChange: OnTextMinChanged })
  var textMax = ui.Textbox({ value: max * 1000000, style: { width: '50px' }, onChange: OnTextMaxChanged })

  var widgets = [textMin, textMax, selectStyle, buttonApply]
  var style = { width: '360px' }
  var panel = ui.Panel(widgets, layout)

  Map.onChangeZoom(function() {
    selectStyle.setValue('Custom', true)
    buttonApply.setDisabled(true)
  })

  Map.onChangeBounds(function() {
    selectStyle.setValue('Custom', true)
    buttonApply.setDisabled(true)
  })

  Map.onChangeCenter(function() {
    selectStyle.setValue('Custom', true)
    buttonApply.setDisabled(true)
  })

  return panel
}

var lastDate = no2.sort('system:time_start', false).first().date()

no2 = no2.map(function(i) {
  return i.select('NO2_column_number_density')// .resample('bicubic')
})

var no2km2 = no2.map(function(i) {
  i = i.multiply(1000000).set({'system:time_start': i.get('system:time_start') })
  i = i.where(i.lt(0), 0)
  return i
})

var tCurrent = ee.Date(new Date())
var t3m = tCurrent.advance(-1, 'month')
var imageP90 = no2.filterDate(t3m, tCurrent).reduce(ee.Reducer.percentile([90]))

imageP90 = imageP90.where(imageP90.lt(0), 0)

/*
var crsTransform = [
    0.01,
    0,
    -180,
    0,
    -0.01,
    90
]

Export.image.toAsset({
  //image: image, description: 'no2', assetId: 'users/gena/no2_2018_07_2019_02',
  image: imageP90, description: 'no2_p90', assetId: 'users/gena/no2_2018_07_2019_02_p90', 
  crs: 'EPSG:4326', crsTransform: crsTransform, dimensions: '36000x18000', maxPixels: 1e11
})*/

var last = no2.filterDate(lastDate.advance(-2, 'day'), lastDate).mean()
last = last.where(last.lt(0), 0)


// var palette = palettes.matplotlib.magma[7]
var palette = [
  "#000004",
  "#2C105C",
  "#711F81",
  "#B63679",
  "#EE605E",
  "#FDAE78",
  "#FCFDBF"
]


/*
Map.addLayer(no2.reduce(ee.Reducer.intervalMean(0, 25)), {}, '0%-25%')
Map.addLayer(no2.reduce(ee.Reducer.intervalMean(25, 50)), {}, '25%-50%')
Map.addLayer(no2.reduce(ee.Reducer.intervalMean(50, 75)), {}, '50%-75%')
Map.addLayer(no2.reduce(ee.Reducer.intervalMean(75, 100)), {}, '75%-100%')

var months = ee.List.sequence(0, 7, 0.25)

function getFrame(month) {
  var t1 = ee.Date.fromYMD(2018, 7, 1).advance(month, 'month')
  var t2 = t1.advance(0.5, 'month')
  
  var image = no2
    .filterDate(t1, t2)
    .mean()
    .multiply(1000000)
    .set({label: t1.format('YYYY-MM')})
  
  return image.updateMask(image.unitScale(75, 125))
}

var frames = ee.ImageCollection(months.map(getFrame))

var animation = require('users/gena/packages:animation')

animation.animate(frames, {
  label: 'label',
  vis: {min: 100, max: 250, palette: palette },
  maxFrames: frames.size()
})

//Map.addLayer(image.updateMask(image.unitScale(50, 100)), {min: 50, max: 200, palette: palette })
throw(0)
  

throw(0)
*/

// var image = no2.mean()
var image = ee.Image('users/gena/no2_2018_07_2019_02')

function addDem() {
  var dem = ee.Image('JAXA/ALOS/AW3D30_V1_1')
    .select('MED')
    .resample('bilinear')
  
  var land = ee.Image('users/gena/land_polygons_image').mask()
  
  dem = dem.updateMask(land)
  
  var demStyled = dem.visualize({ 
    min: 0, 
    max: 6000, 
    palette: palettes.cmocean.Gray[7].slice(2).reverse()
  })
  
  // Map.addLayer(demStyled, {}, 'dem', false)
  
  var weight = 1.0
  var extrusion = 100
  var sunAzimuth = 315
  var sunElevation = 25

  var demHillshaded = utils.hillshadeRGB(demStyled, dem, weight, extrusion, 
                                         sunAzimuth, sunElevation)
  
  Map.addLayer(demHillshaded, {}, 'dem', false)
}

Map.setOptions('HYBRID')
addDem()
Map.addLayer(ee.Image(0), {}, 'dark', true, 0.6)

var statDefault = {
  "NO2_column_number_density_p5": 0.000024,
  "NO2_column_number_density_p100": 0.000170,
}

var min = statDefault.NO2_column_number_density_p5
var max = statDefault.NO2_column_number_density_p100

var visParams = { min: min, max: max, palette: palette }
var layer = ui.Map.Layer(image.updateMask(image.unitScale(min, min + (max - min) * 0.25)).visualize(visParams), {}, 'NO2')
Map.layers().add(layer)

var layerSelection = ui.Map.Layer(ee.FeatureCollection([]), { color: 'blue' }, 'Selection')
Map.layers().add(layerSelection)

Map.style().set({cursor: 'crosshair' })

var label = ui.Label()


Map.onClick(function(pt) {
  var point = ee.Geometry.Point([pt.lon, pt.lat])//.buffer(Map.getScale() * 5)
  
  layerSelection.setEeObject(ee.FeatureCollection([point]))
  
  // fastest way to lookup values
  var values = no2km2.getRegion({
    geometry: point, 
    scale: Map.getScale() * 5
  })
  
  // Lookup relevant columns
  var rows = values.slice(1).map(function(row) {
    // convert to features
    return ee.Feature(null, ee.Dictionary.fromLists(
      ['t', 'v'],
      ee.List(row).slice(3, 5)
      )
    )
  })

  // Add chart
  var chart = ui.Chart.feature.byFeature(
    ee.FeatureCollection(
      rows
    ), 
    't', 
    'v'
  )
  
  
  chart.setOptions({
    title: 'NO2 Concentration (lon: ' + pt.lon.toFixed(2) + ', lat: ' + pt.lat.toFixed(2) + ')',
    vAxis: {title: 'Concentration [mol/km^2]'},
    hAxis: {title: 'Time [year]'},
    lineWidth: 0,
    pointSize: 2
  });
  
  chartPanel.clear();
  chartPanel.add(chart);
  
  if(!bottomLeftPanel.style().get('shown')) {
    OnButtonExpandClicked()
  }
})


var labelTitle = ui.Label('NO2 concentration, [mol/km²]:')

var lastName = 'Last ' + lastDate.advance(-1, 'day').format('YYYY-MM-dd').getInfo()

function OnSelectImageChanged() {
  switch(selectImageType.getValue()) {
    case 'Mean':
      image = ee.Image('users/gena/no2_2018_07_2019_02')
      break;
    case '90% last month':
      image = imageP90
      break;
    case lastName:
      image = last
      break;
  }
  updateImageLayer()
}

var selectImageType = ui.Select({ items: ['Mean', '90% last month', lastName], value: 'Mean', onChange: OnSelectImageChanged })

var panelImageType = ui.Panel([labelTitle, selectImageType], ui.Panel.Layout.flow('horizontal'))
var panelImageStyle = ui.Panel([ui.Label('Style: '), ImageStylePanel()], ui.Panel.Layout.flow('horizontal'))

function createAnimationPanel() {
  function onAnimate() {
    var days = ee.List.sequence(-30, 0, 1)
    
    var frames = days.map(function(d) {
      var t1 = ee.Date(Date.now()).advance(d, 'day').advance(-3, 'day')
      var t2 = t1.advance(3, 'day')
      
      var i = no2.filterDate(t1, t2).mean()
      
      i = i.convolve(ee.Kernel.gaussian(2000, 1500, 'meters'))
      
      return i.updateMask(i.unitScale(min, min + (max - min) * 0.25))
        .visualize({ min: min, max: max, palette: palette })
        .set({ label: t1.format('YYYY-MM-dd') })
    })
    
    var frames = ee.ImageCollection(frames)
    
    animation.animate(frames, { label: 'label', maxFrames: 100 })
  }
  
  var buttonAnimate = ui.Button('Animate', onAnimate)
  
  var panel = ui.Panel([buttonAnimate])
  
  return panel
}

var panel = ui.Panel([
  // createAnimationPanel(), 
  panelImageType, 
  panelImageStyle
])

panel.style().set({
  width: '400px',
});


var chartPanel = ui.Panel([ui.Label('Click on map to query time series ...')])
chartPanel.style().set({
  width: '400px',
  height: '220px'
});


function OnButtonCollapseClicked() {
  panelExpand.style().set({ shown: true })
  bottomLeftPanel.style().set({ shown: false })
}


function OnButtonExpandClicked() {
  panelExpand.style().set({ shown: false })
  bottomLeftPanel.style().set({ shown: true })
}

var buttonExpand = ui.Button('>>', OnButtonExpandClicked)

buttonExpand.style().set({
  margin: '0px',
  padding: '0px',
  textAlign: 'left'
})

var panelExpand = ui.Panel([buttonExpand])

panelExpand.style().set({
  shown: false,
  position: 'bottom-left'
})

Map.add(panelExpand)

var buttonCollapse = ui.Button('<<', OnButtonCollapseClicked)

buttonCollapse.style().set({
  margin: '0px',
  padding: '0px',
  textAlign: 'left'
})

var bottomLeftPanel = ui.Panel([
  panel, 
  chartPanel, 
  buttonCollapse])

bottomLeftPanel.style().set({
  position: 'bottom-left'
})

Map.widgets().add(bottomLeftPanel)

Map.setCenter(0, 25, 3)


function updateImageLayer() {
  var visParams = { min: min, max: max, palette: palette }
  
  layer.setEeObject(image.updateMask(image.unitScale(min, min + (max - min) * 0.25)).visualize(visParams))
  
  buttonApply.setDisabled(true)
}