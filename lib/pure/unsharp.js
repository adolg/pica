// Unsharp mask filter
//
// http://stackoverflow.com/a/23322820/1031804
// USM(O) = O + (2 * (Amount / 100) * (O - GB))
// GB - gaussial blur.
//
//
// lightness = (max(r, g, b) + min(r, g, b))/2
// use lightness to calculate box blur
//
'use strict';


var blur = require('./blur');


function clampTo8(i) { return i < 0 ? 0 : (i > 255 ? 255 : i); }

// Extract lightness array, 16bits FP result (8.8)
//
function lightness(src, srcW, srcH) {
  var size = srcW * srcH;
  var result = new Uint16Array(size);
  var i, srcPtr, max, min;

  for (i = 0, srcPtr = 0; i < size; i++) {
    max = Math.max(src[srcPtr], src[srcPtr + 1], src[srcPtr + 2]) << 8;
    min = Math.min(src[srcPtr], src[srcPtr + 1], src[srcPtr + 2]) << 8;
    result[i] = (max + min) >>> 1;
    srcPtr = (srcPtr + 4) | 0;
  }

  return result;
}

// Apply unsharp mask to src
//
function unsharp(src, srcW, srcH, amount, radius, threshold) {
  var x, y, c, diff = 0, corr, srcPtr;

  // Normalized delta multiplier. Expect that:
  var AMOUNT_NORM = Math.floor(amount * 256 / 50);

  // Convert to lightness:
  //
  // - prevent color drift
  // - speedup blur calc
  //
  var lts = lightness(src, srcW, srcH);

  var blured = blur(lts, srcW, srcH, radius);
  var fpThreshold = (threshold << 8);
  var ltsPtr = 0;

  for (y = 0; y < srcH; y++) {
    for (x = 0; x < srcW; x++) {

      // calculate lightness blur, difference & update source buffer
      diff = lts[ltsPtr] - blured[ltsPtr];

      // Update source image if threshold exceeded
      if (Math.abs(diff) > fpThreshold) {
        // Calculate correction multiplier
        // apply correction to L, adjust RGB
        corr = 65536 + ((diff * AMOUNT_NORM) >> 8);
        srcPtr = ltsPtr * 4;

        c = src[srcPtr];
        src[srcPtr++] = clampTo8((c * corr) >> 16);
        c = src[srcPtr];
        src[srcPtr++] = clampTo8((c * corr) >> 16);
        c = src[srcPtr];
        src[srcPtr] = clampTo8((c * corr) >> 16);
      }

      ltsPtr++;

    } // end row
  } // end column
}


module.exports = unsharp;
