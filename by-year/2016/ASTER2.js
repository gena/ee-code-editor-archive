var infos = [
  {
    // fake vnir and swir bands. only scene level and tir band metadata (only bands 9 through 13 are visible)
    id: 'ASTER/AST_L1T_003/20160105223002',
    bands: [9,10,11],
    min: 650, max: 1000
  },
  
  {
    // southern hemisphere scene. fake swir bands, no swir band metadata 
    id: 'ASTER/AST_L1T_003/20160404170157',
    bands: [2,1,0],
    min: 30, max: 200
  },
  
  {
    id: 'ASTER/AST_L1T_003/20070416133514',
    bands: [2,1,0],
    min: 30, max: 200
  }
];
  
var info = infos[2]

var image = ee.Image(info.id)
Map.addLayer(image.select(info.bands), {min: info.min, max: info.max})
Map.centerObject(image)

infos.map(function(i) { 
  // get bands present in the image
  var bandsPresent = ee.Image(i.id).get('BANDS_PRESENT')
  print(bandsPresent)

  // check if specific band is present
  print(ee.String(bandsPresent).match('3N'))
})
