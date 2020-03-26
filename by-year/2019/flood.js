/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    geometry = /* color: #d63000 */ee.Geometry({
      "type": "GeometryCollection",
      "geometries": [
        {
          "type": "Point",
          "coordinates": [
            34.57236167894257,
            -19.757589492973167
          ]
        },
        {
          "type": "Polygon",
          "coordinates": [
            [
              [
                34.62729331956757,
                -20.369022914531904
              ],
              [
                34.92117759691132,
                -19.966828104197
              ],
              [
                34.75638267503632,
                -19.38234183394071
              ],
              [
                34.66299888597382,
                -18.928303934660168
              ],
              [
                34.35538169847382,
                -18.95688016303589
              ],
              [
                34.29221031175507,
                -19.845451653863407
              ],
              [
                34.62729331956757,
                -20.350997988495116
              ]
            ]
          ],
          "geodesic": true,
          "evenOdd": true
        }
      ],
      "coordinates": []
    });
/***** End of imports. If edited, may not auto-convert in the playground. *****/
var hydro = require('users/gena/packages:hydro')
var text = require('users/gena/packages:text')
var animation = require('users/gena/packages:animation')

hydro.Map.addDem({ layer: { name: 'DEM' }, asset: 'ALOS' })

// var bounds = Map.getBounds(true)
var bounds = geometry

var images = s1.select(0)
  .filterDate('2019-03-10', '2020-01-01').map(function(i) { return i.rename('B0') })
  .filterBounds(bounds)
  
images = images.map(function(i) {
  return i
    .visualize({ min: -25, max: 0 })  
    .blend(text.draw(i.date().format(), i.geometry().centroid(1), Map.getScale(), { textColor: '000000', outlineColor: 'ffffff', outlineSize: 2 }))
    .blend(ee.FeatureCollection(i.geometry()).style( { color: 'ffff00', fillColor: '00000000', width: 1 }))
})  

print(images.size())

animation.animate(images, { maxFrames: 50 })