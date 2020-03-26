var image = ee.Image('CGIAR/SRTM90_V4')

// 1. hangs, client-side
var info = image.getInfo()
var transform = info.bands[0].crs_transform
print(transform)
var scale = transform[0]

print('Scale: ', scale)

// 2. looks to complex
var proj = image.projection()
var transform = proj.transform() // return type is string
print(transform)
var scale = ee.Number.parse(ee.String(transform.split('elt_0_0", ').get(1)).split('\\]').get(0)) // :(

print('Scale: ', scale)