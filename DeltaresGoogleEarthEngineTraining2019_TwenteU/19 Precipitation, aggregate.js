/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var south = /* color: #0b4a8b */ee.Geometry.Polygon(
        [[[17.666015625, -17.476432197195518],
          [10.546875, -15.114552871944102],
          [14.150390625, -27.293689224852393],
          [16.875, -35.46066995149529],
          [35.859375, -33.72433966174759],
          [34.98046875, -27.371767300523036],
          [39.462890625, -20.3034175184893],
          [31.2890625, -19.394067895396613],
          [23.994140625, -18.47960905583197]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var collections = [
  { 
    name: 'CHIRPS', scale: 5000, 
    collection: ee.ImageCollection('UCSB-CHG/CHIRPS/PENTAD')
  },
  {
    name: 'PERSIANN', scale: 5000,
    collection: ee.ImageCollection('NOAA/PERSIANN-CDR')
  },
  { 
    name: 'CFSV2', scale: 30000,
    collection: ee.ImageCollection('NOAA/CFSV2/FOR6H')
      .select('Precipitation_rate_surface_6_Hour_Average')
      .map(function(i) { 
        return i.multiply(60 * 60 * 6) // convert to mm
          .copyProperties(i, ['system:time_start'])
      })
  },
  {
    name: 'TRMM', scale: 30000,
    collection: ee.ImageCollection('TRMM/3B42')
     .select('precipitation')
      .map(function(i) { 
        return i.multiply(3) // convert to mm
          .copyProperties(i, ['system:time_start'])
  })
  },
  { 
    name: 'GLDAS', scale: 30000,
    collection: ee.ImageCollection('NASA/GLDAS/V021/NOAH/G025/T3H')
      .select('Rainf_tavg')
      .map(function(i) { 
        return i.multiply(60 * 60 * 3) // convert to mm
          .copyProperties(i, ['system:time_start'])
      })
   }
  ];
  
function getDates(start, stop, step) {
  return ee.List.sequence(start, stop).map(function(year) {
    return ee.List.sequence(1, 12, step).map(function(month) {
      return ee.Date.fromYMD(year, month, 1)
    })
  }).flatten()
}

function compute(start, stop, step) {
  var dates = getDates(start, stop, step)

  var features = collections.map(function(c) {
    return dates.map(function(d) {
      var p = c.collection
        .filterDate(d, ee.Date(d).advance(step, 'month'))
        .sum()
        .reduceRegion(ee.Reducer.mean(), south, c.scale).values().get(0)
        
      return ee.Feature(null)
        .set('system:time_start', ee.Date(d).millis())
        .set(c.name, p)        
    })
  })
  
  return ee.FeatureCollection(ee.List(features).flatten())
}

var monthly = compute(2001, 2015, 1)
var annual = compute(2001, 2015, 12)

function chart(features, title) {
  var chart = ui.Chart.feature.byFeature(features, 'system:time_start')
  chart.setOptions({
    vAxis: { title: 'Precipitation [mm]' },
    title: title
  })
  print(chart)
}

chart(monthly, 'Monthly precipitation  (South Africa)')
chart(annual, 'Annual precipitation (South Africa)')
