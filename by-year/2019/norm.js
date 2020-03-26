// Marsaglia polar method: https://www.alanzucconi.com/2015/09/16/how-to-sample-from-a-gaussian-distribution/
function norm() {
    var v1, v2, s;
    do {
        v1 = 2 * Math.random() - 1;
        v2 = 2 * Math.random() - 1;
        s = v1 * v1 + v2 * v2;
    } while (s >= 1.0 || s == 0)
 
    s = Math.sqrt((-2 * Math.log(s)) / s);
 
    return v1 * s;
}

// generate 100 random values
var sd = 0.1
var values = ee.List(Array.from(Array(5000)).map(function(){  return norm() * sd }))
print(ui.Chart.array.values(values, 0).setOptions({
  pointSize: 1,
  vAxis: { viewWindow: { min: -0.5, max: 0.5 } }
}))


var hist = ee.Dictionary(values.reduce(ee.Reducer.histogram(50)))
print(ui.Chart.array.values(hist.get('histogram'), 0, hist.get('bucketMeans')).setChartType('ColumnChart').setOptions({
  bar: {groupWidth: '100%'}, 
  hAxis: { viewWindow: { min: -0.5, max: 0.5 } } 
}))

// combine mean and median
var reducer = ee.Reducer.mean().combine(ee.Reducer.median(), null, true)
print(values.reduce(reducer))


// combine array or reducers
var reducers = [
  ee.Reducer.min(),
  ee.Reducer.mean(),
  ee.Reducer.median(),
  ee.Reducer.max()
]

// define reduction function (client-side)
var combine = function(reducer, prev) {
  return reducer.combine(prev, null, true)
}

// combine all reducers
var reducer = reducers.slice(1).reduce(combine, reducers[0])

print(values.reduce(reducer))

