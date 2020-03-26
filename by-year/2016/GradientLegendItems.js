// Select a province from Fusion Table
var province = ee.FeatureCollection('ft:1u1WDUQgzaeiM7nEreyN2EQjatA_C5NVSwasDtL8Q');
var provinceName = province.filter(ee.Filter.eq('NAME_1', 'Isabela')).geometry();

// Load Image Collection
var BAND_NAME = 'PsnNet';
var collection = ee.ImageCollection('MODIS/006/MOD17A2H')
    .select(BAND_NAME)
    .filterDate('2000-01-01','2010-12-31');

// set palette
var vis = {min: 0,
           max: 1000,
           palette: ['FFFFFF', 'CE7E45', 'FCD163', '66A000', '207401',
  '056201', '004C00', '023B01', '012E01', '011301']};

// Get the desired temperature for each grid over the
// the specified duration
var tempReduce = collection
                 .reduce(ee.Reducer.mean());

// Get the temperature at every grid in the province
var temperature = tempReduce.clip(provinceName);

print(ui.Chart.image.series(collection,provinceName,ee.Reducer.mean(),250));

// Compute statatistics of a given area
var stats = tempReduce.reduceRegion({
            geometry: provinceName,
//            crs: temperature.projection(),
            scale: 250,
            reducer: ee.Reducer.mean() 
            });
            
print(stats);

// visualize map
Map.centerObject(provinceName,8);
Map.addLayer(collection.reduce(ee.Reducer.mean())
              .clip(provinceName),vis,'temperature');
// Create the panel for the legend items.
var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

// Create and add the legend title.
var legendTitle = ui.Label({
  value: 'MODIS Land Cover',
  style: {
    fontWeight: 'bold',
    fontSize: '18px',
    margin: '0 0 4px 0',
    padding: '0'
  }
});
legend.add(legendTitle);

var loading = ui.Label('Loading legend...', {margin: '2px 0 4px 0'});
legend.add(loading);

// Creates and styles 1 row of the legend.
var makeRow = function(color, name) {
  // Create the label that is actually the colored box.
  var colorBox = ui.Label({
    style: {
      backgroundColor: '#' + color,
      // Use padding to give the box height and width.
      padding: '8px',
      margin: '0 0 4px 0',
    }
  });

  // Create the label filled with the description text.
  var description = ui.Label({
    value: name,
    style: {margin: '0 0 4px 6px'}
  });

  return ui.Panel({
    widgets: [colorBox, description],
    layout: ui.Panel.Layout.Flow('horizontal'),
  });
};

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

// sample colors from the image using histogram reducer and use them for legend
function addGradientLegendItems(image, opt_count, opt_scale, opt_digits) {
  // sample legend items using histogram
  var scale = opt_scale || 5000
  var buckets = opt_count || 10
  var digits = opt_digits || 2
  
  if(opt_digits === 0) {
    digits = 0
  }
  
  // use histogram bucket values as legend items
  var hist = ee.Dictionary(image.reduceRegion(ee.Reducer.histogram(buckets), image.geometry().bounds(), scale)).values().get(0)
  var values = ee.List(ee.Dictionary(hist).get('bucketMeans'))

  // convert to colors ... this has to be easier, maybe like ee.Colormap(palette).toColors(values)
  var colors = values.map(function(v) {
    var color = ee.Image.constant(v).visualize(vis).reduceRegion(ee.Reducer.first(), ee.Algorithms.GeometryConstructors.Point([0,0]), 1)
    return color
  })

  // convert rgb colors to hex on the client  
  var colorsHex = colors.getInfo().map(function(color) {
    var r = color['vis-red'].toString(16)
    var g = color['vis-green'].toString(16)
    var b = color['vis-blue'].toString(16)
    return pad(r, 2) + pad(g, 2) + pad(b, 2);
  })

  // add legend items  
  values = values.getInfo()
  for (var i = 0; i < values.length; i++) {
    legend.add(makeRow(colorsHex[i], values[i].toFixed(digits)));
  }
}

var count = 7
var scale = 5000
addGradientLegendItems(temperature, count, scale)

Map.add(legend);
