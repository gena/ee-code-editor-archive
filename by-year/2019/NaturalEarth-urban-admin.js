var admin10m = ee.FeatureCollection('ft:1vRgso0NNIocWUXffTPM1ukqAS0H3L4a60aWq6g')
var urbanAreas10m = ee.FeatureCollection('ft:1DXXbRv6BxbtY6p5ajdfPfcppks8qHwpW1a6XxA')

Map.addLayer(admin10m, {}, 'admin boundaries (features)', false)
Map.addLayer(urbanAreas10m, {}, 'urban areas (features)', false)

Map.addLayer(admin10m.style({color: 'ffffff', fillColor: '00000000', width: 1}), {}, 'admin boundaries', true, 0.8)
Map.addLayer(urbanAreas10m.style({color: 'fee8c8', width: 1, fillColor: 'e34a33'}), {}, 'urban areas', true, 0.8)

require('users/gena/packages:style').SetMapStyleDark()