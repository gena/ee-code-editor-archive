//whitsmw <- function(y, lambda=10, d=2) {
//  # Whittaker smoother with weights
//  # Input:
//  #   y:      data series, sampled at equal intervals
//  #           (arbitrary values allowed when missing)
//  #   lambda: smoothing parameter; large lambda gives smoother result
//  #   d:      order of differences (default = 2)  TO BE MODIFIED IN THE FUNCTION
//  # Output:
//  #   z:      smoothed series
//  #   cve:    RMS leave-one-out prediction error
//  #   h:      diagonal of hat mat
//  #   w:      weights (0/1 for missing/non-missing data)
//  #
//  #
//  # Paul Eilers, 2003

var y = ee.List([ 0.2848061,  0.30228013,  0.34789697,  0.32501599,  0.39469027,  0.4377276,
  0.33893395,  0.37984496,  0.39857228,  0.39573634,  0.47152728,  0.47152728,
  0.47924113,  0.39227134,  0.32331224,  0.2087859,   0.20336943,  0.20721056,
  0.19288119,  0.18133762,  0.17329094,  0.16575934,  0.16575934,  0.1612529,
  0.15125293,  0.15,        0.15096154,  0.15008432,  0.15085739,  0.13942904,
  0.14469453,  0.15195531,  0.14524043,  0.14524043,  0.15950435,  0.15972414,
  0.15228758,  0.15082444,  0.15223881,  0.14943074,  0.18042813,  0.2026749,
  0.20156897,  0.19865571,  0.19865571,  0.23084913,  0.19461078,  0.183271,
  0.21911197,  0.25281271,  0.25281271,  0.29778934,  0.33450241,  0.3513862,
  0.34829884,  0.41832669,  0.4115899,   0.49730942,  0.35539881,  0.45935484,
  0.3550206,   0.3550206,   0.46144549,  0.50094928,  0.50684932,  0.50809492,
  0.54877014,  0.49391727,  0.61421935,  0.40859525,  0.32255083,  0.33121861,
  0.33121861,  0.28408357,  0.26169539,  0.20380048,  0.20922075,  0.21085336,
  0.19551364,  0.20337553,  0.19558499,  0.19014778,  0.18839836,  0.18839836,
  0.1738367,   0.17821782,  0.19377163,  0.17986366,  0.19295371,  0.22772277,
  0.17810897,  0.26148705,  0.20528087,  0.2055958,   0.2055958,   0.2309217,
  0.21856867,  0.23418424,  0.31344284,  0.42614933,  0.40538991,  0.47488038,
  0.40963139,  0.53891941,  0.69198966,  0.58185297,  0.65561044,  0.7715852,
  0.84103434,  0.74339454,  0.74779807,  0.74779807,  0.7285576,   0.70140628,
  0.69911504,  0.53225806,  0.47955936,  0.36809138,  0.3962766,   0.3330139,
  0.37059484,  0.39720646,  0.39720646,  0.2823741,   0.24439377,  0.22083614,
  0.22766784,  0.20806634,  0.21386403,  0.2324159,   0.21760138,  0.20263202,
  0.21859436,  0.21859436,  0.18293839,  0.19146184,  0.20522388,  0.21745949,
  0.23439667,  0.21584424,  0.19299674,  0.21705724,  0.24536465,  0.19491275,
  0.19491275,  0.18128964,  0.16930257,  0.17865676,  0.22205663,  0.26136758,
  0.24858757,  0.24618878,  0.30006398,  0.292764,    0.34330794,  0.5065312,
  0.4456338,   0.43773764,  0.36156187,  0.43247269,  0.40318627,  0.40318627,
  0.38701127,  0.38603033,  0.29321534,  0.2702588,   0.2668899,  0.36302411,
  0.44280763,  0.67062193,  0.72665348,  0.58686888,  0.58686888, 0.48899756,
  0.45064205,  0.30582524,  0.27057812,  0.22242446,  0.22719914,  0.21802227,
  0.2240672,  0.21699079,  0.21996584,  0.21996584,  0.20253918,  0.20034881,
  0.19817134,  0.18880811,  0.19576508,  0.1764432,   0.2200709,   0.23420847,
  0.22808958,  0.25047081,  0.25047081,  0.19158361,  0.21023766,  0.22650104,
  0.29181355,  0.32668781])

var lambda = 4

// Set up weights. Weights equal 1 by default.
var w = ee.Array([ee.List.repeat(1, y.length())])

function whittaker(y, w, lambda)
{
  var ones = ee.Array([ee.List.repeat(1, y.length())])

  // Set up a diagonal matrix for the weights
  var E = w.transpose().matrixToDiag()

  // Differentiate, twice
  var diff1 = E.slice(0,1).subtract(E.slice(0,0,-1))
  var diff2 = diff1.slice(0,1).subtract(diff1.slice(0,0,-1))
  //var diff3 = diff2.slice(0,1).subtract(diff2.slice(0,0,-1))

  // Set up smoothing matrix
  var linsys = E.add(diff2.transpose().matrixMultiply(diff2).multiply(lambda))

  // Cholesky decompose
  var chol = linsys.matrixCholeskyDecomposition()

  var P = ee.Array(chol.get('L'))

  // Solve to get smoother series
  var z = P.matrixSolve(P.transpose().matrixSolve(ee.Array([y]).transpose()))

  // Get residuals
  var H = E.matrixMultiply(linsys.matrixInverse())
  var h = H.matrixDiagonal()

  var r = ee.Array([y]).transpose().subtract(z).divide(ones.transpose().subtract(h))

  return ee.List([z, r])
}

// Set up weights. Weights equal 1 by default.
var w = ee.Array([ee.List.repeat(1, y.length())])

var whit = whittaker(y, w, lambda)

var r = ee.List(whit).get(1)

// Sqrt of the mean squared residuals
var cve = ee.Array(r).transpose().matrixMultiply(r).divide(y.length()).sqrt()

print(cve)

// Prepare data from plot

var yValues = ee.Array.cat([y, ee.Array(whit.get(0)).project([0]), 
  ee.Array(whit.get(1)).project([0])], 1);

var chart = ui.Chart.array.values(yValues, 0).setSeriesNames(['Raw', 'Whittakered', 'Residuals']).setOptions(
  {
    pointSize: 1,
    title: 'Fuentes, Andalucia (ES)' + '; lambda = ' + lambda + "; d = 2", 
    hAxis: {title: 'Time (x 8 days)'}, vAxis: {title: 'MOD09A1 NDVI'},
    legend: null,
    series: { 
      0: { lineWidth: 0},
      1: { lineWidth: 4, pointSize: 0, color: 'red' },
      2: { lineWidth: 0, pointSize: 1, color: 'green'}
    }
  })
  
print(chart)

// Lower weights of the point which have a negative residual
w = w.transpose().add(r).add(r).add(r).transpose()

print(w)

var whit2 = whittaker(y, w, lambda)

var r = ee.List(whit2).get(1)

// Sqrt of the mean squared residuals
var cve = ee.Array(r).transpose().matrixMultiply(r).divide(y.length()).sqrt()

print(cve)

// Prepare data from plot

var yValues = ee.Array.cat([y, ee.Array(whit2.get(0)).project([0]), 
  ee.Array(whit2.get(1)).project([0])], 1);

var chart = ui.Chart.array.values(yValues, 0).setSeriesNames(['Raw', 'Whittakered', 'Residuals']).setOptions(
  {
    pointSize: 1,
    title: 'Fuentes, Andalucia (ES)' + '; lambda = ' + lambda + "; d = 2; weighted", 
    hAxis: {title: 'Time (x 8 days)'}, vAxis: {title: 'MOD09A1 NDVI'},
    legend: null,
    series: { 
      0: { lineWidth: 0},
      1: { lineWidth: 4, pointSize: 0, color: 'red' },
      2: { lineWidth: 0, pointSize: 1, color: 'green'}
    }
  })
  
print(chart)






