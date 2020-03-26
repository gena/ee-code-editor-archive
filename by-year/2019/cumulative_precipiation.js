//From https://mygeoblog.com/
// import image collection 
var chirps = ee.ImageCollection("UCSB-CHG/CHIRPS/DAILY");
chirps = chirps.filterDate("2017-01-01","2018-01-01")
      //.sum()
      //.set('system:time_start', '2017-01-01');

// filter the country
var countries = ee.FeatureCollection('ft:1tdSwUL7MVpOauSgRzqVTOwdfy17KDbw-1d9omPw');
var country_names = ['Philippines']; 
var myCountry = countries.filter(ee.Filter.inList('Country', country_names));
var aoi = myCountry.geometry();

// add map
Map.addLayer(chirps.sum().clip(aoi),{min:1000,max:3500,palette:"white,blue,darkblue,red,purple"},"2017 prepcipitation");

// add graph
var point  = ee.Geometry.Point(123.1729, 13.7057);

// compute cumulative precipitation over time
chirps = chirps.sort('system:time_start')

var times = chirps.aggregate_array('system:time_start')

var values = ee.List(chirps.toList(chirps.size()).iterate(function(i, c) {
  i = ee.Image(i)
  var p = i.reduceRegion(ee.Reducer.mean(), point, 5000).values().get(0)
  var c = ee.List(c)
  
  return c.add(ee.Number(c.get(-1)).add(p))
}, ee.List([0]))).slice(1)

print(ui.Chart.array.values(values, 0, times).setOptions({pointSize:0, lineWidth: 1}))

// show actual precipiation by image
print(ui.Chart.image.series(chirps, point, ee.Reducer.mean(), 5000, 'system:time_start'));

Map.addLayer(point);
Map.centerObject(aoi, 6);