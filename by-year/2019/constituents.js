///var bounds = ee.Geometry.Rectangle(Map.getBounds());
var hs_coast = ee.FeatureCollection("users/jhnienhuis/DirMapCoast");//.filterBounds(bounds);
var directions = ee.List.sequence(1,360,1);
var hshist = ee.List.sequence(1,100,1);

// Create the main map and set the SST layer.
var mapPanel = ui.Map();

mapPanel.addLayer(hs_coast,{color:'white'});

// Create a panel to hold title, intro text, chart and legend components.
var inspectorPanel = ui.Panel({style: {width: '30%'}});

// Create an intro panel with labels.
var intro = ui.Panel([
  ui.Label({
    value: 'Local Wave data',
    style: {fontSize: '20px', fontWeight: 'bold'}
  }),
  ui.Label('Click a location to see local wave statistics.')
]);
inspectorPanel.add(intro);

// Generates a new time series chart of SST for the given coordinates.
var generateChart = function (coords) {

  // Add a dot for the point clicked on.
  var point = ee.Geometry.Point(coords.lon, coords.lat);
  
  // Make a chart from the time series.
  var distFilter = ee.Filter.withinDistance({distance: 1e5,leftField: '.geo',rightField: '.geo'});
  var hs_coast1 = ee.Join.saveFirst({matchKey: 'hs_coast', measureKey: 'distance'}).apply(hs_coast,point,distFilter);
  hs_coast1 = hs_coast1.map(function(f){ return f.set('distance',f.distance(point))  }).limit(1,'distance');
  
  var dot = ui.Map.Layer(hs_coast1, {color: 'red',width:100}, 'clicked location');
  // Add the dot as the second layer, so it shows up on top of the composite.
  mapPanel.layers().set(2, dot);
  
  var spectra_dir = directions.map(function(f){
  var str = ee.String('e').cat(ee.Number(f).format('%d'));
  return ee.Number(hs_coast1.first().get(str)).divide(100000);
  })
  
  var spectra_hs = hshist.map(function(f){
  var str = ee.String('h').cat(ee.Number(f).format('%d'));
  return ee.Number(hs_coast1.first().get(str)).divide(100000);
  })
   
  var tidetable = ee.List([
            ['Constituent', 'Amplitude (m)', 'Phase (deg GMT)'],
            ['m2',ee.Number(hs_coast1.first().get("m2a")).divide(1000).format('%.2f'), ee.Number(hs_coast1.first().get("m2p")).format('%.2f')],
            ['s2',ee.Number(hs_coast1.first().get("s2a")).divide(1000).format('%.2f'), ee.Number(hs_coast1.first().get("s2p")).format('%.2f')],
            ['n2',ee.Number(hs_coast1.first().get("n2a")).divide(1000).format('%.2f'), ee.Number(hs_coast1.first().get("n2p")).format('%.2f')],
            ['k1',ee.Number(hs_coast1.first().get("k1a")).divide(1000).format('%.2f'), ee.Number(hs_coast1.first().get("k1p")).format('%.2f')],
            ['m4',ee.Number(hs_coast1.first().get("m4a")).divide(1000).format('%.2f'), ee.Number(hs_coast1.first().get("m4a")).format('%.2f')],
            ['o1',ee.Number(hs_coast1.first().get("o1a")).divide(1000).format('%.2f'), ee.Number(hs_coast1.first().get("o1a")).format('%.2f')]
            ]).getInfo()
  
  var sstChart = ui.Chart.array.values(spectra_dir,0,directions);
  var sstChart2 = ui.Chart.array.values(spectra_hs,0,ee.List.sequence(0,4.95,0.05));
  var sstTable = ui.Chart(tidetable).setChartType('Table').setOptions({width: '100%', height: '10em',page:'disable',pagingButtons:'next'});
  
  // Customize the chart.
  sstChart.setOptions({
    vAxis: {title: 'Wave Energy'},
    hAxis: {title: 'Wave Direction from North', gridlines: {count: 7}, viewWindow: {min: 0, max: 360}, ticks: [0, 45,90, 135, 180, 225, 270, 315, 360]},
    
    legend: {position: 'none'},
    series: {
      0: {
        color: 'blue',
        lineWidth: 0,
        pointsVisible: true,
        pointSize: 2,
      },
    },
    //legend: {position: 'right'},
  });
  
  
  // Customize the chart.
  sstChart2.setOptions({
    vAxis: {title: 'Fraction',v:'ES', f:'<a href="#">ES</a>'},
    hAxis: {title: 'Significant Wave height (m)', gridlines: {count: 7}},
    legend: {position: 'none'},
    series: {
      0: {
        color: 'blue',
        lineWidth: 0,
        pointsVisible: true,
        pointSize: 2,
      },
    },
    //legend: {position: 'right'},
  });
  // Add the chart at a fixed position, so that new charts overwrite older ones.
  inspectorPanel.widgets().set(2, sstChart);
  inspectorPanel.widgets().set(3, sstChart2);
  inspectorPanel.widgets().set(4, sstTable);

  // Update the lon/lat panel with values from the click event.
  lon.setValue('Lon: ' + ee.Number(hs_coast1.geometry().coordinates().get(0)).format('%.2f').getInfo());
  lat.setValue('Lat: ' + ee.Number(hs_coast1.geometry().coordinates().get(1)).format('%.2f').getInfo());
  hs.setValue('Wave Height: ' + ee.Number(hs_coast1.first().get("hs")).divide(1000).format('%.2f').getInfo() + ' m');
  tp.setValue('Wave Period: ' + ee.Number(hs_coast1.first().get("tp")).divide(1000).format('%.2f').getInfo() + ' s');
  depth.setValue('Depth: ' + ee.Number(hs_coast1.first().get("depth")).format('%2.0f').getInfo() + ' m');
};


// Create panels to hold lon/lat values.
var lon = ui.Label();
var lat = ui.Label();
var hs = ui.Label();
var tp = ui.Label();
var depth = ui.Label();
inspectorPanel.add(ui.Panel([lon, lat, hs, tp, depth], ui.Panel.Layout.flow('horizontal',1)));

// Add placeholders for the chart and legend.
inspectorPanel.add(ui.Label('[Chart]'));
inspectorPanel.add(ui.Label('[Chart2]'));
inspectorPanel.add(ui.Label('[Table]'));
inspectorPanel.add(ui.Label('Source wave data: Chawla '));

// Register a callback on the default map to be invoked when the map is clicked.
mapPanel.onClick(generateChart);



// Configure the map.
mapPanel.style().set('cursor', 'crosshair');

// Initialize with a test point.
var initialPoint = ee.Geometry.Point(24.22, 34.89);
mapPanel.centerObject(initialPoint, 4);


/*
 * Initialize the app
 */

// Replace the root with a SplitPanel that contains the inspector and map.
ui.root.clear();
ui.root.add(ui.SplitPanel(inspectorPanel, mapPanel));

mapPanel.setOptions('SATELLITE');
mapPanel.setControlVisibility(null, null, false, false, false)

generateChart({
  lon: initialPoint.coordinates().get(0).getInfo(),
  lat: initialPoint.coordinates().get(1).getInfo()
});
