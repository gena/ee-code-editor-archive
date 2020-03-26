/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var light = ee.ImageCollection("NOAA/VIIRS/DNB/MONTHLY_V1/VCMSLCFG"),
    geometry = /* color: #d63000 */ee.Geometry.Point([30.27008056640625, 21.99398856090617]),
    light2 = ee.ImageCollection("NOAA/VIIRS/DNB/MONTHLY_V1/VCMCFG"),
    modis = ee.ImageCollection("MODIS/MYD09GA"),
    modis_mod = ee.ImageCollection("MODIS/MOD09GA"),
    aoi = /* color: #d63000 */ee.Geometry.LineString(
        [[29.850831055223694, 23.971163438870597],
         [34.075082768006496, 21.627028731986897]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var utils = require('users/gena/packages:utils')
var assets = require('users/gena/packages:assets')
var text = require('users/gena/packages:text')

//modis = ee.ImageCollection(modis.merge(modis_mod))

var useLandsat = true
//var useLandsat = false
       
light = light2

function app() {
  var hot = ['222222', 'ff0000', 'ffff00', 'ffffff']
  var scale = Map.getScale() 
  
  light = light.select(0)

  //var aoi = Map.getBounds(true)
  aoi = aoi.bounds()
  var bounds = utils.generateExportParameters(aoi, 1920, 1080, 'EPSG:3857')
  
  Map.addLayer(bounds.bounds)

  var landsat = assets.getImages(ee.Geometry(aoi), { sensors: ['L5', 'L7', 'L8', 'S2'] })
  

//  light = light.map(function(i) {
//    return i.reduceResolution(ee.Reducer.max()).reproject(i.projection().scale(3,3)).set('system:time_start', i.get('system:time_start'))
//  })
  
  
  // coutries  
  var countries = ee.FeatureCollection('ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw').filterBounds(bounds.bounds)
  
  var countriesLabel = countries.map(function(f) {
    var pt = f.geometry().intersection(bounds.bounds).buffer(-10000, 1000).centroid(100)
    pt = ee.Algorithms.GeometryConstructors.Point(translate(pt.coordinates(), 0, -0.5))
    
    return text.draw(f.get('Country'), pt, scale, {fontSize:18, outlineWidth:4})
  })
  countriesLabel = ee.ImageCollection(countriesLabel).mosaic()

  countries = ee.Image().paint(countries, 1, 1).visualize({palette:['ffffff']})

  // cities
  var cities = ee.FeatureCollection('ft:10oAgy872tFwLQQeqG3R5QsozP5_h9mwwijpQqw')
    //.filter(ee.Filter.gt('pop_max', 1000000))
    //.filter(ee.Filter.or(ee.Filter.eq('adm0cap', 1), ee.Filter.gt('pop_max', 2000000)))
    .filter(ee.Filter.or(ee.Filter.eq('adm0cap', 1), ee.Filter.gt('pop_max', 500000)))
    .filter(ee.Filter.neq('name', 'Delhi'))
    .sort('pop_max', true)

  var citiesLabel = cities.filterBounds(bounds.bounds).map(function(f) {
    return text.draw(f.get('name'), f.geometry(), scale, {fontSize:14, outlineWidth:4, outlineOpacity:0.5})
  })
  citiesLabel = ee.ImageCollection(citiesLabel).mosaic()

  Map.addLayer(citiesLabel, {}, 'cities label', false)
  Map.addLayer(cities, {color:'green'}, 'cities', false)

  var step = 0.1  // years

  var offset = 0.5
  var offsetLight = 1
  
  if(useLandsat) 
  {
    offset = 0.5
    offsetLight = 0.5
  }

  var startYear = 2003
  var stopYear = 2017
  var start = ee.Date.fromYMD(startYear,1,1)
 
  var images = ee.List.sequence(0, stopYear-startYear, step).map(function(y) {
    var t0 = start.advance(y, 'year')
    var t1 = start.advance(ee.Number(y).add(offset), 'year')
    
    var t2 = start.advance(ee.Number(y).add(offsetLight), 'year')

    var image = modis.filterDate(t0, t1)
      .select(['sur_refl_b06', 'sur_refl_b02', 'sur_refl_b01'])
      .reduce(ee.Reducer.percentile([5])).visualize({min:400, max:6000, gamma:1.2})
      
    if(useLandsat) {
      image = landsat.filterDate(t0, t1)
        .filterBounds(bounds.bounds)
        .reduce(ee.Reducer.percentile([25])).visualize({min:0.03, max:0.4})
    }      
      
    var l = light.filterDate(t0, t2)
    
    l = l.median() // reduce(ee.Reducer.percentile([85]))
    l = l.where(l.lte(0), 0.001)//.log().multiply(l)//.pow(0.9).log()
      .mask(l.multiply(0.5))
      .visualize({min:0, max:3, palette:hot})
    
    return image
      .set('system:time_start', t0.millis())
      .set('time_interval', ee.String(' ').cat(t0.format('YYYY-MM').cat('...').cat(t1.format('YYYY-MM'))))
    
/*    return ee.ImageCollection.fromImages([
      image,
      ee.Image(1).visualize({palette:['000000'], opacity:0.3}),
      l
    ]).mosaic()
      .set('system:time_start', t0.millis())
      .set('time_interval', ee.String(' ').cat(t0.format('YYYY-MM').cat('...').cat(t1.format('YYYY-MM'))))
*/
  })


  var rendered = images.map(function(i) {
    i = ee.Image(i)
    var image = i
    var t = text.draw(i.get('time_interval'), geometry, scale, {fontSize:32})
    
    return ee.ImageCollection.fromImages([
      ee.Image(1).visualize({palette:['000000']}),
      image,
      countries.visualize({opacity:0.3, forceRgbOutput: true}),
      countriesLabel,
      //citiesLabel,
      t
    ]).mosaic()
  })
  
  rendered = ee.ImageCollection(rendered)
   
  var count = 1
  var list = rendered.toList(count)
  ee.List.sequence(0, count-1).getInfo().map(function(i) {
    Map.addLayer(ee.Image(list.get(i)).clip(bounds.bounds), {}, i.toString(), i === 0)
  })
  
  //Map.addLayer(bounds.bounds)
  
  Export.video.toDrive({collection:rendered, region:bounds.bounds, crs: 'EPSG:3857', dimensions: '1920', framesPerSecond: 12})
}






function translate(coord, x, y) {
  var x1 = ee.Number(coord.get(0)).subtract(x)
  var y1 = ee.Number(coord.get(1)).subtract(y)
  
  return ee.List([x1, y1])
}

app()


