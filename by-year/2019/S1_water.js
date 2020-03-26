/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var aoi = 
    /* color: #ffc82d */
    /* shown: false */
    ee.Geometry.Polygon(
        [[[14.767606461260016, 51.287627485964315],
          [14.743788333804105, 51.28185655322636],
          [14.733030539421293, 51.27797065242403],
          [14.733088620299554, 51.27258101697182],
          [14.736938934849604, 51.269456951353575],
          [14.74164716643952, 51.269339889476335],
          [14.743299627672513, 51.268128507200785],
          [14.74632528940208, 51.2675615031855],
          [14.747912835175612, 51.26470908765412],
          [14.753169729532601, 51.265830200249546],
          [14.755680314472215, 51.266306872820884],
          [14.760358331959651, 51.265863735951115],
          [14.763995418363152, 51.26369565807096],
          [14.764612066185691, 51.25955004012585],
          [14.774497972006316, 51.25970106961385],
          [14.781601499381168, 51.26750172563155],
          [14.791171669098276, 51.26798505026861],
          [14.80460392815587, 51.267246716453776],
          [14.811384801800386, 51.26981754014618],
          [14.812951277087564, 51.27353267519136],
          [14.81039779952016, 51.277247808161995],
          [14.798424380182837, 51.280898733289206],
          [14.77962739155987, 51.283448816378375],
          [14.771988420538264, 51.2871529078809]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/

// Zoom to regions of interest
Map.centerObject(aoi);

// import sentinel 1 and filter data series
var s1 =  ee.ImageCollection('COPERNICUS/S1_GRD')
.filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
//.filter(ee.Filter.eq('instrumentMode', 'IW'))
//.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
.filterBounds(aoi)
//.filterBounds(Map.getBounds(true))
.filterDate('2018-11-01','2019-10-31')
.filter(ee.Filter.contains({leftField: ".geo", rightValue: aoi})) // Filter partial S1-Images of AOI
.map(function(image){return image.clip(Map.getBounds(true))})
.map(function(image){return image.addBands(image.select('VV').focal_median(parseFloat('50'),'circle','meters').rename('VV_smoothed'))}); // Smooth S1-Images

// Return the DN that maximizes interclass variance in S1-band (in the region).
var otsu = function(histogram) {
  var counts = ee.Array(ee.Dictionary(histogram).get('histogram'));
  var means = ee.Array(ee.Dictionary(histogram).get('bucketMeans'));
  var size = means.length().get([0]);
  var total = counts.reduce(ee.Reducer.sum(), [0]).get([0]);
  var sum = means.multiply(counts).reduce(ee.Reducer.sum(), [0]).get([0]);
  var mean = sum.divide(total);
  
  var indices = ee.List.sequence(1, size);
  
// Compute between sum of squares, where each mean partitions the data.
  var bss = indices.map(function(i) {
    var aCounts = counts.slice(0, 0, i);
    var aCount = aCounts.reduce(ee.Reducer.sum(), [0]).get([0]);
    var aMeans = means.slice(0, 0, i);
    var aMean = aMeans.multiply(aCounts)
        .reduce(ee.Reducer.sum(), [0]).get([0])
        .divide(aCount);
    var bCount = total.subtract(aCount);
    var bMean = sum.subtract(aCount.multiply(aMean)).divide(bCount);
    return aCount.multiply(aMean.subtract(mean).pow(2)).add(
           bCount.multiply(bMean.subtract(mean).pow(2)));
  });
  
// Return the mean value corresponding to the maximum BSS.
  return means.sort(bss).get([-1]);
};

// return image with water mask as additional band
var add_waterMask = function(image){
  // Compute histogram
  var histogram = image.select('VV').reduceRegion({
    reducer: ee.Reducer.histogram(255, 2)
      .combine('mean', null, true)
      .combine('variance', null, true), 
    geometry: aoi, 
    scale: 10,
    bestEffort: true
  });
  // Calculate threshold via function otsu (see before)
  var threshold = otsu(histogram.get('VV_histogram'));
  
  // get watermask
  var waterMask = image.select('VV_smoothed').lt(threshold).rename('waterMask').clip(aoi);
  waterMask = waterMask.updateMask(waterMask); //Remove all pixels equal to 0
  return image.addBands(waterMask);
};

s1 = s1.map(add_waterMask);

print(s1);

//Calculating water occurrence
var min_occurence = 5;
var water_sum = s1.select('waterMask').reduce(ee.Reducer.sum());
var water_frequency = water_sum.divide(s1.select('waterMask').size()).multiply(100);
var water_frequency_masked = water_frequency.updateMask(water_frequency.gte(min_occurence));

//Add color bar
//base code adapted from: 
//https://gis.stackexchange.com/questions/290713/adding-map-key-to-map-or-console-in-google-earth-engine
//https://code.earthengine.google.com/9f890c110e98fa3391480543009c8028

function ColorBar(palette) {
  return ui.Thumbnail({
    image: ee.Image.pixelLonLat().select(0),
    params: {
      bbox: [0, 0, 1, 0.1],
      dimensions: '300x15',
      format: 'png',
      min: 0,
      max: 1,
      palette: palette,
    },
    style: {stretch: 'horizontal', margin: '0px 22px'},
  });
}
function makeLegend(lowLine, midLine, highLine,lowText, midText, highText, palette) {
  var  labelheader = ui.Label('Water occurrence during investigation period',{margin: '5px 17px', textAlign: 'center', stretch: 'horizontal', fontWeight: 'bold'});
  var labelLines = ui.Panel(
      [
        ui.Label(lowLine, {margin: '-4px 21px'}),
        ui.Label(midLine, {margin: '-4px 0px', textAlign: 'center', stretch: 'horizontal'}),
        ui.Label(highLine, {margin: '-4px 21px'})
      ],
      ui.Panel.Layout.flow('horizontal'));
      var labelPanel = ui.Panel(
      [
        ui.Label(lowText, {margin: '0px 14.5px'}),
        ui.Label(midText, {margin: '0px 0px', textAlign: 'center', stretch: 'horizontal'}),
        ui.Label(highText, {margin: '0px 1px'})
      ],
      ui.Panel.Layout.flow('horizontal'));
    return ui.Panel({
      widgets: [labelheader, ColorBar(palette), labelLines, labelPanel], 
      style: {position:'bottom-left'}});
}
Map.add(makeLegend('|', '|', '|', "0 %", '50 %', '100%', ['orange','yellow','lightblue','darkblue']));

// time-lapse animation
var timelapse = {
  bands: ["VV","VV","VV"],
  region: aoi,
  min: -20,
  max: 0,
  framesPerSecond: 5};
  
var animation = ui.Thumbnail({
  image: s1,
  params: timelapse,
  style: {
    position: 'bottom-left',
    width: '360px',
  }});

//Add layers ans animation to map
Map.addLayer(s1.median(),{bands: ['VV','VV','VV'],min: -20,max: 0,},'S1-image [median]');
Map.addLayer(water_frequency_masked,{min:min_occurence,max:100,palette:['orange','yellow','lightblue','darkblue']},'Percentage of annual water occurence');
Map.add(animation);

// Contour Lines
// base code adapted from:
// source: https://groups.google.com/d/msg/google-earth-engine-developers/RhqK4cGI6pA/i4K95oGFAwAJ
var levels = [15,90];
var contours = levels.map(function(level) {
  var contour = water_frequency_masked.select('waterMask_sum').clip(aoi)
    .subtract(ee.Image.constant(level)).zeroCrossing() // line contours
    .multiply(ee.Image.constant(level)).toFloat();
  return contour.mask(contour);
});
contours = ee.ImageCollection(contours).mosaic();
Map.addLayer(contours, {palette: 'FF0000', bands: 'waterMask_sum'}, '15p_90p-contours');


// Create and print a histogram chart
//Make time series of water pixels as area in km² within region
var ClassChart = ui.Chart.image.series({
  imageCollection: s1.select('waterMask'),
  region: aoi,
  reducer: ee.Reducer.sum(),
  scale: 100,
})
  .setOptions({
      title: 'Area of the identified water mask',
      vAxis: {'title': 'area'},
      lineWidth: 1.5,
      pointSize: 2
    });
ClassChart.style().set({
    position: 'bottom-right',
    width: '492px',
    height: '300px'
  });

Map.add(ClassChart);

//Create callback function that adds image to the map coresponding with clicked data point on chart
ClassChart.onClick(function(xValue, yValue, seriesName) {
    if (!xValue) return;  // Auswahl zurücksetzen
  
    // Show the image for the clicked date.
    var equalDate = ee.Filter.equals('system:time_start', xValue);
    //Find image coresponding with clicked data and clip water classification to aoi 
    var classification = ee.Image(s1.filter(equalDate).first()).clip(aoi).select('waterMask'); 
    var SARimage = ee.Image(s1.filter(equalDate).first());
        var date_string = new Date(xValue).toLocaleString('de-DE', {dateStyle: 'full', timeStyle: 'short' });
    //Make map layer based on SAR image, reset the map layers, and add this new layer
    var S1Layer = ui.Map.Layer(SARimage, {
      bands: ['VV'],
      max: 0,
      min: -20
    },'S1-Image ['+ new Date(xValue).toLocaleString('de-DE')+']');
    Map.layers().reset([S1Layer]);
    var visParamsS1Layer = {
      min: 0,
      max: 1,
      palette: ['#FFFFFF','#0000FF']
    };
    
    //Add water classification on top of SAR image
    Map.addLayer(classification,visParamsS1Layer,'water mask ['+date_string+']');
});

var downloadArgs = {
          //name: 'Layer_Export',
          scale: 10,
          region: ee.Geometry.Rectangle(Map.getBounds()).toGeoJSONString()
         };
         
// List download url for each layer
var layers = Map.layers();
var layer_objects = [];
    layers.forEach(function (layer, index) {
  var url = ui.Map.Layer().getEeObject(index).getDownloadURL(downloadArgs);
  print(ui.Label(layer.getName()).setUrl(url));
});


// print(s1.median().getDownloadURL(downloadArgs));
// print(water_frequency_masked.getDownloadURL(downloadArgs));
// print(contours.getDownloadURL(downloadArgs));