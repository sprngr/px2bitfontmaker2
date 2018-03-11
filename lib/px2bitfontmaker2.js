const Jimp = require('jimp');

const bitMaskMap = [1,2,4,8,16,32,64,128,256,512,1024,2048,4096,8192,16384,32768];

// Currently supports first set of glyphs bitfontmaker2, extended set soon
const glyphMapLayout = require('./glyphMap.json');
const glyphSize = 16;

let outputJSON = require('./bitfontmaker2.json');

// Import image, get pixels
let glyphPixels;
let glyphMapDimensions = {
    height: 128,
    width: 208
}
let glyphMapOutput = {};

Jimp.read(imagePath)
    .then((image) => {
        let height = image.bitmap.height;
        let width = image.bitmap.width;

        // Check width
        if (width != glyphMapDimensions.width) {
            console.error('Image must be 208 pixels wide (13 16x16 glyphs across)');
            return;
        }

        // Check height (could be more or less)
        if (height % glyphSize !== 0) {
            console.error('Glyph heights must be a power of 16 (128, 256, etc)');
            return;
        } else if (height !== glyphMapDimensions.height) {
            glyphMapDimensions.height = height;
        }

        glyphPixels = getPixelsFromBuffer(image.bitmap.data);

        processPixels();
    })
    .catch(function (err) {
        console.error(err)
        return;
    });

function getPixelsFromBuffer(buffer) {
    let pixelData = [...buffer];
    let results = [];

    for (let i=0; i<pixelData.length; i+=4) {
      results.push({
          r: pixelData[i+0],
          g: pixelData[i+1],
          b: pixelData[i+2],
          a: pixelData[i+3]
      })
    }
    return results;
}

function processPixels() {
    let outerIndex = {x:-1, y: 0};
    let innerIndex = {x:0, y: 0};

    glyphPixels.some((pixel, index) => {
        // Set inner x to be 0 - 15 based on modulo of current index
        innerIndex.x = index % glyphSize;

        // if inner x is 0, increase outer x
        if (innerIndex.x == 0) {
            outerIndex.x++;

            // if outer x will be out of bounds (13)
            // reset it to 0, bump the inner y
            if (outerIndex.x == glyphMapDimensions.width / glyphSize) {
                outerIndex.x = 0;
                innerIndex.y++;

                // if inner y is out of bounds (16)
                // reset it to 0, bump the outer y
                if (innerIndex.y == glyphSize) {
                    innerIndex.y = 0;
                    outerIndex.y++;
                }
            }
        }

        if (pixel.r == 0 && pixel.g == 0 && pixel.b == 0) {
            outputJSON[glyphMapLayout[outerIndex.y][outerIndex.x]][innerIndex.y] += bitMaskMap[innerIndex.x];
        }
    });

    return JSON.stringify(outputJSON);
}