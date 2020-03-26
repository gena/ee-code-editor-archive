/***
 * Generates image collection gallery.
 */

let community = {};

community.ImageGallery = function(images, region, rows, columns, options) {
    // var proj = ee.Image(images.first()).select(0).projection()
    var proj = ee.Projection('EPSG:3857', [Map.getScale(), 0, 0, 0, -Map.getScale(), 0])
    var scale = proj.nominalScale()

    var e = ee.ErrorMargin(Map.getScale())

    var bounds = region.transform(proj, e).bounds(e, proj)

    var count = ee.Number(columns * rows)

    images = images.limit(count)

    // number of images is less than grid cells
    count = count.min(images.size())

    var ids = ee.List(images.aggregate_array('system:index'))

    var indices = ee.List.sequence(0, count.subtract(1))

    var offsetsX = indices.map(function(i) { return ee.Number(i).mod(columns) })
    var offsetsY = indices.map(function(i) { return ee.Number(i).divide(columns).floor() })

    var offsets = offsetsX.zip(offsetsY)

    var offsetByImage = ee.Dictionary.fromLists(ids, offsets)

    var coords = ee.List(bounds.coordinates().get(0))

    var w = ee.Number(ee.List(coords.get(1)).get(0)).subtract(ee.List(coords.get(0)).get(0))//.floor()
    var h = ee.Number(ee.List(coords.get(2)).get(1)).subtract(ee.List(coords.get(0)).get(1))//.floor()

    // CRASHES
    // var boundsImage = ee.Image().changeProj('EPSG:4326', proj).toInt().paint(bounds)

    var boundsImage = ee.Image().toInt().paint(bounds, 1).reproject(proj)

    // new region
    var ll = ee.List(coords.get(0))
    var ur = [ee.Number(ll.get(0)).add(w.multiply(columns)), ee.Number(ll.get(1)).add(h.multiply(rows))]

    var regionNew = ee.Geometry.Rectangle([ll, ur], proj, false)

    var mosaic = images
        .map(function(i) {
            var offset = ee.List(offsetByImage.get(i.get('system:index')))
            var xoff = w.multiply(offset.get(0)).multiply(scale)
            var yoff = h.multiply(offset.get(1)).multiply(scale)

            i = i.mask(boundsImage.multiply(i.mask()))

            return i.translate(xoff, yoff, 'meters', proj)
        }).mosaic()

    return mosaic
    // return {image: mosaic, region: regionNew};
}

