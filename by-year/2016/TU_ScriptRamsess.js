/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry = /* color: 9999ff */ee.Geometry.Polygon(
        [[[-6.156463623046875, 34.54219679319395],
          [-5.9051513671875, 34.538237527295784],
          [-5.8941650390625, 34.698154792356995],
          [-6.153717041015625, 34.70041289795024]]]),
    eucalyptus = /* color: ffff99 */ee.Feature(
        ee.Geometry.MultiPoint(),
        {
          "label": "Eucalyptus",
          "system:index": "0"
        }),
    sugarcane = /* color: 99ffff */ee.Feature(
        ee.Geometry.MultiPoint(),
        {
          "label": "Sugarcane",
          "system:index": "0"
        }),
    citrus = /* color: ff99ff */ee.Feature(
        ee.Geometry.Polygon(
            [[[-5.980188846588135, 34.56042642866487],
              [-5.976583957672119, 34.56039992215785],
              [-5.976015329360962, 34.56220234539317],
              [-5.979577302932739, 34.56220234539317]]]),
        {
          "label": "Citrus",
          "system:index": "0"
        }),
    annual_crop = /* color: d63000 */ee.Feature(
        ee.Geometry.Polygon(
            [[[-6.134405136108398, 34.67719381005674],
              [-6.130027770996094, 34.67493507101454],
              [-6.127281188964844, 34.679099573206415],
              [-6.131315231323242, 34.681005292498575]]]),
        {
          "label": "Annual crop",
          "system:index": "0"
        }),
    native_forest = /* color: 98ff00 */ee.Feature(
        ee.Geometry.Polygon(
            [[[-5.992612838745117, 34.65093216466551],
              [-5.980596542358398, 34.64923757915178],
              [-5.987977981567383, 34.660957753464906],
              [-5.995702743530273, 34.66060476037414]]]),
        {
          "label": "Native Forest",
          "system:index": "0"
        }),
    pasture = /* color: 0B4A8B */ee.Feature(
        ee.Geometry.Polygon(
            [[[-5.970865488052368, 34.66109895028017],
              [-5.96807599067688, 34.66248443126707],
              [-5.967099666595459, 34.66258150231496],
              [-5.967196226119995, 34.662952136179086],
              [-5.96882700920105, 34.664381708411106],
              [-5.971337556838989, 34.662599151584175]]]),
        {
          "label": "Pasture",
          "system:index": "0"
        }),
    urban = /* color: ffc82d */ee.Feature(
        ee.Geometry.Polygon(
            [[[-5.997762680053711, 34.678605490675146],
              [-5.992956161499023, 34.66978209202213],
              [-5.9909820556640625, 34.6713350783425],
              [-5.98780632019043, 34.67486448442685],
              [-5.9882354736328125, 34.67662913107146],
              [-5.996818542480469, 34.67881724069238]]]),
        {
          "label": "Urban",
          "system:index": "0"
        }),
    water = /* color: 00ffff */ee.Feature(
        ee.Geometry.MultiPoint(),
        {
          "label": "Water",
          "system:index": "0"
        });
/***** End of imports. If edited, may not auto-convert in the playground. *****/
// center the map
Map.setCenter(-6, 34,7);

// define the regions of interest
var regions1 = new ee.FeatureCollection([annual_crop, pasture]);
var regions2 = new ee.FeatureCollection([native_forest, citrus, urban]);

// import the HV S1 collection and filter to date and geometry and show
var collection = ee.ImageCollection('COPERNICUS/S1_GRD').
filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
.select(['VH','VV']).filterMetadata('instrumentMode', 'equals', 'IW');
var collection_filtered = collection.filterDate('2014-10-01', '2016-03-03').filterBounds(geometry)
print(collection_filtered)
Map.addLayer(collection_filtered.filterDate('2014-12-01', '2015-12-15'), {'bands': 'VV,VH,VV', min: [-15, -20, -15],max: [5, -10, 5]}, 'Sentinel-1 HV');

// define the colors of the lines in the chart
var COLOR = {
  Cov1: 'ff0000',
  Cov2: '0000ff',
  Cov3: '00ff00', 
  Cov4: "000000", 
  Cov5: "000000",
  Cov6: "000FF0"
};

// show the S1-VH time series chart for each vegetation type
var sfTimeSeries1 =
    Chart.image.seriesByRegion(collection_filtered, regions1, ee.Reducer.mean(),'VH', 30, 'system:time_start', 'label')
.setChartType('LineChart')
.setOptions({
  title: 'S1 VH averages over annual crop, pasture',
          vAxis: {title: 'VH [dB]',
          viewWindowMode:'explicit',
          viewWindow:{
            min:  -33, 
            max:  -10
          },
          },
          lineWidth: 4,
          pointSize: 10,
          series: {
              0: {color: COLOR.Cov1},
              1: {color: COLOR.Cov2},
              2: {color: COLOR.Cov3},
              3: {color: COLOR.Cov4}
}});
var sfTimeSeries2 =
    Chart.image.seriesByRegion(collection_filtered, regions2, ee.Reducer.mean(),'VH', 30, 'system:time_start', 'label')
.setChartType('LineChart')
.setOptions({
  title: 'S1 VH averages over native forest, citrus, urban',
          vAxis: {title: 'VH [dB]',
          viewWindowMode:'explicit',
          viewWindow:{
            min:  -33, 
            max:  -10
          },
          },
          lineWidth: 4,
          pointSize: 10,
          series: {
              0: {color: COLOR.Cov1},
              1: {color: COLOR.Cov2},
              2: {color: COLOR.Cov3},
              3: {color: COLOR.Cov4}
}});
print(sfTimeSeries1);
print(sfTimeSeries2);

// show the S1-VV time series chart for each vegetation type
var sfTimeSeries3 =
    Chart.image.seriesByRegion(collection_filtered, regions1, ee.Reducer.mean(),'VH', 30, 'system:time_start', 'label')
.setChartType('LineChart')
.setOptions({
  title: 'S1 VV averages over annual crop, pasture',
          vAxis: {title: 'VV [dB]',
          viewWindowMode:'explicit',
          viewWindow:{
            min:  -25, 
            max:  -5
          },
          },
          lineWidth: 4,
          pointSize: 10,
          series: {
              0: {color: COLOR.Cov1},
              1: {color: COLOR.Cov2},
              2: {color: COLOR.Cov3},
              3: {color: COLOR.Cov4}
}});
// show the S1-VV time series chart for each vegetation type
var sfTimeSeries4 =
    Chart.image.seriesByRegion(collection_filtered, regions2, ee.Reducer.mean(),'VV', 30, 'system:time_start', 'label')
.setChartType('LineChart')
.setOptions({
  title: 'S1 VV averages over native forest, citrus, urban',
          vAxis: {title: 'VV [dB]',
          viewWindowMode:'explicit',
          viewWindow:{
            min:  -25, 
            max:  -5
          },
          },
          lineWidth: 4,
          pointSize: 10,
          series: {
              0: {color: COLOR.Cov1},
              1: {color: COLOR.Cov2},
              2: {color: COLOR.Cov3},
              3: {color: COLOR.Cov4}
}});
print(sfTimeSeries3);
print(sfTimeSeries4);

// import the S2 and LS8 collections and filter to date and geometry
var collection_S2 = ee.ImageCollection('COPERNICUS/S2');
var collection_LS8 = ee.ImageCollection('LANDSAT/LC8_SR');
//var collection_LS8 = ee.ImageCollection('LANDSAT/LC8_L1T_TOA');
var collection_MOD = ee.ImageCollection('MODIS/MOD13Q1'); //MOD09GA_NDVI MCD43A4_NDVI
var collection_filtered_S2 = collection_S2.filterDate('2015-01-01', '2015-12-31').filterBounds(geometry)
print(collection_filtered_S2)
var collection_filtered_LS8 = collection_LS8.filterDate('2015-01-01', '2016-12-31').filterBounds(geometry)
print(collection_filtered_LS8)
var collection_filtered_MOD = collection_MOD.filterDate('2015-01-01','2015-12-31').filterBounds(geometry)
print(collection_filtered_MOD)

// mosaic for showing
var image_S2 = collection_filtered_S2.select('B2', 'B3', 'B4');
var image_LS8 = collection_filtered_LS8.select('B2', 'B3', 'B4');
var image_MOD = collection_filtered_MOD.select('NDVI');
function divide_NDVI(image) { return ee.Image(image.toFloat().divide(10000)) }
var image_MOD = image_MOD.map(divide_NDVI)

// define the bands for showing and show
var vizParams = {'bands': 'B4,B3,B2',
               'min': 0,
               'max': 3000};
Map.addLayer(image_S2, vizParams, 'Sentinel-2 RGB');
Map.addLayer(image_LS8, vizParams, 'Landsat-8 RGB');

// select the NDVI bands of S2 and LS8 and compute NDVI for mosaic image
var image_S2_NDVI = collection_filtered_S2.mosaic().select('B8', 'B4');
var image_LS8_NDVI = collection_filtered_LS8.mosaic().select('B5', 'B4');
var ndvi_S2 = image_S2_NDVI.normalizedDifference(['B8', 'B4']);
var ndvi_LS8 = image_LS8_NDVI.normalizedDifference(['B5', 'B4']);
var palette = ['FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718',
             '74A901', '66A000', '529400', '3E8601', '207401', '056201',
             '004C00', '023B01', '012E01', '011D01', '011301'];
Map.addLayer(ndvi_S2, {'min': 0, 'max': 1, palette: palette}, 'Sentinel-2 NDVI');
Map.addLayer(ndvi_LS8, {'min': 0, 'max': 1, palette: palette}, 'Landsat-8 NDVI');
Map.addLayer(image_MOD,{'min': 0, 'max': 1 , palette: palette}, 'MODIS NDVI');

// function for getting NDVI from LS8 collection
var getNDVI_S2 = function(image){
  var ndvi = image.normalizedDifference(['B8', 'B4']);
  var original = image.addBands(ndvi)
  return original;
};
var collection_filtered_S2_NDVI = collection_filtered_S2.map(getNDVI_S2)
//Map.addLayer(collection_filtered_S2_NDVI, {'min': 0, 'max': 1, palette: palette}, 'Sentinel-2 Timeseries NDVI');
print(collection_filtered_S2_NDVI)

var getNDVI_LS8 = function(image){
  var ndvi = image.normalizedDifference(['B5', 'B4']);
  var original = image.addBands(ndvi)
  return original;
};
var collection_filtered_LS8_NDVI = collection_filtered_LS8.map(getNDVI_LS8)
//Map.addLayer(collection_filtered_LS8_NDVI, {'min': 0, 'max': 1, palette: palette}, 'Landsat-8 Timeseries NDVI');
print(collection_filtered_LS8_NDVI)

// show the LS8-NDVI time series chart for each vegetation type
var sfTimeSeriesNDVI1_LS8 =
  Chart.image.seriesByRegion(collection_filtered_LS8_NDVI, regions1, ee.Reducer.mean(),'nd', 30, 'system:time_start', 'label')
  .setChartType('LineChart')
  .setOptions({
  title: 'LS8 NDVI averages over annual crop, pasture',
        vAxis: {title: 'NDVI [-]',
        viewWindowMode:'explicit',
        viewWindow:{
          min:  0, 
          max:  1
        },
        },
        lineWidth: 4,
        pointSize: 10,
        series: {
            0: {color: COLOR.Cov1},
            1: {color: COLOR.Cov2},
            2: {color: COLOR.Cov3},
            3: {color: COLOR.Cov4}
}});
var sfTimeSeriesNDVI2_LS8 =
  Chart.image.seriesByRegion(collection_filtered_LS8_NDVI, regions2, ee.Reducer.mean(),'nd', 30, 'system:time_start', 'label')
  .setChartType('LineChart')
  .setOptions({
  title: 'LS8 NDVI averages over native forest, citrus, urban',
        vAxis: {title: 'NDVI [-]',
        viewWindowMode:'explicit',
        viewWindow:{
          min:  0, 
          max:  1
        },
        },
        lineWidth: 4,
        pointSize: 10,
        series: {
            0: {color: COLOR.Cov1},
            1: {color: COLOR.Cov2},
            2: {color: COLOR.Cov3},
            3: {color: COLOR.Cov4}
}});
print(sfTimeSeriesNDVI1_LS8)
print(sfTimeSeriesNDVI2_LS8)

// show the S2-NDVI time series chart for each vegetation type
var sfTimeSeriesNDVI1_S2 =
  Chart.image.seriesByRegion(collection_filtered_S2_NDVI, regions1, ee.Reducer.mean(),'nd', 30, 'system:time_start', 'label')
  .setChartType('LineChart')
  .setOptions({
  title: 'S2 NDVI averages over annual crop, pasture',
        vAxis: {title: 'NDVI [-]',
        viewWindowMode:'explicit',
        viewWindow:{
          min:  0, 
          max:  1
        },
        },
        lineWidth: 4,
        pointSize: 10,
        series: {
            0: {color: COLOR.Cov1},
            1: {color: COLOR.Cov2},
            2: {color: COLOR.Cov3},
            3: {color: COLOR.Cov4}
}});
var sfTimeSeriesNDVI2_S2 =
  Chart.image.seriesByRegion(collection_filtered_S2_NDVI, regions2, ee.Reducer.mean(),'nd', 30, 'system:time_start', 'label')
  .setChartType('LineChart')
  .setOptions({
  title: 'S2 NDVI averages over native forest, citrus, urban',
        vAxis: {title: 'NDVI [-]',
        viewWindowMode:'explicit',
        viewWindow:{
          min:  0, 
          max:  1
        },
        },
        lineWidth: 4,
        pointSize: 10,
        series: {
            0: {color: COLOR.Cov1},
            1: {color: COLOR.Cov2},
            2: {color: COLOR.Cov3},
            3: {color: COLOR.Cov4}
}});
print(sfTimeSeriesNDVI1_S2)
print(sfTimeSeriesNDVI2_S2)

var function_time = function(inImg) {
    var time_start = inImg.get('system:time_start');
    inImg = inImg.multiply(0.0001);
    var inIm_timeset = inImg.set('time_start', time_start);
    return inIm_timeset;
    //return inImg;
  }; 
var image_MOD_time = collection_filtered_MOD.map(function_time);
print(image_MOD_time)
//print(collection_filtered_MOD)
var sfTimeSeriesNDVI1_MOD =
  Chart.image.seriesByRegion(image_MOD_time, regions1, ee.Reducer.mean(),'NDVI', 200, 'time_start', 'label')
  .setChartType('LineChart')
  .setOptions({
  title: 'MODIS NDVI averages over annual crop, pasture',
        vAxis: {title: 'NDVI [-]',
        viewWindowMode:'explicit',
        viewWindow:{
          min:  0, 
          max:  1
        },
        },
        lineWidth: 4,
        pointSize: 10,
        series: {
            0: {color: COLOR.Cov1},
            1: {color: COLOR.Cov2},
            2: {color: COLOR.Cov3},
            3: {color: COLOR.Cov4}
}});
print(sfTimeSeriesNDVI1_MOD)