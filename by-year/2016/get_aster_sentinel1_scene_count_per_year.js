/**** Start of imports. If edited, may not auto-convert in the playground. ****/
var s1 = ee.ImageCollection("COPERNICUS/S1_GRD"),
    aster = ee.ImageCollection("ASTER/AST_L1T_003");
/***** End of imports. If edited, may not auto-convert in the playground. *****/
ee.List.sequence(2000, 2017).getInfo().map(function(y) {
  aster.filterDate(ee.Date.fromYMD(y, 1, 1), ee.Date.fromYMD(y+1, 1, 1)).size().getInfo(function(l) {
    print('ASTER, ' + y + ', ' + l)
  })
})

ee.List.sequence(2012, 2017).getInfo().map(function(y) {
  s1.filterDate(ee.Date.fromYMD(y, 1, 1), ee.Date.fromYMD(y+1, 1, 1)).size().getInfo(function(l) {
    print('C-SAR, ' + y + ', ' + l)
  })
})
