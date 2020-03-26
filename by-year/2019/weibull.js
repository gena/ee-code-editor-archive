function weibull(a, k) {
  k = ee.Number(k)
  a = ee.Number(a)
  
  return function(x) {
    x = ee.Number(x)
    
    return k.multiply(x.divide(a).pow(k.subtract(1)))
      .multiply(x.divide(a).pow(k).multiply(-1).exp())
      .divide(a)
  }
}

function weibullCDF(a, k) {
  k = ee.Number(k)
  a = ee.Number(a)
  
  return function(x) {
    x = ee.Number(x)
    
    return ee.Number(1).subtract(x.divide(a).pow(k).multiply(-1).exp())
  }
}

var x = ee.List.sequence(0.05, 2.5, 0.05)

var a = 1
var b = 1.5

var y = x.map(weibull(a, b))
print(ui.Chart.array.values(y, 0, x))

var y = x.map(weibullCDF(a, b))
print(ui.Chart.array.values(y, 0, x))

// generate noised y 
var data = ee.Array(y.getInfo().map(function(v) { return [Math.min(0.99, v + Math.random() * 0.1)] }))
print(ui.Chart.array.values(data, 0, x))

// fit
var predictors = ee.Array.cat([
  ee.List.repeat(1, x.size()), 
  ee.Array(x).log()
], 1)

print(data)

var response = data.multiply(-1).add(1).pow(-1).log().log()

print(predictors)
print(response)

var coefs = predictors.matrixSolve(response).getInfo()

var intercept = coefs[0][0]
var slope = coefs[1][0]

var a = slope
var b = ee.Number(intercept).divide(ee.Number(a).multiply(-1)).exp()

print(a)
print(b)

var y = x.map(weibullCDF(b, a))
print(ui.Chart.array.values(y, 0, x))
