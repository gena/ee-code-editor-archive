var csent = ee.ImageCollection("COPERNICUS/S1").filterDate('2015-01-01', '2015-07-02');

var EWHH = csent.filter(ee.Filter.eq('instrumentMode','EW'))
    .filter(ee.Filter.eq('transmitterReceiverPolarisation','HH'));

var IWHH = csent.filter(ee.Filter.eq('instrumentMode','IW'))
    .filter(ee.Filter.eq('transmitterReceiverPolarisation','HH'));


//print(csent);
//print(filtered)

Map.addLayer(EWHH,{bands: ['HH']}, 'EWHH' );
Map.addLayer(IWHH, {bands: ['HH']},'IWHH' );

Map.centerObject(csent)