/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var testArea = /* color: #00ffff */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Polygon(
                [[[-21.51123046875, 3.973860975839102],
                  [-21.11572265625, 6.926426847059551],
                  [-23.04931640625, 8.885071663468993],
                  [-26.82861328125, 7.689217127736191],
                  [-27.48779296875, 6.337137394988546],
                  [-24.78515625, 3.9957805129630377]]]),
            {
              "system:index": "0"
            })]),
    trainingLocations = /* color: #bf04c2 */ee.FeatureCollection(
        [ee.Feature(
            ee.Geometry.Point([-31.88232421875, 8.47237228290914]),
            {
              "system:index": "0"
            }),
        ee.Feature(
            ee.Geometry.Point([-31.53076171875, 8.928487062665504]),
            {
              "system:index": "1"
            }),
        ee.Feature(
            ee.Geometry.Point([-31.22314453125, 8.146242825034385]),
            {
              "system:index": "2"
            }),
        ee.Feature(
            ee.Geometry.Point([-30.73974609375, 7.1663003819031825]),
            {
              "system:index": "3"
            }),
        ee.Feature(
            ee.Geometry.Point([-32.49755859375, 7.645664723491028]),
            {
              "system:index": "4"
            }),
        ee.Feature(
            ee.Geometry.Point([-33.57421875, 8.385431015567708]),
            {
              "system:index": "5"
            }),
        ee.Feature(
            ee.Geometry.Point([-32.58544921875, 8.885071663468993]),
            {
              "system:index": "6"
            }),
        ee.Feature(
            ee.Geometry.Point([-33.42041015625, 7.580327791330129]),
            {
              "system:index": "7"
            }),
        ee.Feature(
            ee.Geometry.Point([-33.7939453125, 6.555474602201875]),
            {
              "system:index": "8"
            }),
        ee.Feature(
            ee.Geometry.Point([-32.49755859375, 6.337137394988546]),
            {
              "system:index": "9"
            }),
        ee.Feature(
            ee.Geometry.Point([-31.5087890625, 6.337137394988546]),
            {
              "system:index": "10"
            }),
        ee.Feature(
            ee.Geometry.Point([-31.5966796875, 7.493196470122287]),
            {
              "system:index": "11"
            }),
        ee.Feature(
            ee.Geometry.Point([-33.310546875, 6.096859818887973]),
            {
              "system:index": "12"
            })]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function app() {
  // generate x1 and x2 as some checkboard pattern
  var x = ee.Image.pixelLonLat().subtract(-1000).mod(2).abs().lt(1)
    .rename(['x1', 'x2'])
  
  var palette = ['ffffff', '000000']

  Map.addLayer(x.select('x1'), {palette: palette}, 'x1', false, 0.5)
  Map.addLayer(x.select('x2'), {palette: palette}, 'x2', false, 0.5)
  
  // define expected y
  var y = x.expression('x1 AND x2', {
    x1: x.select('x1'),
    x2: x.select('x2')
  }).rename('y')

  Map.addLayer(y, {palette: palette}, 'y (expected)', true, 0.5)
  
  // define training set (sample x and y)
  var training = x.addBands(y).reduceRegion({
    reducer: ee.Reducer.toList(), 
    geometry: trainingLocations, 
    scale: 1
  })

  // create a new perceptron classifier
  var classifier = new community.learn.Perceptron()
  
  // train classifier
  classifier.train(training.select(['x1', 'x2']), training.select(['y']))
  
  // define test locations
  var test = {
    x: ee.Image().paint(ee.FeatureCollection.randomPoints(testArea, 100)),
  }

  Map.addLayer(test.x.focal_max(5), {palette: palette}, 'test x', false, 1)

  // classify and show results
  test.y = classifier.classify(test.x)
  
  Map.addLayer(test.y.focal_max(5), {palette: palette}, 'test y', false, 1)
}



/***
 * Activation functions
 */
var community = { learn: { Activations: {} } }

/***
* Step
*/
community.learn.Activations.step = function(x) {
  return x.gte(0)
}
  
/***
* Sigmoid
*/
community.learn.Activations.sigmoid = function(x) {
  return ee.Image(1).divide(ee.Image(1).add(x.multiply(-1).exp()))
}

/***
 * A single layer binary perceptron algorithm
 *
 * 
 * y = sum(wi * xi) 
 * 
 * 
 *        w1   -----
 *    x1 ---->|     |
 *            |  f  |----> y (+1/-1)
 *    x2 ---->|     |
 *        w2   -----
 *               ^ w0
 *    1(bias) ---|
 *
 *  Goal: learn weights wi
 * 
 *  y
 *  ^
 *  |  - \\ +   +
 *  | -   \\  + +   +
 *  | - -  \\    +
 *  | -  -  \\ +   +
 *  --------------------> x
 * 
 * 
 */
community.learn.Perceptron = function(opt_maxIterations) {
  this.maxIterations = opt_maxIterations || 100;
  
  this.activation = community.learn.Activations.step
  
  this.weights = null; // set after training
}

/***
 * Train, find weights given training x and y
 */
community.learn.Perceptron.prototype.train = function(x, y, region) {
  print(x, y)
  
  // initialize random weights

  // iterate
  
  // remember weights
  // this.weights = weights
  
/*  alpha = (double)trackLearningRate.Value / 1000;

  while (error && iteration < maxIterations)
  {
      error = false;
  
      for (i = 0; i <= samples.Count - 1; i++)
      {
          double x1 = samples[i].X1;
          double x2 = samples[i].X2;
          int y;
  
          // replace with:
          // y = activation(x.multiply(w))
  
          if (((w1 * x1) + (w2 * x2) - w0) < 0)
          {
              y = -1;
          }
          else
          {
              y = 1;
          }
  
          if (y != samples[i].Class)
          {
              error = true;
  
              w0 = w0 + alpha * (samples[i].Class - y) * x0 / 2; 
              w1 = w1 + alpha * (samples[i].Class - y) * x1 / 2;
              w2 = w2 + alpha * (samples[i].Class - y) * x2 / 2;
          }
      }
      objGraphics.Clear(Color.White);
      DrawSeparationLine();
      iteration++;
  }
  */
}

/***
 * Classify using pre-trained weights
 */
community.learn.Perceptron.prototype.classify = function(x) {
  return x
}






app()