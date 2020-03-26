/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var outlet = /* color: #d63000 */ee.Geometry.Point([-91.48384094238281, 30.8202946836526]),
    jrcMonthly = ee.ImageCollection("JRC/GSW1_0/MonthlyHistory"),
    gebco = ee.Image("users/gena/GEBCO_2014_2D"),
    geometry = /* color: #d63000 */ee.Geometry.Polygon(
        [[[76.46278381347656, 22.13907574215403],
          [76.50947570800781, 22.120629943195453],
          [76.56852722167969, 22.12253824127443],
          [76.56715393066406, 22.106634967987656],
          [76.55685424804688, 22.04873191751729],
          [76.54655456542969, 21.975523824816985],
          [76.5582275390625, 21.917567172190733],
          [76.62551879882812, 21.907374550828305],
          [76.67083740234375, 21.933491682541014],
          [76.76216125488281, 21.980617785057056],
          [76.76834106445312, 22.03854870911104],
          [76.83563232421875, 22.03854870911104],
          [76.84524536132812, 22.088821173054],
          [76.82601928710938, 22.160698774738826],
          [76.80061340332031, 22.194398638136775],
          [76.82121276855469, 22.240166631062795],
          [76.92832946777344, 22.22681917581246],
          [76.89056396484375, 22.32594131804433],
          [76.96403503417969, 22.32721165838893],
          [76.96060180664062, 22.382460260815726],
          [76.89056396484375, 22.40975894575103],
          [76.80335998535156, 22.406584955479804],
          [76.76902770996094, 22.407854560288325],
          [76.6790771484375, 22.35769635535354],
          [76.63169860839844, 22.36214148323508],
          [76.54998779296875, 22.31704861179864],
          [76.519775390625, 22.32530614353455],
          [76.47514343261719, 22.315778178936412],
          [76.43943786621094, 22.28337823574864],
          [76.4208984375, 22.253512814974744],
          [76.41471862792969, 22.221734096670097],
          [76.45179748535156, 22.194398638136775]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var hydro = require('users/gena/packages:hydro')
var style = require('users/gena/packages:style')
var colorbrewer = require('users/gena/packages:colorbrewer')  

var catchments = hydro.getCatchments({level:6, outlet: outlet})
print(catchments.first())
var catchments3 = hydro.getCatchments({level:3})

var mask = gebco.gt(0).focal_mode(5)

hydro.Map.addDem({mask: mask, layer: {visible: false, name: 'DEM'}})
hydro.Map.addHand({mask: mask, layer: {visible: false, name: 'HAND'}})

var layerCatchments = ui.Map.Layer(catchments, {}, 'catchments')
Map.layers().add(layerCatchments)

Map.addLayer(ee.Image().paint(catchments3, 1), {palette: ['000000']}, 'catchments (L3), fill', false, 0.5)

Map.addLayer(ee.Image().paint(catchments3, 1, 1), {palette: ['ffffff']}, 'catchments (L3)', false, 0.75)

var catchments6 = hydro.getCatchments({level:6})
Map.addLayer(ee.Image().paint(catchments6, 1, 1), {palette: ['ffffff']}, 'catchments (L6)', false, 0.75)

// hydro.Map.addFlowAccumulation({threshold: 1000})
hydro.Map.addFlowAccumulation({threshold: 100, type: 'vector', layer: { opacity: 0.5, visible: false, name: 'rivers, FA < 100' } })
hydro.Map.addFlowAccumulation({threshold: 10000, type: 'vector', layer: { opacity: 0.5, name: 'rivers, FA < 10000' } })
hydro.Map.addFlowAccumulation({threshold: 100000, type: 'vector', layer: { opacity: 1, name: 'rivers, FA < 1000000' }})

var hydroLakes = ee.FeatureCollection("users/gena/HydroLAKES_polys_v10")
Map.addLayer(hydroLakes, {color: 'yellow'}, 'HydroLAKES (features)', false)
Map.addLayer(ee.Image().paint(hydroLakes, 1, 1), {palette:['ffffff']}, 'HydroLAKES', false, 0.5)

var rivers = ee.FeatureCollection('ft:1yMXz_cItkAJFvmeXNcsuW2i7kK5i1iJ0QcYK3g')
Map.addLayer(rivers, {color: 'd7301f'}, 'rivers (Natural Earth)', false, 0.5)

var waterOccurrence = ee.Image('JRC/GSW1_0/GlobalSurfaceWater').select('occurrence').divide(100)
  
waterOccurrence = waterOccurrence.updateMask(waterOccurrence.mask()
  .focal_max(2)
  .focal_mode(2, 'circle', 'pixels', 3))  
  
//waterOccurrence = waterOccurrence.updateMask(waterOccurrence.gt(0.3))

Map.addLayer(waterOccurrence, {min: 0, max:1, palette: style.Palettes.Hot }, 'JRC (1984-2015) (all)', false, 0.3)

style.SetMapStyleDark()

// add an active water mask selection layer
var layerSelection = ui.Map.Layer(waterOccurrence.clip(catchments), {min: 0, max:1, palette: style.Palettes.Hot }, 'JRC (1984-2015) hot')
Map.layers().add(layerSelection)

var layerSelection2 = ui.Map.Layer(waterOccurrence.clip(catchments), {min: 0, max:1, palette: style.Palettes.RedToBlue }, 'JRC (1984-2015) red-to-blue', false)
Map.layers().add(layerSelection2)

var layerSelection3 = ui.Map.Layer(waterOccurrence.clip(catchments), {min: 0, max:1, palette: style.Palettes.Water }, 'JRC (1984-2015) water', false)
Map.layers().add(layerSelection3)

Map.onClick(function(pt) {
  pt = ee.Geometry.Point(ee.Dictionary(pt).values().reverse())
  
  catchments = hydro.getCatchments({level:6, outlet: pt})
  layerCatchments.setEeObject(catchments)
  
  layerSelection.setEeObject(waterOccurrence.clip(catchments))
  layerSelection2.setEeObject(waterOccurrence.clip(catchments))
  layerSelection3.setEeObject(waterOccurrence.clip(catchments))
})



var color = colorbrewer.Palettes.Blues[5][4]
var selection = ee.FeatureCollection([])
var selectionLayer = ui.Map.Layer(selection, {color: color}, 'selected waterbody (click)')
Map.layers().add(selectionLayer)


// monthly time series of surface area for all waterbodies

function computeMonthlyWaterAreaAtScale(scale, computePercentiles) {
  return function computeMonthlyWaterArea(f) {
    var area = jrcMonthly.map(function(i) {
      // get water mask
      var water = i.clip(f).eq(2)
      
      // compute water area
      var waterArea = water.multiply(ee.Image.pixelArea())
        .reduceRegion({ reducer: ee.Reducer.sum(), geometry: f.geometry(), scale: scale, maxPixels: 2e7}).values().get(0)
        
      var result = ee.Feature(null, {
        time: i.date(),
        water_area: waterArea,
      })
      
      if(computePercentiles) {
        // get probability of water as a histogram for detected water pixels
        var waterPw = Pw.updateMask(water).reduceRegion(ee.Reducer.histogram(50), f.geometry(), scale) // 50 buckets, 2% precision
  
        result = result
          .set({ water_area_percentiles: waterPw.values().get(0) })
      }

      return result
    })

    area = ee.FeatureCollection(area)
      .filter(ee.Filter.gt('water_area', 0))
      
    f = f.set({
      time: area.aggregate_array('time'),
      water_area: area.aggregate_array('water_area'),
    })
    
    if(computePercentiles) {
      f = f.set({
        water_area_percentiles: area.aggregate_array('water_area_percentiles'),
      })
    }

    return f
  }
}


function showTimeSeries(selection) {
  selection = selection.buffer(Map.getScale()*30)

  selectionLayer.setEeObject(selection)
  
  print("Map scale: ", Map.getScale())
  
  print("Name: ", selection.get('Lake_name'))
  
  var ts = computeMonthlyWaterAreaAtScale(Map.getScale() * 0.2)(selection)
  var area = ee.List(ts.get('water_area'))
  var time = ee.List(ts.get('time'))

  // convert to features, somehow ui.Chart.array can't interpret dates :(  
  ts = time.zip(area).map(function(o) { 
    var o = ee.List(o)
    return ee.Feature(null, {
      time: o.get(0),
      water_area: o.get(1)
    })
  })
  
  print(ui.Chart.feature.byFeature(ts, 'time', ['water_area']))
}

showTimeSeries(ee.Feature(geometry))

Map.onClick(function(pt) {
  pt = ee.Geometry.Point(ee.Dictionary(pt).values().reverse())

  selection = ee.Feature(hydroLakes.filterBounds(pt).first())
  
  var g = hydro.getCatchments({level:6, outlet: pt}).geometry()
  
  var selectedLakes = hydroLakes.filterBounds(g.bounds())

/*  selectedLakes = selectedLakes.map(function(f) {
    return f.set({intersects: f.intersects(g)})
  }).filter(ee.Filter.eq('intersects', true))
*/  
  // print(selectedLakes.size())
  
  print(selection)

  selection.evaluate(function(selection) {
    if(selection !== null) {
      showTimeSeries(ee.Feature(selection))
    } else {
      selectionLayer.setEeObject(ee.Feature(null))
    }
  })
})
