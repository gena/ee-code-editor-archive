var style = require('users/gena/packages:style')
var palettes = require('users/gena/packages:palettes')
var animation = require('users/gena/packages:animation')
var tiler = require('users/gena/packages:tiler')

style.SetMapStyleDark(Map)

var features = ee.FeatureCollection('users/gena/covid19/covid19_nl_new').sort('dt')

features = features.filter(ee.Filter.gt('confirmed', 0))

var layerSelection = ui.Map.Layer(ee.Image(), { color: 'yellow' }, 'selection', true, 0.5)

var labelDate = null
var switchShowLabels = null
var dateValues = null
var currentDate = null
var chart = null
var panelChart = null
var tableNL = null
var switchLogScale = null

var chartOptions = {
  title: 'Netherlands',
  legend: { position: 'none' },
  backgroundColor: { fill: "#FDFEFE" },
  pointSize: 2,
  lineWidth: 1,
  colors: ['#e31a1c', '#31a354', 'grey', '#bda800'],
  chartArea: {'width': '70%', 'height': '80%'},
  vAxis: { scaleType: null }
}

function onLogScale() {
  var isLog = switchLogScale.getValue()
  
  chartOptions.vAxis.scaleType = isLog ? 'log' : null
  chart.setOptions(chartOptions)
}

switchLogScale = ui.Checkbox({
  label: 'Log', 
  value: false, 
  onChange: onLogScale,
  style: {
    fontSize: '14px',
    'background-color': '#00000000',
    position: 'middle-right',
    color: 'ffffff'
  }
})

var data = {
  "date":{"0":"1-22-2020","1":"1-23-2020","2":"1-24-2020","3":"1-25-2020","4":"1-26-2020","5":"1-27-2020","6":"1-28-2020","7":"1-29-2020",
  "8":"1-30-2020","9":"1-31-2020","10":"2-1-2020","11":"2-2-2020","12":"2-3-2020","13":"2-4-2020","14":"2-5-2020","15":"2-6-2020","16":"2-7-2020",
  "17":"2-8-2020","18":"2-9-2020","19":"2-10-2020","20":"2-11-2020","21":"2-12-2020","22":"2-13-2020",
  "23":"2-14-2020","24":"2-15-2020","25":"2-16-2020","26":"2-17-2020","27":"2-18-2020","28":"2-19-2020","29":"2-20-2020","30":"2-21-2020",
  "31":"2-22-2020","32":"2-23-2020","33":"2-24-2020","34":"2-25-2020","35":"2-26-2020","36":"2-27-2020","37":"2-28-2020","38":"2-29-2020",
  "39":"3-1-2020","40":"3-2-2020","41":"3-3-2020","42":"3-4-2020","43":"3-5-2020","44":"3-6-2020","45":"3-7-2020","46":"3-8-2020","47":"3-9-2020",
  "48":"3-10-2020","49":"3-11-2020","50":"3-12-2020",
  "51":"3-13-2020", "52":"3-14-2020", "53":"3-15-2020", "54":"3-16-2020", "55":"3-17-2020", "56": "3-18-2020", "57": "3-19-2020", 
  "58": "3-20-2020", "59": "3-21-2020", "60": "3-22-2020", "61": "3-23-2020", "62": "3-24-2020"  
    
  },
  "confirmed":{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0,"14":0,"15":0,"16":0,"17":0,"18":0,"19":0,"20":0,"21":0,"22":0,"23":0,"24":0,"25":0,"26":0,"27":0,"28":0,"29":0,"30":0,"31":0,"32":0,"33":0,"34":0,"35":0,"36":1,"37":1,"38":6,"39":10,"40":18,"41":24,"42":38,"43":82,"44":128,"45":188,"46":265,"47":321,"48":382,"49":503,"50":614,
  "51":804,"52":959,"53":1135, "54": 1413, "55": 1705, "56": 2051, "57": 2460, "58": 2994, "59": 4204, "60": 4749,
  "61": 5560, "62": 6412 },
  "recovered":{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0,"14":0,"15":0,"16":0,"17":0,"18":0,"19":0,"20":0,"21":0,"22":0,"23":0,"24":0,"25":0,"26":0,"27":0,"28":0,"29":0,"30":0,"31":0,"32":0,"33":0,"34":0,"35":0,"36":0,"37":0,"38":0,"39":0,"40":0,"41":0,"42":0,"43":0,"44":0,"45":0,"46":0,"47":0,"48":0,"49":0,"50":0,
  "51":0,"52":0,"53":2, "54": 2, "55": 2, "56": 2, "57": 2, "58": 2, "59": 2, "60": 2, "61": 2, "62": 2 },
  "deaths":{"0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0,"7":0,"8":0,"9":0,"10":0,"11":0,"12":0,"13":0,"14":0,"15":0,"16":0,"17":0,"18":0,"19":0,"20":0,"21":0,"22":0,"23":0,"24":0,"25":0,"26":0,"27":0,"28":0,"29":0,"30":0,"31":0,"32":0,"33":0,"34":0,"35":0,"36":0,"37":0,"38":0,"39":0,"40":0,"41":0,"42":0,"43":0,"44":1,"45":1,"46":3,"47":3,"48":4,"49":5,"50":6,
  "51":10,"52":12,"53":20, "54": 24, "55": 43, "56": 58, "57": 76, "58": 106, "59": 179, "60": 213, "61": 276, "62": 356 }
}

dateValues = data['date']
dateValues = Object.keys(dateValues).map(function(k) { return dateValues[k] }).map(function(d) { return new Date(Date.parse(d)+24*60*60*1000) })

var confirmedValues = data['confirmed']
confirmedValues = Object.keys(confirmedValues).map(function(k) { return confirmedValues[k] })

var recoveredValues = data['recovered']
recoveredValues = Object.keys(recoveredValues).map(function(k) { return recoveredValues[k] })

var deathsValues = data['deaths']
deathsValues = Object.keys(deathsValues).map(function(k) { return deathsValues[k] })

// var featuresGroupped = features.reduceColumns({
//     selectors: ['dt', 'confirmed' ],
//     reducer: ee.Reducer.sum()
    
//     .group({
//       groupField: 0,
//       groupName: 'dt'
//     })
// })

// print(featuresGroupped)

// function showChartTotal(d) {
//   var cols = [
//     { label: 'date', type: 'date' },
//     { label: 'value', type: 'number' }
//   ]

//   var rows = []  
//   d.map(function(d) {
//     var c = []
//     c.push({ v: new Date(Date.parse(d.dt)) })
//     c.push({ v: d.sum })
//     rows.push({c: c})
//   })

//   var table = {
//     cols: cols,
//     rows: rows
//   }
  
//   print(ui.Chart(table))
// }

// var d = featuresGroupped.get('groups').
// showChartTotal(d)

// var featuresGroupped = features.reduceColumns({
//     selectors: ['name', 'dt', 'confirmed' ],
//     reducer: ee.Reducer.toList().repeat(2)
    
//     .group({
//       groupField: 0,
//       groupName: 'name'
//     })
// })

// print(featuresGroupped)


// print('center: ', Map.getCenter())
// print('zoom: ', Map.getZoom())
Map.setCenter(6, 52.3, 8)

Map.onChangeZoom(function(z) {
  print('zoom: ', z)
})

var dates = ee.List(features.aggregate_array('dt')).distinct().getInfo()

function updateChart(f) {
  for(var i=0; i<dateValues.length; i++) {
    var v = null
    for(var j=0; j<f.features.length; j++) {
      var t = new Date(Date.parse(f.features[j].properties.dt)+23*60*60*1000)
      if(t.getTime() === dateValues[i].getTime()) {
        v = f.features[j].properties.confirmed
      }
    }
    tableNL.rows[i].c[4].v = v
  }

  if(f.features.length == 0) {
    chartOptions.title = 'Netherlands'
  } else {
    chartOptions.title = 'Netherlands and ' + f.features[0].properties.name
  }
  
  chart = ui.Chart(tableNL).setOptions(chartOptions)
  panelChart.clear()
  panelChart.widgets().add(chart)
}

var selecting = false // EE evaluate bugs?

Map.onClick(function(pt) {
  if(selecting) {
    return
  }

  selecting = true

  pt = ee.Geometry.Point([pt.lon, pt.lat])
  layerSelection.setEeObject(features.filterBounds(pt))
  
  features.filterBounds(pt).sort('dt').evaluate(function(f) {
    updateChart(f)
    selecting = false
  })
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

    if(switchShowLabels.getValue()) {
      currentLayerLabel.setOpacity(1)
    }
    
    labelDate.setValue(dates[v-1])
  }
  
  function showLayers(dates) {
    dates.map(function(date, i) {
      var layer = ui.Map.CloudStorageLayer({
        bucket: 'deltares-video-map', 
        path: 'corona-virus-nl-v2/corona-virus-' + date, 
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
        path: 'corona-virus-nl-v2/corona-virus-' + date + '-labels', 
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
    
    function createChart() {    
      var table = {
        cols: [
          { type: 'date', label: 'date' },
          { type: 'number', label: 'confirmed' },
          { type: 'number', label: 'recovered' },
          { type: 'number', label: 'deaths' },
          { type: 'number', label: 'selection' }
        ],
        
        rows: dateValues.map(function(d, i) {
          return { c: [ { v: d }, { v: confirmedValues[i] }, { v: recoveredValues[i] }, { v: deathsValues[i] }, { v: undefined } ] }
        })
      }
      
      tableNL = table
      
      chart = ui.Chart(table).setOptions(chartOptions)
      
      return chart
    }
    
    chart = createChart()

    // check for mobile
    var mapBounds = Map.getBounds()
    var screenWidth = (mapBounds[2] - mapBounds[0]) * 111139 / Map.getScale()

    panelChart = ui.Panel({ 
      widgets: [
        chart
      ], 
      style: {
        position: 'middle-left',
        'background-color': '#00000000',
        width: screenWidth <= 800 ? '200px' : '300px',
        margin: 0,
        padding: 0
      }
    })
    
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
    var timeStep = 200
    
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

    function onShowLabels() {
      if(currentLayerLabel != null) {
        if(switchShowLabels.getValue()) {
          currentLayerLabel.setOpacity(1)
        } else {
          currentLayerLabel.setOpacity(0)
        }
      }
    }

    switchShowLabels = ui.Checkbox({
      label: 'Labels', 
      value: true, 
      onChange: onShowLabels,
      style: {
        // margin: 0, 
        // padding: 0, 
        fontSize: '14px',
        'background-color': '#00000000',
        position: 'middle-right',
        color: 'ffffff'
      }
    })


    if(screenWidth <= 800) {
      panelAll = ui.Panel({
        widgets: [
          panelChart,
          ui.Panel([switchShowLabels, switchLogScale], ui.Panel.Layout.flow('horizontal'), { 
            position: 'bottom-left', 
            'background-color': '#00000033',
            border: '1px solid black',
            width: '300px'
          }),
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
          panelChart,
          ui.Panel([switchShowLabels, switchLogScale], ui.Panel.Layout.flow('horizontal'), { 
            position: 'bottom-left', 
            'background-color': '#00000033',
            border: '1px solid black',
            width: '300px'
          }),
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

var paletteConfirmed = palettes.cb.Reds[9]
var confirmedMax_r = features.aggregate_max('conf_r')
confirmedMax_r = 14.247806848775006


var confirmedMax = ee.Number(features.aggregate_max('confirmed'))

function render(features, date, labels) {
  features = features.filter(ee.Filter.eq('dt', date))
  
  var imageConfirmed = style.Feature.linear(features, 'conf_r', { 
        palette: paletteConfirmed,
        width: 0, opacity: 0.5, valueMin: 1, valueMax: confirmedMax_r,
  })
  

  if(labels) {
    return style.Feature.label(features, 'confirmed', { 
      textColor: 'ffffff', outlineColor: '000000', alignX: 'center', alignY: 'center', format: '%d'})
  }

  return imageConfirmed
}

function exportTiles(image, date, suffix, minZoom, maxZoom) {
  var name = 'corona-virus-' + date
  
  var boundsNL = ee.Geometry.Polygon([[[ 3.36072, 50.66071], [8.13978, 50.66071], [8.13978, 53.89213],[3.36072, 53.89213], [3.36072, 50.66071]]], 'EPSG:4326', false)

  Export.map.toCloudStorage({
    image: image, 
    description: name + suffix, 
    bucket: 'deltares-video-map', 
    fileFormat: 'auto', 
    path: 'corona-virus-nl-v2/' + name + suffix, 
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
    return render(features, date).set({ label: date })
  })
  
  animation.animate(frames, { label: 'label'})
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

function exportLast() {
  var date = dates[dates.length-1]
  var image = render(features, date)
  exportTiles(image, date, '', 0, 11)
  Map.addLayer(image, {}, date)

  var image = render(features, date, true)
  exportTiles(image, date, '-labels', 8, 13)
  Map.addLayer(image, {}, date + ' labels')
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

// animateAll()
// exportAll()
// exportLast()
renderFromRastarTiles()

