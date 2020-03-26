/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var l8 = ee.ImageCollection("LANDSAT/LC8_L1T_TOA"),
    s2 = ee.ImageCollection("COPERNICUS/S2"),
    aster = ee.ImageCollection("ASTER/AST_L1T_003"),
    proba100 = ee.ImageCollection("VITO/PROBAV/S1_TOC_100M"),
    s1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    l5 = ee.ImageCollection("LANDSAT/LT5_L1T_TOA"),
    l4 = ee.ImageCollection("LANDSAT/LT4_L1T_TOA"),
    l7 = ee.ImageCollection("LANDSAT/LE7_L1T_TOA"),
    modis_aqua = ee.ImageCollection("MODIS/MYD09GQ"),
    modis_terra = ee.ImageCollection("MODIS/MOD09GQ"),
    proba333 = ee.ImageCollection("VITO/PROBAV/S1_TOC_333M");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var start = '2016-01-01'
var stop = '2016-03-01'

var aoi = ee.Geometry(Map.getBounds(true))//.centroid(10)

var resolutionMin = 500

// var showChart = false
var showChart = true

// number of video frames to add for preview
// layers can be also added by clicking on chart
var countMapLayers = 0 

// max number of map layers to add when clicked on chart, when max is reached - bottom layers are removed (FIFO)
var countChartLayersMax = 20

print(start + '..' + stop)

if(Map.getScale() > 300) {
  print('Zoom in to at least 300m scale, curren scale is: ' + Map.getScale())
  
  return 
}

var assets = [
  { 
    name: 'Sentinel 1 VV', 
    nameShort: 's1vv',
    images: s1,
    visual: {bands: ['VV'], min:-20, max:-5, forceRgbOutput: true},
    filter: ee.Filter.eq('transmitterReceiverPolarisation', 'VV'),
    resolution: 10
  },
  { 
    name: 'Sentinel 1 VH', 
    nameShort: 's1vh',
    images: s1,
    visual: {bands: ['VH'], min:-20, max:-5, forceRgbOutput: true},
    filter: ee.Filter.eq('transmitterReceiverPolarisation', 'VH'),
    resolution: 10
  },
  { 
    name: 'Sentinel 1 VV VH', 
    nameShort: 's1vvvh',
    images: s1,
    visual: {bands: ['VV', 'VH', 'VV'], min:-20, max:-5, forceRgbOutput: true},
    filter: ee.Filter.eq('transmitterReceiverPolarisation', ['VV', 'VH']),
    resolution: 10
  },
  { 
    name: 'Sentinel 1 HH HV', 
    nameShort: 's1hhhv',
    images: s1,
    visual: {bands: ['HH', 'HV', 'HH'], min:-20, max:-5, forceRgbOutput: true},
    filter: ee.Filter.eq('transmitterReceiverPolarisation', ['HH', 'HV']),
    resolution: 100
  },
  { 
    name: 'landsat 8',
    nameShort: 'l8',
    images: l8,
    visual: {bands: ['B6', 'B5', 'B8'], min: 0.03, max:0.5},
    resolution: 15
  },
  { 
    name: 'landsat 7',
    nameShort: 'l7',
    images: l7,
    visual: {bands: ['B5', 'B4', 'B5'], min: 0.03, max:0.5},
    resolution: 15
  },
  { 
    name: 'landsat 5',
    nameShort: 'l5',
    images: l5,
    visual: {bands: ['B5', 'B4', 'B5'], min: 0.03, max:0.5},
    resolution: 30
  },
  { 
    name: 'landsat 4',
    nameShort: 'l4',
    images: l4,
    visual: {bands: ['B5', 'B4', 'B5'], min: 0.03, max:0.5},
    resolution: 30
  },
  { 
    name: 'sentinel 2',
    nameShort: 's2',
    images: s2,
    visual: {bands: ['B3', 'B8', 'B3'], min:500, max:7000},
    resolution: 10
  },
  { 
    name: 'aster',
    nameShort: 'aster',
    images: aster,
    visual: {bands: ['B01', 'B3N', 'B01'], min:10, max:255},
    filter: ee.Filter.and(
        ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B01'),
        ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B3N')
    ),
    resolution: 15
  },
  { 
    name: 'aster temperature-only',
    nameShort: 'asterT',
    images: aster,
    visual: {bands: ['B11', 'B12', 'B13'], min:600, max:1800},
    filter: ee.Filter.and(
        ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B01'),
        ee.Filter.listContains('ORIGINAL_BANDS_PRESENT', 'B3N')
    ).not(),
    resolution: 90
  },
  { 
    name: 'proba v 100m',
    nameShort: 'proba1',
    images: proba100,
    visual: {bands: ['RED', 'NIR', 'RED'], min:10, max:1500},
    resolution: 100
  },
  { 
    name: 'proba v 333m',
    nameShort: 'proba2',
    images: proba333,
    visual: {bands: ['RED', 'NIR', 'RED'], min:10, max:1500},
    resolution: 333
  },
  { 
    name: 'MODIS Aqua MYD09GQ',
    nameShort: 'aqua',
    images: modis_aqua,
    visual: {bands: ['sur_refl_b01', 'sur_refl_b02', 'sur_refl_b01'], min:500, max:5000},
    resolution: 250
  },
  { 
    name: 'MODIS Terra MOD09GQ',
    nameShort: 'terra',
    images: modis_terra,
    visual: {bands: ['sur_refl_b01', 'sur_refl_b02', 'sur_refl_b01'], min:500, max:5000},
    resolution: 250
  }
]

// global filter
var filter = ee.Filter.and(
  ee.Filter.bounds(aoi),
  ee.Filter.date(start, stop)
)

// generate rendered image collections
var assetsRendered = assets.map(function(asset) {
  if(!asset.name || asset.resolution > resolutionMin) {
    return ee.ImageCollection([])
  }
  
  // combine global filter with custom asset filter
  var f = asset.filter ? ee.Filter.and(filter, asset.filter) : filter
  
  // render all images, keep id and time
  var rendered = asset.images

    // filter
    .filter(f)
    
    // skip empty images
    .map(function(image) {
        var value = ee.Dictionary(image.select(asset.visual.bands[0]).reduceRegion(ee.Reducer.firstNonNull(), aoi.centroid(30), 100)).values().get(0)
        return image.set('any_value', value)
      }).filter(ee.Filter.neq('any_value', null))

    // render
    .map(function(image) {
      return image
        .visualize(asset.visual)
        .addBands(ee.Image.constant(275 + 35 * assets.indexOf(asset)).rename(asset.nameShort), [asset.nameShort])
        .set('system:time_start', image.get('system:time_start'))
        .set('system:id', image.get('system:id'))
        .set('assetShortName', asset.nameShort)
    })

  print(asset.name, rendered.aggregate_count('system:id'))

  return rendered
})


// merge all rendered collections and sort by time
function mergeCollection(current, prev) { 
  return ee.ImageCollection(prev).merge(current)
}

var videoFrames = ee.ImageCollection(
  ee.List(assetsRendered).iterate(mergeCollection, ee.ImageCollection([]))
).sort('system:time_start')

// show a few video frames as map layers
var list = videoFrames.toList(countMapLayers)
ee.List.sequence(0, countMapLayers - 1).getInfo(function(indices) {
  indices.map(function(index) {
    var image = ee.Image(list.get(index))
    
    var layer = ui.Map.Layer(image, {}, index.toString(), false)
    image.get('system:id').getInfo(function(id) { layer.setName(layer.getName() + ' ' + id) })
    Map.layers().add(layer)
  })
  
  // initialize chart
  initChart();
})

// add chart when no map layers are added 
if(!countMapLayers) {
  initChart();
}

/***
 * Adds chart showing all images available at the Map center
 */
function initChart() {
  if(!showChart) {
    return
  }
  
  addTimelineChart(ee.Geometry(Map.getCenter(true)).centroid(10))

  Map.onClick(function(coords) {
    coords = ee.Dictionary(coords)
    print('Map clicked: ', coords)
    var newCenter = ee.Geometry.Point([coords.get('lon'), coords.get('lat')])
    addTimelineChart(newCenter)
  })
}

// export
Export.video.toDrive({
  collection: videoFrames.select(['vis-red','vis-green', 'vis-blue']),
  description: 'all-images',
  dimensions: 1920,
  framesPerSecond: 1,
  region: ee.Geometry(Map.getBounds(true)),
  crs: 'EPSG: 3857'
})

// print total count
print('Total: ', videoFrames.aggregate_count('system:id'))

// chart layers
var chartLayers = new Queue();

function addImageAsChartLayer(layer) {
  var layers = Map.layers()
  
  // remove last chart layer, if necessary
  if(chartLayers.length() >= countChartLayersMax) {
    var removed = chartLayers.dequeue();
    layers.remove(removed)
    print('Removed layer: ' + removed.getName())
  }
  
  // add a new layer on top of the layer
  layers.insert(layers.length() - 1, layer)
  
  // add to queue
  chartLayers.enqueue(layer)
  print('Added layer: ', layer.getEeObject())
}

// show a chart with all selected images at a given location
function addTimelineChart(point) {
  // update aoi (clicked point) layer
  Map.layers().forEach(function(layer) {
    if(layer.getName() === 'aoi') {
      Map.layers().remove(layer)
      return
    }
  })

  var pointLayer = ui.Map.Layer(point, {color: 'red', opacity:0.6}, 'aoi')
  Map.layers().add(pointLayer)

  // update chart and controls
  Map.widgets().reset();

  // create a label on the map.
  var label = ui.Label('... loading chart');
  Map.add(label);
  
  // update chart series options, this should be easier, but the ui.Chart is currently very limited, no evens like onDataLoad
  var features = ee.FeatureCollection(videoFrames.map(function(i) {
    var props = ee.Dictionary(i.reduceRegion(ee.Reducer.first(), point, 10))
    props = props.set('system:time_start', i.get('system:time_start'))
    
    return ee.Feature(null, props)
  }))

  // find unique property names, use to update series options
  var properties = features.toList(5000).map(function(f) {
    return ee.Feature(f).propertyNames().remove('system:id').remove('system:time_start').remove('system:index')
  }).flatten().sort().getInfo(function(bandNames) {
    var seriesCount = distinct(bandNames).length
    
    // add chart  
    var chart = ui.Chart.feature.byFeature(features, 'system:time_start');

    chart.setChartType('ScatterChart')
    
    var chartOptions = {
      title: null,
      chartArea: {width: '95%', width: '95%'},
      vAxis: { 
        viewWindow:{
                  max:800,
                  min:0
                }
        , textStyle: { fontSize: 12 } },
      hAxis: { format: 'yyyy-MM-dd', gridlines: { count: 20 }, textStyle: { fontSize: 12 } },
      lineWidth: 1,
      //curveType: 'function',
      pointSize: 4,
      series: {}
    }
    
    // update series type for RGB bands
    chartOptions.series[seriesCount-1] = {pointSize: 0, color: '#de2d26' }
    chartOptions.series[seriesCount-2] = {pointSize: 0, color: '#31a354' }
    chartOptions.series[seriesCount-3] = {pointSize: 0, color: '#2b8cbe' }
    
    chart.setOptions(chartOptions)

    chart.style().set({
      position: 'bottom-left',
      width: '98%',
      height: '250px',
    });
    
    Map.add(chart);

    // when the chart is clicked, update the map and label.
    chart.onClick(function(xValue, yValue, seriesName) {
      if(!seriesName || seriesName.indexOf('vis-') !== -1) {
        print('Please select one of the sensor series')
        return
      }
      
      if (!xValue) {
        return;  // Selection was cleared.
      }
    
      // Show the image for the clicked date.
      var equalDate = ee.Filter.equals('system:time_start', xValue);
      var equalBand = ee.Filter.equals('assetShortName', seriesName)
      var image = ee.Image(videoFrames.filter(ee.Filter.and(equalDate, equalBand)).first());
    
      // Show a label with the date on the map.
      ee.String(ee.String(new Date(xValue).toUTCString()).cat(' ').cat(image.get('system:id'))).getInfo(function(str) {
        label.setValue(str);
    
        var layer = ui.Map.Layer(image, {}, 'chart');
        addImageAsChartLayer(layer)
        image.get('system:id').getInfo(function(id) { layer.setName(layer.getName() + ' ' + id) })
      })
    });
    
    // update label once chart is added
    label.setValue('Click a point on the chart to show the image for that date.')
  })
}

// set cursor is buggy
//Map.style().set('cursor', 'crosshair');

// returns array with distinct values
function distinct(values) {
  var unique = []
  
  values.map(function(o) {
    if(unique.indexOf(o) === -1) {
      unique.push(o)
    }
  })

  return unique;
}

/***
 * Basic queue
 */
function Queue()
{ 
  this.items = new Array();
  
  this.dequeue = function(){
    return this.items.pop(); 
  } 
  
  this.enqueue = function(item){
    this.items.unshift(item);
  }
  
  this.length = function() {
    return this.items.length;
  }
}