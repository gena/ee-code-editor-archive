/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var fc = ee.FeatureCollection("ft:18ov8ZuCg5_X4C8wBCINjNPjirL3oWBEUzcjz55aD"),
    convert_features_to_this = /* color: #d63000 */ee.Geometry.Polygon(
        [[[-123.37646484375, 38.615153534235795],
          [-122.607421875, 37.734231397749255],
          [-122.01416015625, 37.92513428105641],
          [-122.783203125, 38.71809027951217]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/

print(fc)

Map.addLayer(fc)




// change cursor to cross
Map.style().set('cursor', 'crosshair')

// select feature on click
var selectionLayer = ui.Map.Layer(ee.Image(), {color: 'ffff00' }, 'selection')
Map.layers().add(selectionLayer)

var zIndex = 0

Map.onClick(function(point) {
  var selection = fc.filterBounds(ee.Geometry.Point([point['lon'], point['lat']]))
  
  var size = selection.size().getInfo()
  if(size > 1) {
    if(zIndex > size-1) {
      zIndex = 0
    }

    selection = ee.Feature(selection.toList(1, zIndex).get(0))
    
    zIndex++;
  } else {
    zIndex = 0
    selection = ee.Feature(selection.first())
  }
  
  selectionLayer.setEeObject(selection)

  print('Selected features: ', selection)
}) 


// Map.layers().add() forces map to zoom out, bug?
Map.centerObject(fc)