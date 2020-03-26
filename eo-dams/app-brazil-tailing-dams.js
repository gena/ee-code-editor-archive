/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var dams10 = ee.FeatureCollection("users/gena/eo-dams/tailing_dams_brazil"),
    damsAll = ee.FeatureCollection("users/gena/eo-reservoirs/dams-all"),
    dams400 = ee.FeatureCollection("users/gena/eo-dams/dams400"),
    superiorCompensation = ee.FeatureCollection("users/gena/eo-dams/ecc_usoecoberturavegetal_v04"),
    superiorRunout = ee.FeatureCollection("users/gena/eo-dams/ecc_zonadeinundacao_kmz_sirgas"),
    dams720 = ee.FeatureCollection("users/gena/eo-dams/dams720");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var assets = require('users/gena/packages:assets')  
var style = require('users/gena/packages:style')
var animation = require('users/gena/packages:animation')
var palettes = require('users/gena/packages:palettes')
var charting = require('users/gena/packages:charting')

Map.style().set('cursor', 'crosshair')

style.SetMapStyleGrey()

var showingAll = true

Map.centerObject(dams10)

dams720 = dams720.filter(ee.Filter.neq('Name', ''))

// put failed dams to top
var damsFailed = dams720.filter(ee.Filter.inList('Number', ['7', '19']))

dams720 = dams720.sort('failed', false).sort('Name')

var damNames = ee.List(dams720.aggregate_array('Name'))
var damIds = ee.List(dams720.aggregate_array('Number'))

damNames = damNames.zip(damIds).map(function(o) {
  o = ee.List(o)
  
  return ee.String(o.get(0)).cat(', id: ').cat(ee.String(o.get(1)))
})

Map.addLayer(ee.Image(1), { palette: ['000000'] }, 'black', false, 0.5)
Map.addLayer(ee.Image(1), { palette: ['ffffff'] }, 'white', false, 0.5)

Map.addLayer(superiorCompensation.style({ color: '#90EE90', fillColor: '#90EE9022', width: 1}), {}, 'Sul Superior, compensation area', false)
Map.addLayer(superiorRunout.style({ color: '#ca8d42', fillColor: '#ca8d4222', width: 1}), {}, 'Sul Superior, runout area', false)

Map.addLayer(damsAll.style({ color: '#ffa500', pointSize: 1, fillColor: '#ffa50022', width: 1 }), {}, 'dams (all)', false, 0.5)

var damsPointSize = 1
function getDamsImage(pointSize, width) {
  return dams720.style({ color: '#ff0000', pointSize: pointSize, fillColor: '#ff000088', width: 1 })
}

var layerDams720 = ui.Map.Layer(getDamsImage(1, 0), {}, 'tailing dams (all)')
Map.layers().add(layerDams720)

// Map.addLayer(damsFailed, { color: 'black' }, 'failed')

// Map.addLayer(dams10, { color: 'red' }, 'dams' )

// var dams = [
//   { name: "Barragem Eustáquio", offset: 1, zoom: 15, name2: "Barragem Eust�quio" },
//   { name: "Barragem de Rejeitos do Córrego Baco Pari Espigot", offset: 2, zoom: 15, name2: "Barragem de Rejeitos do C�rrego Baco Pari Espigot" },
//   { name: "Barragem do Sossego", offset: 3, zoom: 15, name2: "Barragem do Sossego" },
//   { name: "Cava do Germano", offset: 4, zoom: 15, name2: "Cava do Germano" },
//   { name: "Coal Barragem Rio Fiorita", offset: 5, zoom: 15, name2: "Coal Barragem Rio Fiorita" },
//   { name: "Córrego do Feijão", offset: 6, zoom: 15, name2: "C�rrego do Feij�o" },
//   { name: "MT Rondon", offset: 7, zoom: 15, name2: "MT Rondon" },
//   { name: "Mario Cruz veg 2", offset: 8, zoom: 15, name2: "Mario Cruz veg 2" },
//   { name: "Sul Superior", offset: 9, zoom: 15, name2: "Sul Superior" },
//   { name: "Unidade I", offset: 10, zoom: 15, name2: "Unidade I" },
//   { name: "<unknown>", offset: 0, zoom: 15, name2: "" }
// ]

var selectSite = null
var damOwnerLabel = null
var damOwnerName = null
var damOwnerPanel = null
var buttonAll = null

var panelImages = ui.Panel([])

var tempLabel = ui.Label('Temperature', { fontWeight: 'bold' })
var tempChart = ui.Label('', { height: 200 })
var panelChartTemperature = ui.Panel([])

var precipLabel = ui.Label('Precipitation', { fontWeight: 'bold' })
var precipChart = ui.Label('', { height: 200 })
var panelChartPrecipitation = ui.Panel([])
  
function updateChartTemperature(chart) {
  panelChartTemperature.clear()
  panelChartTemperature.add(tempLabel)
  panelChartTemperature.add(chart)
}

function updateChartPrecipitation(chart) {
  panelChartPrecipitation.clear()
  panelChartPrecipitation.add(precipLabel)
  panelChartPrecipitation.add(chart)
}

function onShowAll() {
  if(a) {
    a.clear()
    a = null
  }
  
  panelImages.clear()  

  damOwnerPanel.style().set({ shown: false });
  selectSite.setValue('Choose a dam...', false)
  showingAll = true
  panelChartPrecipitation.clear()
  panelChartTemperature.clear()
  // panelAdvancedWidgets.style().set({ shown: false })

  onZoomChanged(9)
}

function createInfoPanel() {
  var infoLabel = ui.Label('Tailing Dam Assessment Tool', { fontSize: '20px' })

  return ui.Panel([infoLabel])
}

function createPanelCharts() {
  return ui.Panel([
    panelChartTemperature, panelChartPrecipitation
  ])
}

var checkboxShowWater = null
var checkboxFilterMasked = null
var checkboxFilterCloudy = null
var selectImageType = null
var buttonAnimate = null

function enableControls(show) {
    buttonAnimate.setDisabled(!show)
    checkboxShowWater.setDisabled(!show)
    selectImageType.setDisabled(!show)
    checkboxFilterMasked.setDisabled(!show)
    checkboxFilterCloudy.setDisabled(!show)
    selectSite.setDisabled(!show)
    buttonAll.setDisabled(!show)
}

// advanced
var panelAdvancedWidgets = createAdvancedPanel()

function createAdvancedPanel() {
  return ui.Panel({ widgets: createAdvancedWidgets(), style: { /*border: '1px solid grey',*/ margin: '6px', shown: true } })
}

function createAdvancedWidgets() {
  var labelShowImages = ui.Label('Water and Images', { fontWeight: 'bold' })
  var labelShowImages2 = ui.Label('Last year\'s least cloudy images')
  
  checkboxShowWater = ui.Checkbox('Water', false)
  selectImageType = ui.Select({ items: ['No Image', 'True Color', 'False Color'], value: 'False Color' })

  checkboxFilterMasked = ui.Checkbox({ label: 'Filter masked', value: true })
  checkboxFilterCloudy = ui.Checkbox({ label: 'Filter cloudy', value: true })

  buttonAnimate = ui.Button('Animate', onAnimate)
  
  function onAnimate() {
    if(Map.getZoom() < 12) {
      alert('Zoom in at least to 2km scale to animate satellite images')
      return
    }
    
    if(selectImageType.getValue() === 'No Image' && !checkboxShowWater.getValue()) {
      alert('At least Water or Image should be selected to animate satellite images')
      return
    }
    
    enableControls(false)
    
    var imageType = selectImageType.getValue()
    
    animate(checkboxShowWater.getValue(), imageType !== 'No Image', imageType === 'False Color', checkboxFilterMasked.getValue(), checkboxFilterCloudy.getValue())
      .then(function() {
        enableControls(true)
      })
  }
  
  var panelCheckboxes = ui.Panel([checkboxShowWater, selectImageType], ui.Panel.Layout.flow('horizontal'))
  
  return [labelShowImages, labelShowImages2, panelCheckboxes, checkboxFilterMasked, /*checkboxFilterCloudy,*/ buttonAnimate, panelImages]
}

var a = null

function animate(showWater, showImage, showFalse, filterMasked, filterCloudy) {
  if(a) {
    a.clear()
    a = null
  }
  
  var region = Map.getBounds(true)
  var scale = Map.getScale()
  
  var stop = ee.Date(Date.now())
  var start = stop.advance(-1, 'year')
  
  var images = assets.getImages(region, {
    resample: true,
    filterMasked: filterMasked,
    filter: ee.Filter.date(start, stop),
    scale: scale * 10,
    missions: [
      // 'L8', 
      'S2'
  ]
  })
  
  print('Image count: ', images.size())
  
  if(filterCloudy) {
    images = assets.getMostlyCleanImages(images, region, {
      cloudFrequencyThresholdDelta: -0.15
    })
  }
  
  print('Clean image count: ', images.size())
  
  var waterMin = -0.25
  var waterMax = 0.4
  
  images = images.map(function(i) {
    return i.set({ label: i.date().format('YYYY-MM-dd') })
  })
  
  images = ee.ImageCollection(images.distinct(['label']))

  images = images.sort('system:time_start')
  
  var bands = showFalse ? ['swir', 'nir', 'red'] : ['red', 'green', 'blue']

  var min = 0.05
  var max = 0.45
  var gamma = 1.5
  
  images = images.map(function(i) {
    var label = i.get('label')
    
    var ndwi = i.normalizedDifference(['green', 'nir'])
    var mndwi = i.normalizedDifference(['green', 'swir'])
    var wndvi = i.normalizedDifference(['red', 'nir'])
    var water = ee.Image([ndwi, wndvi, mndwi])
    var mask = water.reduce(ee.Reducer.max()).unitScale(waterMin, waterMax)//.multiply(4)

    var waterRGB = water.mask(mask).visualize({ min: waterMin, max: waterMax })
    var imageRGB = i.visualize({ min: min, max: max, gamma: gamma, bands: bands })

    
  
    var image = waterRGB
    
    if(showWater) {
      var blackRGB = ee.Image(1).visualize({ palette: ['000000'], opacity: 0.1 })
      
      image = imageRGB.blend(blackRGB).blend(waterRGB)
      
      if(!showImage) {
        image = blackRGB.blend(waterRGB)
      }
      
    } else {
      image = imageRGB
    }
    
    return image.set({ label: label, 'system:time_start': i.get('system:time_start') })
  })
  
  a = animation.animate(images, { label: 'label', maxFrames: 100, preload: false })
  
  
  // show rug plot
  // plot
  var rect = ee.Geometry.Rectangle({ coords: [[0, 0], [100, 4]], geodesic: false })
  
  // add rug plots
  var plot = new charting.Plot(rect.bounds(), { 
    area: { width: 1, color: '000000', fillColor: '00000011' }
  })
    
  plot.setMinMax(start.millis(), stop.millis(), 0, 1)
    
  var times = ee.List(images.aggregate_array('system:time_start'))
  plot.addRugSeries('S2', times, { width: 1, color: 'red' }, 1)  

  panelImages.clear()
  var thumb = plot.getThumbnail({ dimensions: '265x24' })
  panelImages.add(thumb)

  return a
}

// var damsByName = {}
// dams.forEach(function(dam) {
//   damsByName[dam.name] = dam
// })

function selectDamByName(name) {
  if(name === 'Choose a dam...') {
    onShowAll()
    layerDamSamplingRegion.setShown(false)
    return
  }
  
  layerDamSamplingRegion.setShown(true)
  
  var items = name.split(', id: ')
  name = items[0]
  var id = items[1]
  
  showingAll = false
  Map.setOptions('HYBRID')

  panelImages.clear()
  
  // panelAdvancedWidgets.style().set({ shown: true })
  
  // var dam = damsByName[name]
  // var f = ee.Feature(dams10.toList(1, dam.offset).get(0))
  var dam = dams720.filter(ee.Filter.eq('Number', id)).first()
  
  var zoom = 15
  Map.centerObject(dam, zoom)

  showDamInfo(dam)
  
  if(a) {
    a.clear()
    a = null
  }
}

var mapType = 'Grey'

function onZoomChanged(zoom) {
  var pointSize = 1
  var lineWidth = 0
  
  if(zoom >= 12) {
    pointSize = 4
    lineWidth = 2
    
    if(mapType !== 'Hybrid') {
      Map.setOptions('HYBRID')
      mapType = 'Hybrid'
    }
  }
  
  if(zoom < 12) {
    if(mapType !== 'Grey') {
      style.SetMapStyleGrey()
      mapType = 'Grey'
    }
  }
  
  if(damsPointSize !== pointSize) {
    damsPointSize = pointSize
    layerDams720.setEeObject(getDamsImage(pointSize, lineWidth))
  }
}

Map.onChangeZoom(onZoomChanged)

Map.onClick(function(pt) {
  var dam = dams720.filterBounds(ee.Geometry.Point([pt.lon, pt.lat]).buffer(Map.getScale() * 5)).first()
  
  var item = ee.String(dam.get('Name')).cat(', id: ').cat(ee.String(dam.get('Number')))
  item.evaluate(function(name) {
    if(!name) {
      return
    }
    
    enableControls(false)

    selectSite.setValue(name, true)
    
    enableControls(true)
  })
})


// main
function createMainPanel() {
  var widgets = []
  
  selectSite = ui.Select({
    items: [],
    onChange: selectDamByName
  });
  
  damNames.evaluate(function(damNames) {
    selectSite.items().reset(['Choose a dam...'].concat(damNames))
    selectSite.setPlaceholder('Choose a dam...')
  })
  
  selectSite.setPlaceholder('Loading ...');
  
  widgets.push(selectSite)

  damOwnerLabel = ui.Label('Owner: ', { fontWeight: 'bold', })
  damOwnerName = ui.Label('')
  damOwnerPanel = ui.Panel([damOwnerLabel, damOwnerName], ui.Panel.Layout.flow('horizontal'), { shown: false })

  // add button to show all dams
  buttonAll = ui.Button('Show all', function() {
      style.SetMapStyleGrey()

      Map.centerObject(dams10)
      onShowAll()
  })
  widgets.push(buttonAll)
  
  var panelButtons = ui.Panel(widgets, ui.Panel.Layout.flow('horizontal'))
  
  var panelCharts = createPanelCharts()
  
  var labelDisclaimer = ui.Label('Terms of Use', {}, 'https://www.deltares.nl/en/disclaimer/')
  labelDisclaimer.style().set({ position: 'bottom-right', backgroundColor: '#ffffff22', fontSize: '10px', margin: '2px', padding: '2px' })

  Map.add(labelDisclaimer)

  // add panel
  var panel = ui.Panel([createInfoPanel(), panelButtons, damOwnerPanel, panelAdvancedWidgets, panelCharts])
  
  return panel
}

var mainPanel = createMainPanel()
 
ui.root.insert(0, mainPanel)

var minTemp = 5
var maxTemp = 20
var layerTemperatureStdDev = ui.Map.Layer(ee.Image(), {min: minTemp, max: maxTemp, palette: palettes.matplotlib.inferno[7]}, 'temperature (2 σ)', false)
Map.layers().add(layerTemperatureStdDev)

var layerDamSamplingRegion = ui.Map.Layer(ee.Image(), {}, 'sampling area', false)
Map.layers().add(layerDamSamplingRegion)

function showDamInfo(dam) {
  damOwnerPanel.style().set({ shown: false })
  dam.get('Entreprene').evaluate(function(ownerName) {
    print('Entreprene', ownerName)
    damOwnerName.setValue(ownerName)
    damOwnerPanel.style().set({ shown: true })
  })

  
  var stop = ee.Date(Date.now())
  var start = stop.advance(-5, 'year')
  
  var region = dam.geometry().buffer(300, 10)
  
  layerDamSamplingRegion.setEeObject(ee.FeatureCollection([region]).style({ color: 'ffff00', fillColor: 'ffff0001'}))

  // temperature  
  var images = assets.getImages(region, {
    missions: ['L8'/*, 'L7'*/],
    includeTemperature: true,
    filter: ee.Filter.date(start, stop)
  })
  
  images = assets.getMostlyCleanImages(images, region)

  var temp = images  
    .select('temp')
    .map(function(i) {
      var t = i.get('system:time_start')
      
      i = i.resample('bicubic').subtract(273.15)
      
      // i = i.updateMask(i.gt(-10))
      // i = i.updateMask(i.lt(50))
      
      return i
        .set({ 'system:time_start': t })
    })
    .sort('system:time_start')

  // update temperature variance layer
  var v = temp.reduce(ee.Reducer.stdDev()).multiply(2)
  v = v.updateMask(v.unitScale(minTemp, minTemp + (maxTemp - minTemp)/3)).clip(Map.getBounds(true))
  layerTemperatureStdDev.setEeObject(v)

  temp = temp.map(function(i) {
    return i.updateMask(i.gt(-5).and(i.lt(50)))
  })    

  var chart = ui.Chart.image.series(temp, region, ee.Reducer.first(), 60)
    .setOptions({
      pointSize: 1,
      lineWidth: 0,
      title: '',
      hAxis: { title: 'Time' },
      vAxis: { title: 'Temperature (Landsat 8), °C' },
      height: 200
    })
  updateChartTemperature(chart)

  // precipitation

  // metainfo for precipitation datasets
  var datasets = [
    {
      images: ee.ImageCollection("NOAA/CFSV2/FOR6H"), 
      var: 'Precipitation_rate_surface_6_Hour_Average',
      stepHours: 6,
      maxValue: 0.002
    },
    {
      images: ee.ImageCollection('ECMWF/ERA5/MONTHLY'),
      var: 'total_precipitation',
      stepHours: 24 * 30,
      maxValue: 0.02
    }
  ]
  
  // var dataset = datasets[0] // NCEP
  var dataset = datasets[1] // ERA5

  var maxHours = 24 * 365 * 5
  
  var proj = dataset.images.first().select(dataset.var).projection()
  
  var chart = ui.Chart.image.series({
    imageCollection: dataset.images.filterDate(stop.advance(-maxHours, 'hour'), stop).select(dataset.var), 
    region: region.centroid(100), 
    reducer: ee.Reducer.first(), 
    scale: 100
  }).setOptions({
    lineWidth: 1,
    vAxis: { title: 'Precipitation (ERA5), m'}, 
    hAxis: { title: 'Time'} 
  })
  
  updateChartPrecipitation(chart)
}

