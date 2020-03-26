/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var vegetation = /* color: 98ff00 */ee.Geometry.Point([-118.7610912322998, 38.91915240700719]),
    water = /* color: ffc82d */ee.Geometry.Point([-118.74160766601562, 38.750602612882446]),
    snow = /* color: 00ffff */ee.Geometry.Point([-118.83275985717773, 38.5199666165681]),
    bare = /* color: bf04c2 */ee.Geometry.Point([-118.87344360351562, 38.402890760139115]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var image = ee.Image('EO1/HYPERION/EO1H0420322003329110PY_SGS_01');

//Map.centerObject(image,13);
var vizParams = {
  bands: ['B050', 'B030', 'B020'],
  min: 0,
  max: 3000,
};
Map.addLayer(image, vizParams, 'Hyperion: false color composite');

// Define customization options.
var options = {
  title: 'Hyperion spectra for different features',
  hAxis: {title: 'Bands'},
  vAxis: {title: 'DN'},
  lineWidth: 1,
  pointSize: 0.25,
  series: {
    0: {color: '00FF00'}, //green
    1: {color: '996633'}, // gray
    2: {color: '0000FF'}, // blue
    3: {color: 'FF0000'}, // red
    4: {color: '00FF00'}, //green
    5: {color: '996633'}, // gray
    6: {color: '0000FF'}, // blue
    7: {color: 'FF0000'} // red
}};

var points = ee.FeatureCollection([
  ee.Feature(vegetation, {'label': 'vegetation'}),
  ee.Feature(bare, {'label': 'bare'}),
  ee.Feature(water, {'label': 'water'}),
  ee.Feature(snow, {'label': 'snow'}),
  ee.Feature(vegetation, {'label': 'vegetationb'}).buffer(90),
  ee.Feature(bare, {'label': 'bareb'}).buffer(90),
  ee.Feature(water, {'label': 'waterb'}).buffer(90),
  ee.Feature(snow, {'label': 'snowb'}).buffer(90)
]);

var spectraChart = Chart.image.regions(
    image, points, ee.Reducer.mean(), 30, 'label')
        .setChartType('LineChart')
        .setOptions(options);

// Display the chart.
print(spectraChart);
var h = ee.ImageCollection('EO1/HYPERION');

image = h
  .reduce(ee.Reducer.percentile([20])).rename(image.bandNames())
Map.addLayer(image, vizParams, 'Hyperion: false color composite (20%)');

var spectraChart = Chart.image.regions(
    image, points, ee.Reducer.mean(), 30, 'label')
        .setChartType('LineChart')
        .setOptions(options);

// Display the chart.
print(spectraChart);

// count
Map.addLayer(h.select(0).count(), {min:0, max:30}, 'count', false)

Map.addLayer(h, {}, 'all', false)