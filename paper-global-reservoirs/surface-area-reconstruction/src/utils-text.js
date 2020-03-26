let Text = {
    draw: function (text, pos, scale, props) {
        text = ee.String(text);

        let ascii = {};
        for (let i = 32; i < 128; i++) {
            ascii[String.fromCharCode(i)] = i;
        }
        ascii = ee.Dictionary(ascii);

        let fontSize = '16';

        if (props && props.fontSize) {
            fontSize = props.fontSize
        }

        let glyphs = ee.Image('users/gena/fonts/Arial' + fontSize);

        let proj = glyphs.projection();
        glyphs = glyphs.changeProj(proj, proj.scale(1, -1));

        // get font info
        let font = {
            height: ee.Number(glyphs.get('height')),
            width: ee.Number(glyphs.get('width')),
            cellHeight: ee.Number(glyphs.get('cell_height')),
            cellWidth: ee.Number(glyphs.get('cell_width')),
            charWidths: ee.String(glyphs.get('char_widths')).split(',').map(ee.Number.parse),
        };

        font.columns = font.width.divide(font.cellWidth);
        font.rows = font.height.divide(font.cellHeight);

        function toAscii(text) {
            return ee.List(text.split('')
                .iterate(function (char, prev) {
                    return ee.List(prev).add(ascii.get(char));
                }, ee.List([])));
        }

        function moveChar(image, xmin, xmax, ymin, ymax, x, y) {
            let ll = ee.Image.pixelLonLat();
            let nxy = ll.floor().round().changeProj(ll.projection(), image.projection());
            let nx = nxy.select(0);
            let ny = nxy.select(1);
            let mask = nx.gte(xmin).and(nx.lt(xmax)).and(ny.gte(ymin)).and(ny.lt(ymax));

            return image.mask(mask).translate(ee.Number(xmin).multiply(-1).add(x), ee.Number(ymin).multiply(-1).subtract(y));
        }

        let codes = toAscii(text);

        // compute width for every char
        let charWidths = codes.map(function (code) {
            return ee.Number(font.charWidths.get(ee.Number(code)));
        });

        // compute xpos for every char
        let charX = ee.List(charWidths.iterate(function (w, list) {
            list = ee.List(list);
            let lastX = ee.Number(list.get(-1));
            let x = lastX.add(w);

            return list.add(x);
        }, ee.List([0]))).slice(0, -1);

        let charPositions = charX.zip(ee.List.sequence(0, charX.size()));

        // compute char glyph positions
        let charGlyphPositions = codes.map(function (code) {
            code = ee.Number(code).subtract(32); // subtract start star (32)
            let y = code.divide(font.columns).floor().multiply(font.cellHeight);
            let x = code.mod(font.columns).multiply(font.cellWidth);

            return [x, y];
        });

        let charGlyphInfo = charGlyphPositions.zip(charWidths).zip(charPositions);

        pos = ee.Geometry(pos).transform(proj).coordinates();
        let xpos = ee.Number(pos.get(0));
        let ypos = ee.Number(pos.get(1));

        // 'look-up' and draw char glyphs
        let textImage = ee.ImageCollection(charGlyphInfo.map(function (o) {
            o = ee.List(o);

            let glyphInfo = ee.List(o.get(0));
            let gw = ee.Number(glyphInfo.get(1));
            let glyphPosition = ee.List(glyphInfo.get(0));
            let gx = ee.Number(glyphPosition.get(0));
            let gy = ee.Number(glyphPosition.get(1));

            let charPositions = ee.List(o.get(1));
            let x = ee.Number(charPositions.get(0));
            let i = ee.Number(charPositions.get(1));

            let glyph = moveChar(glyphs, gx, gx.add(gw), gy, gy.add(font.cellHeight), x, 0, proj);

            return glyph.changeProj(proj, proj.translate(xpos, ypos).scale(scale, scale));
        })).mosaic();

        textImage = textImage.mask(textImage);

        if (props) {
            props = {
                textColor: props.textColor || 'ffffff',
                outlineColor: props.outlineColor || '000000',
                outlineWidth: props.outlineWidth || 0,
                textOpacity: props.textOpacity || 0.9,
                textWidth: props.textWidth || 1,
                outlineOpacity: props.outlineOpacity || 0.4
            };

            let textLine = textImage
                .visualize({opacity: props.textOpacity, palette: [props.textColor], forceRgbOutput: true});

            if (props.textWidth > 1) {
                textLine.focal_max(props.textWidth)
            }

            if (!props || (props && !props.outlineWidth)) {
                return textLine;
            }

            let textOutline = textImage.focal_max(props.outlineWidth)
                .visualize({opacity: props.outlineOpacity, palette: [props.outlineColor], forceRgbOutput: true});


            return ee.ImageCollection.fromImages(ee.List([textOutline, textLine])).mosaic()
        } else {
            return textImage;
        }
    }
};
