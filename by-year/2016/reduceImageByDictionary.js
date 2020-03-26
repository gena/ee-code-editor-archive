/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var geometry1 = /* color: #d63000 */ee.Geometry.Polygon(
        [[[-116.19140625, 44.84029065139799],
          [-114.9609375, 47.51720069783942],
          [-118.30078125, 48.10743118848039],
          [-120.673828125, 47.45780853075031],
          [-120.234375, 44.90257799628887]]]),
    geometry2 = /* color: #98ff00 */ee.Geometry.Polygon(
        [[[-104.94140625, 46.316584181822186],
          [-108.720703125, 47.989921667414194],
          [-111.357421875, 47.33882269482199],
          [-111.357421875, 45.9511496866914],
          [-108.984375, 44.33956524809714]]]),
    geometry3 = /* color: #0B4A8B */ee.Geometry.Polygon(
        [[[-97.3828125, 46.195042108660154],
          [-98.701171875, 47.81315451752767],
          [-101.337890625, 47.754097979680026],
          [-103.0078125, 46.255846818480315],
          [-100.37109375, 44.465151013519616]]]),
    geometry4 = /* color: #ffc82d */ee.Geometry.Polygon(
        [[[-88.505859375, 47.04018214480667],
          [-92.28515625, 48.04870994288686],
          [-94.130859375, 46.92025531537451],
          [-93.955078125, 45.21300355599396],
          [-91.7578125, 44.33956524809714]]]);
/***** End of imports. If edited, may not auto-convert in the playground. *****/
function script() {
  // create dictionary 
  var keys = [1,2,3,4]
  var values = [10,20,30,40]
  
  // ee.Dictionary is handicapped and supports only string keys - convert to strings
  keys = keys.map(function(k) { return k.toString() })
  
  var dict = ee.Dictionary.fromLists(keys, values)
  
  // generate a new image containing keys
  var keysImage = ee.Image().toInt()
    .paint(geometry1, 1)
    .paint(geometry2, 2)
    .paint(geometry3, 3)
    .paint(geometry4, 4)
  
  Map.addLayer(keysImage, {min:1, max:4}, 'keys')

  // lookup image values in the dictionary
  var valuesImage = lookup(keysImage, dict)
  
  Map.addLayer(valuesImage, {min: 10, max: 40}, 'values')
}
















/***
 * Lookup image values using a dictionary
 * 
 * @param {ee.Image} keys - an image containing keys as its values.
 * @param {ee.Dictionary} dict - a dictionary to be used for lookup, keys of the dictionary must be numbers.
 */
function lookup(keys, dict) {
  // generate image collection of key/value paries with a 1 value where we have a match
  var images = dict.keys().map(function(k) {
    var v = ee.Image.constant(dict.get(k)).toInt()

    k = ee.Image.constant(ee.Number.parse(k)).toInt()
    
    return keys.neq(k).addBands(v)
  })
  
  images = ee.ImageCollection(images)
  
  // sort by the key equialence and return a values image
  var axes = {image:0, band:1}
  
  var array = images.toArray()
  
  var values = array
    .arraySort(array.arraySlice(axes.band, 0, 1))
    .arraySlice(axes.image, 0, 1)
    .arraySlice(axes.band, 1, 2)
    .arrayProject([axes.band])
    .arrayFlatten([['value']])
    
  return values
}


script()