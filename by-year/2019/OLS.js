// scatter plot with regression 

var x = [1,2,3,4]
var y = [1,2.5,3,4]

var N = x.length

// compute OLS
var X = ee.Array.cat([ee.List.repeat(1, N), x], 1)
var Y = ee.Array.cat([y], 1)

var left = X.matrixTranspose(0).matrixMultiply(X)
var right = X.matrixTranspose(0).matrixMultiply(Y)

var coefs = left.matrixSolve(right).getInfo()

var intercept = coefs[0][0]
var slope = coefs[1][0]

var y_ = ee.List(x).map(function(x) {
  return ee.Number(slope).multiply(x).add(intercept)
}).getInfo()

// generate input data for a multi-series chart
var dataTable = {
  cols: [
    {id: 'x', label: 'X', type: 'number'}, 
    {id: 'y', label: 'y', type: 'number'}, 
    {id: 'y_ols', label: 'y_ols', type: 'number'}
  ],
  
  rows: ee.List.sequence(0, x.length).getInfo().map(function(i) { 
    return {c: [{v: x[i]}, {v: y[i]}, {v: y_[i]}]}
  })
};

var chart = ui.Chart(dataTable).setOptions({
  series: {
    0: {pointSize: 4, lineWidth: 0},
    1: {pointSize: 0, lineWidth: 1}
  }
})

print(chart)
