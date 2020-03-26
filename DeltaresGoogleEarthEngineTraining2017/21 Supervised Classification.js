/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var images = ee.ImageCollection("COPERNICUS/S2"),
    water = /* color: #d63000 */ee.Feature(
        ee.Geometry.MultiPolygon(
            [[[[4.083738327026367, 51.988897357356066],
               [4.086141586303711, 51.990483001889686],
               [4.083652496337891, 51.99191003396547],
               [4.080820083618164, 51.99043014797647]]],
             [[[4.155406951904297, 51.9581247422368],
               [4.157381057739258, 51.959182571083346],
               [4.154977798461914, 51.96050482204108],
               [4.1535186767578125, 51.9598172564103]]]]),
        {
          "class": 0,
          "name": "water",
          "system:index": "0"
        }),
    vegetation = /* color: #98ff00 */ee.Feature(
        ee.Geometry.MultiPolygon(
            [[[[4.161930084228516, 51.97467690244475],
               [4.161930084228516, 51.97552285503605],
               [4.159955978393555, 51.97557572654266],
               [4.159870147705078, 51.97478264739214]]],
             [[[4.165706634521484, 51.975787211945224],
               [4.166393280029297, 51.97710897309434],
               [4.1645050048828125, 51.97774340459503],
               [4.162788391113281, 51.976738883903245]]]]),
        {
          "class": 1,
          "name": "vegetation",
          "system:index": "0"
        }),
    buildings = /* color: #0b4a8b */ee.Feature(
        ee.Geometry({
          "type": "GeometryCollection",
          "geometries": [
            {
              "type": "Polygon",
              "coordinates": [
                [
                  [
                    4.145922660827637,
                    51.98240223567829
                  ],
                  [
                    4.146298170089722,
                    51.98282514103628
                  ],
                  [
                    4.145268201828003,
                    51.98309606268293
                  ],
                  [
                    4.1449785232543945,
                    51.982692983540815
                  ]
                ]
              ],
              "evenOdd": true
            },
            {
              "type": "Polygon",
              "coordinates": [
                [
                  [
                    4.149441719055176,
                    51.98137138714035
                  ],
                  [
                    4.15008544921875,
                    51.982032190214696
                  ],
                  [
                    4.149205684661865,
                    51.98223703718836
                  ],
                  [
                    4.148658514022827,
                    51.98162910149891
                  ]
                ]
              ],
              "evenOdd": true
            },
            {
              "type": "Polygon",
              "coordinates": [
                [
                  [
                    4.153776168823242,
                    51.984880139916626
                  ],
                  [
                    4.154376983642578,
                    51.98562018073103
                  ],
                  [
                    4.15308952331543,
                    51.985884478058544
                  ],
                  [
                    4.15257453918457,
                    51.9853030218793
                  ]
                ]
              ],
              "evenOdd": true
            },
            {
              "type": "Polygon",
              "coordinates": [
                [
                  [
                    4.13659930229187,
                    51.97636548724615
                  ],
                  [
                    4.136829972267151,
                    51.97651418540283
                  ],
                  [
                    4.136534929275513,
                    51.97667940499809
                  ],
                  [
                    4.136325716972351,
                    51.97658688209983
                  ]
                ]
              ],
              "evenOdd": true
            },
            {
              "type": "Polygon",
              "coordinates": [
                [
                  [
                    4.063010215759277,
                    51.97462402987746
                  ],
                  [
                    4.0631818771362305,
                    51.974941264345304
                  ],
                  [
                    4.06268835067749,
                    51.97502057261132
                  ],
                  [
                    4.0624308586120605,
                    51.974769429287385
                  ]
                ]
              ],
              "geodesic": true,
              "evenOdd": true
            },
            {
              "type": "Polygon",
              "coordinates": [
                [
                  [
                    4.071099758148193,
                    51.97471655682927
                  ],
                  [
                    4.0706706047058105,
                    51.97524527860267
                  ],
                  [
                    4.07017707824707,
                    51.97500735457673
                  ],
                  [
                    4.070799350738525,
                    51.9745182845557
                  ]
                ]
              ],
              "geodesic": true,
              "evenOdd": true
            }
          ],
          "coordinates": []
        }),
        {
          "class": 2,
          "name": "buildings",
          "system:index": "0"
        });
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var bands = {
  native: ['B8', 'B11', 'B4','B3','B3'],
  readable: ['nir', 'swir', 'red', 'green', 'blue']
}

// select cloud-free image
var image = images
  .filterBounds(Map.getBounds(true))
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 15))
  .select(bands.native, bands.readable)
  .toList(1,1).get(0)
  
image = ee.Image(image).divide(10000)
  
var viz = {min: 0.05, max: [0.25, 0.25, 0.28], bands:['red', 'green', 'blue']};
Map.addLayer(image, viz, 'image (RGB)')

var viz = {min: 0.05, max: [0.2,0.35,0.25], bands:['swir', 'nir', 'red']};
Map.addLayer(image, viz, 'image (false)', false)

// combine training features
var features = ee.FeatureCollection([water, vegetation, buildings])

// sample values from the image
var training = image.sampleRegions(features)

// train a CART classifier
var classifier = ee.Classifier.cart()
classifier = classifier.train(training, 'class')

// report training accurracy
print(classifier.confusionMatrix())

// classify image
var results = image.classify(classifier)

Map.addLayer(results.randomVisualizer(), {}, 'results')

// TODO: add a new class to classify sand, drag geometry for a new Feature 
//       with the following properties: class: 3, name: 'sand'
