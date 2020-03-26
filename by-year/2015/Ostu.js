// function is used to compute the q values in the equation
var Px = function(init, end, hist) {
    var sum = 0;
    for (var i = init; i <= end; i++)
        sum += hist[i];

    return sum;
}

// function is used to compute the mean values in the equation (mu)
var Mx = function(init, end, hist)
{
    var sum = 0;
    for (var i = init; i <= end; i++)
        sum += i * hist[i];

    return sum;
}

var getMax = function(a) {
  var max = a[0];
  
  for(var i = 0; i < a.length; i++) {
    max = Math.max(a[i], max);
  }
  
  return max;
}

var otsu = function(hist) {
  // normalize
  var sum = Px(0, hist.length);
  var h = [];
  for(var i = 0; i < hist.length; i++) {
    h.push(hist[i] / sum);
  }

  var v = []

  // loop through all possible t values and maximize between class variance
  for (var k = 1; k < h.length - 1; k++)
  {
      var p1 = Px(0, k, h);
      var p2 = Px(k + 1, h.length - 1, hist);
      var p12 = p1 * p2;
      if (p12 === 0) 
          p12 = 1;
          
      var diff = (Mx(0, k, h) * p2) - (Mx(k + 1, h.length - 1, h) * p1);

      v.push(diff * diff / p12);
      // v.push(Math.Pow((Mx(0, k, hist) * p2) - (Mx(k + 1, 255, hist) * p1), 2) / p12);
  }

  return getMax(vet);
} 


