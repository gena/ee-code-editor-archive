var style = require('users/gena/packages:style')
var palettes = require('users/gena/packages:palettes')
var animation = require('users/gena/packages:animation')
var tiler = require('users/gena/packages:tiler')
 
style.SetMapStyleDark(Map)

var paletteConfirmed = palettes.cb.Reds[9]

var features_nl = ee.FeatureCollection('users/gena/covid19/covid19_nl_new').sort('dt')
Map.addLayer(features_nl.style({width:0, color: paletteConfirmed[0], fillColor: paletteConfirmed[0]}))

var features_it = ee.FeatureCollection('users/gena/covid19/covid19_it_new').sort('dt')
  .map(function(f) {
    return f.set({
      confirmed: f.get('totale_cas'),
      name: f.get('prov_name'),
      dt: ee.Date(f.get('dt')).format('YYYY-MM-dd')
    })
  })

print(features_it.first())
print(features_nl.first())

var features = features_nl.merge(features_it)

var layerSelection = ui.Map.Layer(ee.Image(), { color: 'yellow' }, 'selection', true, 0.5)

var labelDate = null
var dateValues = null


Map.onChangeZoom(function(z) {
  print('zoom: ', z)
})

var dates = ee.List(features.sort('dt').aggregate_array('dt')).distinct().getInfo()

Map.onClick(function(pt) {
  pt = ee.Geometry.Point([pt.lon, pt.lat])
  layerSelection.setEeObject(features.filterBounds(pt))
})

function renderFromRastarTiles() {
  var currentLayer = null
  var layers = []

  var currentLayerLabel = null
  var layersLabel = []
  
  function onChangeDate(v) {
    if(currentLayer == null) {
      return
    }
    currentLayer.setOpacity(0)
    currentLayer = layers[v-1]
    currentLayer.setOpacity(1)

    currentLayerLabel.setOpacity(0)
    currentLayerLabel = layersLabel[v-1]
    currentLayerLabel.setOpacity(1)
    
    labelDate.setValue(dates[v-1])
  }
  
  function showLayers(dates) {
    dates.map(function(date, i) {
      var layer = ui.Map.CloudStorageLayer({
        bucket: 'deltares-video-map', 
        path: 'corona-virus-regional/corona-virus-' + date, 
        maxZoom: 11, 
        name: 'corona-virus-' + date, 
        shown: true, 
        opacity: i === dates.length-1 ? 1 : 0
      })
      Map.layers().add(layer)
      layers.push(layer)
    })      

    Map.layers().add(layerSelection)

    dates.map(function(date, i) {
      var layerLabel = ui.Map.CloudStorageLayer({
        bucket: 'deltares-video-map', 
        path: 'corona-virus-regional/corona-virus-' + date + '-labels', 
        maxZoom: 13, 
        name: 'corona-virus-' + date + '-labels', 
        shown: true, 
        opacity: i === dates.length-1 ? 1 : 0
      })
      Map.layers().add(layerLabel)
      layersLabel.push(layerLabel)
    })

    currentLayer = layers[dates.length-1]
    currentLayerLabel = layersLabel[dates.length-1]
    
    var slider = ui.Slider(1, dates.length, dates.length, 1)
    slider.onSlide(onChangeDate)
    
    slider.style().set({
      width: '200px',
      'background-color': '#00000022'
    })
    

    // checl for mobile
    var mapBounds = Map.getBounds()
    var screenWidth = (mapBounds[2] - mapBounds[0]) * 111139 / Map.getScale()

    labelDate = ui.Label(dates[dates.length-1])
    
    labelDate.style().set({
        'backgroundColor': '#00000022',
        'color': 'white',
        'fontSize': '32px',
        // 'fontWeight': 'bold',
        'position': 'bottom-center'
    })
    
    var linkGlobal = ui.Label('Global Dashboard', {}, 'https://gena.users.earthengine.app/view/corona-virus')
    
    linkGlobal.style().set({
      'backgroundColor': '#ffffffaa',
      'color': 'black',
      'fontSize': '14px',
      'fontWeight': 'bold',
      'padding': '2px',
      'position': 'bottom-left'
    })
    
    var timeout = null
    var play = false
    var timeStep = 300
    
    var textPlay = '▶'
    var textPause = '⏸'
    
    var buttonStyle = { 
      padding: 0,  margin: '3px', fontSize: '12px', fontWeight: 'bold',
    }
    
    var currentDateIndex = dates.length
    
    var buttonPlayPause = ui.Button(textPlay, onPlayPause, false, buttonStyle)
    
    function nextFrame() { 
      if(currentDateIndex == dates.length+1) {
        currentDateIndex = 1
      }
      
      slider.setValue(currentDateIndex, true)
      
      currentDateIndex += 1
    
      if(play) {
        if(currentDateIndex == dates.length+1) {
          ui.util.setTimeout(nextFrame, timeStep * 5)
        } else {
          ui.util.setTimeout(nextFrame, timeStep)
        }
      }
    }
    
    function onPlayPause() {
      if(!play && !timeout) {
        currentDateIndex = 1
        timeout = ui.util.setTimeout(nextFrame, timeStep)
        play = true
        buttonPlayPause.setLabel(textPause)
      } else {
        ui.util.clearTimeout(timeout)
        timeout = null
        play = false
        buttonPlayPause.setLabel(textPlay)
      }
    }
    
    var panelAll = null    

    if(screenWidth <= 800) {
      panelAll = ui.Panel({
        widgets: [
          labelDate, 
          slider, 
          buttonPlayPause,
          linkGlobal
        ],
        style: { 
          position: 'bottom-left', 
          'background-color': '#00000033',
          border: '1px solid black',
          width: '320px'
        }
      })
    } else {
      panelAll = ui.Panel({
        widgets: [
          labelDate, 
          ui.Panel([slider, buttonPlayPause], ui.Panel.Layout.flow('horizontal'), { 
            position: 'bottom-left', 
            'background-color': '#00000033',
            border: '1px solid black',
            width: '300px'
          }),
          linkGlobal
        ],
        style: { 
          position: 'bottom-left', 
          'background-color': '#00000033',
          border: '1px solid black',
          width: '320px'
        }
      })
    }
    

    Map.add(panelAll)
    
    Map.onChangeBounds(function() {
      // checl for mobile
      var mapBounds = Map.getBounds()
      
      // hack in label styling as well
      var screenWidth = (mapBounds[2] - mapBounds[0]) * 111139 / Map.getScale()
      if(screenWidth <= 800) {
        labelDate.style().set({'fontSize': '10px'})
        panelAll.style().set({width: '220px'})
        // slider.style().set({shown: false})
      } else {
        labelDate.style().set({'fontSize': '32px'})
        panelAll.style().set({width: '320px'})
        // slider.style().set({shown: true})
      }
    })    
  }    

  // dates.evaluate(showLayers)
  // showLayers(dates.getInfo())
  showLayers(dates)
}

var confirmedMax_r = features.aggregate_max('conf_r')
// var confirmedMax = ee.Number(features.aggregate_max('confirmed'))
var confirmedMax = 150

function render(features, date, labels) {
  features = features.filter(ee.Filter.eq('dt', date))
  
  
  var imageConfirmed = style.Feature.linear(features, 'confirmed', { 
        palette: paletteConfirmed,
        width: 0, opacity: 1, opacityLine: 1, valueMin: 0, valueMax: confirmedMax
  })
  

  if(labels) {
    return style.Feature.label(features, 'confirmed', { 
      textColor: 'ffffff', outlineColor: '000000', alignX: 'center', alignY: 'center', format: '%d'})
  }

  return imageConfirmed.set({ label: date})
}

function exportTiles(image, date, suffix, minZoom, maxZoom) {
  var name = 'corona-virus-' + date
  
  var boundsNL = ee.Geometry.Polygon([[[ 3.36072, 50.66071], [8.13978, 50.66071], [8.13978, 53.89213],[3.36072, 53.89213], [3.36072, 50.66071]]], 'EPSG:4326', false)

  Export.map.toCloudStorage({
    image: image, 
    description: name + suffix, 
    bucket: 'deltares-video-map', 
    fileFormat: 'auto', 
    path: 'corona-virus-regional/' + name + suffix, 
    writePublicTiles: false, 
    minZoom: minZoom, 
    maxZoom: maxZoom, 
    skipEmptyTiles: true, 
    mapsApiKey: 'AIzaSyDItV6jEwI7jdCEqLWL4zO-ZzPvKC4193E',
    region: boundsNL
  })
}

function animateAll() {
  var frames = dates.map(function(date) {
    return render(features, date)
  })
  
  animation.animate(frames, { label: 'label' })
}

function exportAll() {
  // dates.evaluate(function(dates) {
    dates.map(function(date) {
      var image = render(features, date)
      exportTiles(image, date, '', 0, 11)

      var image = render(features, date, true)
      exportTiles(image, date, '-labels', 8, 13)
    })
  // })
}

// add a gradient bar
// var labels = ee.List.sequence(1, confirmedMax, confirmedMax.subtract(0).divide(5))

// var geometryGradientBar = ee.Geometry.Rectangle([0, 0, 100, 5], null, false)

// var textProperties = { fontSize:16, textColor: '000000', outlineColor: 'ffffff', outlineWidth: 3, outlineOpacity: 0.6 }

// var gradient = style.GradientBar.draw(geometryGradientBar, {
//   min: 1, max: confirmedMax, palette: paletteConfirmed, labels: labels, format: '%.0f', text: textProperties
// })

// Map.addLayer(gradient, {}, 'gradient bar')

Map.style().set({ cursor: 'crosshair' })

function formatDate(date, includeTime) {
    var d = date;
    
    var month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear(),
        hour = d.getHours().toString(),
        minute = d.getMinutes().toString();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;
  
    if(includeTime) {
      if (hour.length < 2)
          hour = '0' + hour;
      if (minute.length < 2) 
          minute = '0' + minute;
    }

    var s = [year, month, day].join('-')
    
    if(includeTime) {
      s = s + ' ' + hour + ':' + minute;
    }
    
    return s
}

animateAll()
// exportAll()
// renderFromRastarTiles()

