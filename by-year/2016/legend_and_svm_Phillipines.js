// Determine the production area of a given province
// using Sentinel 1, and 'USGS/SRTMGL1_003' DEM

// Load provinces from Fusion Table
var province = ee.FeatureCollection('ft:1t9a8O96mnbrGAI8Cb9hJpKkw-2aTvhJHWMV-o7cz');

//Center Map to Philippines
Map.setCenter(121,14,6);

// Philippine Provinces
var places = {
  ABRA: [province.filter(ee.Filter.eq('NAME_1', 'Abra')).geometry()],
  AGUSAN_DEL_NORTE: [province.filter(ee.Filter.eq('NAME_1', 'Agusan del Norte')).geometry()],
  AGUSAN_DEL_SUR: [province.filter(ee.Filter.eq('NAME_1', 'Agusan del Sur')).geometry()],
  AKLAN: [province.filter(ee.Filter.eq('NAME_1', 'Aklan')).geometry()],
  ALBAY: [province.filter(ee.Filter.eq('NAME_1', 'Albay')).geometry()],
  ANTIQUE: [province.filter(ee.Filter.eq('NAME_1', 'Antique')).geometry()],
  APAYAO: [province.filter(ee.Filter.eq('NAME_1', 'Apayao')).geometry()],
  AURORA: [province.filter(ee.Filter.eq('NAME_1', 'Aurora')).geometry()],
  BASILAN: [province.filter(ee.Filter.eq('NAME_1', 'Basilan')).geometry()],
  BATAAN: [province.filter(ee.Filter.eq('NAME_1', 'Bataan')).geometry()],
  BATANES: [province.filter(ee.Filter.eq('NAME_1', 'Batanes')).geometry()],
  BATANGAS: [province.filter(ee.Filter.eq('NAME_1', 'Batangas')).geometry()],
  BENGUET:[province.filter(ee.Filter.eq('NAME_1', 'Benguet')).geometry()],
  BILIRAN: [province.filter(ee.Filter.eq('NAME_1', 'Biliran')).geometry()],
  BOHOL:[province.filter(ee.Filter.eq('NAME_1', 'Bohol')).geometry()],
  BUKIDNON:[province.filter(ee.Filter.eq('NAME_1', 'Bukidnon')).geometry()],
  BULACAN:[province.filter(ee.Filter.eq('NAME_1', 'Bulacan')).geometry()],
  CAGAYAN:[province.filter(ee.Filter.eq('NAME_1', 'Cagayan')).geometry()],
  CAMARINES_NORTE:[province.filter(ee.Filter.eq('NAME_1', 'Camarines Norte')).geometry()],
  CAMARINES_SUR:[province.filter(ee.Filter.eq('NAME_1', 'Camarines Sur')).geometry()],
  CAMIGIUN:[province.filter(ee.Filter.eq('NAME_1', 'Camiguin')).geometry()],
  CAPIZ: [province.filter(ee.Filter.eq('NAME_1', 'Capiz')).geometry()],
  CATANDUANES: [province.filter(ee.Filter.eq('NAME_1', 'Catanduanes')).geometry()],
  CAVITE: [province.filter(ee.Filter.eq('NAME_1', 'Cavite')).geometry()],
  CEBU: [province.filter(ee.Filter.eq('NAME_1', 'Cebu')).geometry()],
  COMPOSTELA_VALLEY: [province.filter(ee.Filter.eq('NAME_1', 'Compostela Valley')).geometry()],
  DAVAO_ORIENTAL: [province.filter(ee.Filter.eq('NAME_1', 'Davao Oriental')).geometry()],
  DAVAO_DEL_NORTE: [province.filter(ee.Filter.eq('NAME_1', 'Davao del Norte')).geometry()],
  DAVAO_DEL_SUR: [province.filter(ee.Filter.eq('NAME_1', 'Davao del Sur')).geometry()],
  DINAGAT_ISLANDS: [province.filter(ee.Filter.eq('NAME_1', 'Dinagat Islands')).geometry()],
  EASTERN_SAMAR: [province.filter(ee.Filter.eq('NAME_1', 'Eastern Samar')).geometry()],
  GUIMARAS: [province.filter(ee.Filter.eq('NAME_1', 'Guimaras')).geometry()],
  IFUGAO: [province.filter(ee.Filter.eq('NAME_1', 'Ifugao')).geometry()],
  ILOCOS_NORTE: [province.filter(ee.Filter.eq('NAME_1', 'Ilocos Norte')).geometry()],
  ILOCOS_SUR:[province.filter(ee.Filter.eq('NAME_1', 'Ilocos Sur')).geometry()],
  ILOILO:[province.filter(ee.Filter.eq('NAME_1', 'Iloilo')).geometry()],
  ISABELA:[province.filter(ee.Filter.eq('NAME_1', 'Isabela')).geometry()],
  KALINGA: [province.filter(ee.Filter.eq('NAME_1', 'Kalinga')).geometry()],
  LA_UNION:[province.filter(ee.Filter.eq('NAME_1', 'La Union')).geometry()],
  LAGUNA: [province.filter(ee.Filter.eq('NAME_1', 'Laguna')).geometry()],
  LANAO_DEL_NORTE: [province.filter(ee.Filter.eq('NAME_1', 'Lanao del Norte')).geometry()],
  LANAO_DEL_SUR: [province.filter(ee.Filter.eq('NAME_1', 'Lanao del Sur')).geometry()],
  LEYTE:[province.filter(ee.Filter.eq('NAME_1', 'Leyte')).geometry()],
  MAGUINDANAO: [province.filter(ee.Filter.eq('NAME_1', 'Maguindanao')).geometry()],
  MARINDUQUE: [province.filter(ee.Filter.eq('NAME_1', 'Marinduque')).geometry()],
  MASBATE: [province.filter(ee.Filter.eq('NAME_1', 'Masbate')).geometry()],
  MANILA: [province.filter(ee.Filter.eq('NAME_1', 'Metropolitan Manila')).geometry()],
  MISAMIS_OCCIDENTAL: [province.filter(ee.Filter.eq('NAME_1', 'Misamis Occidental')).geometry()],
  MISAMIS_ORIENTAL: [province.filter(ee.Filter.eq('NAME_1', 'Misamis Oriental')).geometry()],
  MOUNTAIN_PROVINCE:[province.filter(ee.Filter.eq('NAME_1', 'Mountain Province')).geometry()],
  NEGROS_OCCIDENTAL:[province.filter(ee.Filter.eq('NAME_1', 'Negros Occidental')).geometry()],
  NEGROS_ORIENTAL:[province.filter(ee.Filter.eq('NAME_1', 'Negros Oriental')).geometry()],
  NORTH_COTABATO: [province.filter(ee.Filter.eq('NAME_1', 'North Cotabato')).geometry()],
  NORTHERN_SAMAR:[province.filter(ee.Filter.eq('NAME_1', 'Northern Samar')).geometry()],
  NUEVA_ECIJA: [province.filter(ee.Filter.eq('NAME_1', 'Nueva Ecija')).geometry()],
  NUEVA_VIZCAYA: [province.filter(ee.Filter.eq('NAME_1', 'Nueva Vizcaya')).geometry()],
  OCCIDENTAL_MINDORO: [province.filter(ee.Filter.eq('NAME_1', 'Occidental Mindoro')).geometry()],
  ORIENTAL_MINDORO: [province.filter(ee.Filter.eq('NAME_1', 'Oriental Mindoro')).geometry()],
  PALAWAN: [province.filter(ee.Filter.eq('NAME_1', 'Palawan')).geometry()],
  PAMPANGA: [province.filter(ee.Filter.eq('NAME_1', 'Pampanga')).geometry()],
  PANGASINAN: [province.filter(ee.Filter.eq('NAME_1', 'Pangasinan')).geometry()],
  QUEZON:[province.filter(ee.Filter.eq('NAME_1', 'Quezon')).geometry()],
  QUIRINO: [province.filter(ee.Filter.eq('NAME_1', 'Quirino')).geometry()],
  RIZAL: [province.filter(ee.Filter.eq('NAME_1', 'Rizal')).geometry()],
  ROMBLON: [province.filter(ee.Filter.eq('NAME_1', 'Romblon')).geometry()],
  SAMAR: [province.filter(ee.Filter.eq('NAME_1', 'Samar')).geometry()],
  SARANGANI: [province.filter(ee.Filter.eq('NAME_1', 'Sarangani')).geometry()],
  SHARIFF_KABUNSUAN: [province.filter(ee.Filter.eq('NAME_1', 'Shariff Kabunsuan')).geometry()],
  SIQUIJOR: [province.filter(ee.Filter.eq('NAME_1', 'Siquijor')).geometry()],
  SORSOGON: [province.filter(ee.Filter.eq('NAME_1', 'Sorsogon')).geometry()],
  SOUTH_COTABATO: [province.filter(ee.Filter.eq('NAME_1', 'South Cotabato')).geometry()],
  SOUTHERN_LEYTE: [province.filter(ee.Filter.eq('NAME_1', 'Southern Leyte')).geometry()],
  SULTAN_KUDARAT: [province.filter(ee.Filter.eq('NAME_1', 'Sultan Kudarat')).geometry()],
  SULU: [province.filter(ee.Filter.eq('NAME_1', 'Sulu')).geometry()],
  SURIGAO_DEL_NORTE: [province.filter(ee.Filter.eq('NAME_1', 'Surigao del Norte')).geometry()],
  SURIGAO_DEL_SUR: [province.filter(ee.Filter.eq('NAME_1', 'Surigao del Sur')).geometry()],
  TARLAC: [province.filter(ee.Filter.eq('NAME_1', 'Tarlac')).geometry()],
  TAWITAWI: [province.filter(ee.Filter.eq('NAME_1', 'Tawi-Tawi')).geometry()],
  ZAMBALES: [province.filter(ee.Filter.eq('NAME_1', 'Zambales')).geometry()],
  ZAMBOANGA_SIBUGAY: [province.filter(ee.Filter.eq('NAME_1', 'Zamboanga Sibugay')).geometry()],
  ZAMBOANGA_DEL_NORTE:[province.filter(ee.Filter.eq('NAME_1', 'Zamboanga del Norte')).geometry()],
  ZAMBOANGA_DEL_SUR: [province.filter(ee.Filter.eq('NAME_1', 'Zamboanga del Sur')).geometry()],
};

var legend = ui.Panel({
  style: {
    position: 'bottom-left',
    padding: '8px 15px'
  }
});

var gfcImage = ee.Image("UMD/hansen/global_forest_change_2015");
// Use these bands for prediction.
var bands = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7'];

// Load an image over a portion of southern California, USA.
var image = ee.Algorithms.Landsat.simpleComposite({
  collection:ee.ImageCollection('LANDSAT/LC8_L1T'),
  asFloat:true,
}).select('B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7');

// Load training polygons from a Fusion Table.
// The 'class' property stores known class labels.
var polygons = ee.FeatureCollection('ft:13jXrJfabhs6vGX0vkY8Dqnbg0V76R0UQthD76Yj-');

// Get the values for all pixels in each polygon in the training.
var training = image.sampleRegions({
  // Get the sample from the polygons FeatureCollection.
  collection: polygons,
  // Keep this list of properties from the polygons.
  properties: ['class'],
  // Set the scale to get Landsat pixels in the polygons.
  scale: 30
});

// Create an SVM classifier with custom parameters.
var classifier = ee.Classifier.svm({
  kernelType: 'RBF',
  gamma: 2,
  cost: 50,
  
});

// Train the classifier.
var trained = classifier.train(training, 'class', bands);
var treeCover = gfcImage.select(['treecover2000']);
//var image2 = image.subtract(treeCover);
// Classify the image.
var classified = image.classify(trained);

// Create a palette to display the classes.
var palette =[
  '011301', '012E01', '023B01', '004C00', '00ff00',
  '207401', '66A000', 'FCD163', 'CE7E45', '0000ff'];


//Start with an image of zeros
//var altNaiveClass = ee.Image(0) 

// Create a variable "select" with a function that reacts to the "change" event.
var select = ui.Select({
  items: Object.keys(places),
  
  // %%%%%%%%%%%%%%  START onChange functiion  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  onChange: function(key) {
    Map.layers().reset();
    Map.centerObject(places[key][0], places[key][1]);
    // Map.addLayer(places[key][0], places[key][1]);
    
    var selected = ee.Feature(places[key][0], places[key][1]);
    
    Map.addLayer(selected,{color:'00ff00'},'province',false);

    // Calculate the area and print the value to the console.
    // print('Area: ' + selected.area().divide(10000).getInfo());
    
    var landsat = image.clip(selected);
    var classify = classified.clip(selected);
    Map.setCenter(121.7354, 17.0423, 12);
    Map.addLayer(landsat, {bands: ['B7', 'B4', 'B3'], min: 0.05, max: 0.1, gamma: 1.6});
    
    var vis = {min: 0, max: 10, palette: palette}
    Map.addLayer(classify, vis, 'Vegetation Type');
    
    //Add legend
    // Create and add the legend title.
    var legendTitle = ui.Label({
      value: 'Clasification',
      style: {
        fontWeight: 'bold',
        fontSize: '18px',
        margin: '0 0 4px 0',
        padding: '0'
      }
    });
    legend.clear();
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
          margin: '0 0 4px 0'
        }
      });
    
      // Create the label filled with the description text.
      var description = ui.Label({
        value: name,
        style: {margin: '0 0 4px 6px'}
      });
    
      return ui.Panel({
        widgets: [colorBox, description],
        layout: ui.Panel.Layout.Flow('horizontal')
      });
    };
    
    function pad(n, width, z) {
      z = z || '0';
      n = n + '';
      return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
    }
    
    // sample colors from the image using histogram reducer and use them for legend
    function addGradientLegendItems(image, region, opt_count, opt_scale, opt_digits) {
      // sample legend items using histogram
      var scale = opt_scale || 5000;
      var buckets = opt_count || 10;
      var digits = opt_digits || 2;
      
      if(opt_digits === 0) {
        digits = 0;
      }
      
      // use histogram bucket values as legend items
      var hist = ee.Dictionary(image.reduceRegion(ee.Reducer.histogram(buckets), region, scale)).values().get(0);
      var values = ee.List(ee.Dictionary(hist).get('bucketMeans'));
    
      // convert to colors ... this has to be easier, maybe like ee.Colormap(palette).toColors(values)
      var colors = values.map(function(v) {
        var color = ee.Image.constant(v)
          .visualize(vis)
          .reduceRegion(ee.Reducer.first(), ee.Algorithms.GeometryConstructors.Point([0,0]), 1);
        
        return color;
      });
    
      // convert rgb colors to hex on the client  
      colors.getInfo(function(colors) {
        var colorsHex = colors.map(function(color) {
          var r = color['vis-red'].toString(16);
          var g = color['vis-green'].toString(16);
          var b = color['vis-blue'].toString(16);
          return pad(r, 2) + pad(g, 2) + pad(b, 2);
        });
    
        // add legend items  
        values.getInfo(function(values) {
          Map.remove(legend);
          Map.add(legend);
          for (var i = 0; i < values.length; i++) {
            legend.add(makeRow(colorsHex[i], values[i].toFixed(digits)));
          }    
        });
      })
    }
    
    var count = 10;
    var scale = 5000;
    var geometry = places[key][0]
    addGradientLegendItems(classify, geometry, count, scale);
    loading.style().set('shown', false);
  }
});  
  

    
 
  // %%%%%%%%%%%%%%  END onChange functiion  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

// Set a place holder.
select.setPlaceholder('Choose a province...');

// Create an inspector panel with a horizontal layout.
var inspector = ui.Panel({
  layout: ui.Panel.Layout.flow('horizontal')
});

// Add Province selection in Panel
inspector.add(select);

// Add the panel to the default map.
Map.add(inspector);

// Set the default map's cursor to a "crosshair".
Map.style().set('cursor', 'crosshair');

// Create a panel to hold our widgets.
var panel = ui.Panel();
panel.style().set('width', '300px');

Map.add(legend);