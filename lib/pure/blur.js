// Blur filter
//
'use strict';

// returns blurred values of L represented by 16FP (8,8)
function blur(src, srcW, srcH, radius) {
  var x, y, ptr, ptrNeighBottom, radiusOffset, leavingPoint, arrivingPoint, bottomValue, columnSum, rowSum,
    output = new Uint16Array(src.length);
  // divide horizontal and vertical total sum of points by radius*4 + 2
  var RADIUS_NORM = Math.floor(64 / (radius + 0.5));
  // let's sum columns of points as the first pass, then rows of points as the second
  // to avoid returning large array, we'll integrate this algorithm later into unsharp() -
  // or we can return only points needing updates from here
  for (x = 0; x < srcW; x++) {
    // first point in each column
    columnSum = 0;
    // start from the 2nd
    ptr = x + srcW;
    for (y = 1; y <= radius; y++) {
      columnSum += src[ptr];
      ptr += srcW;
    }
    // first and outside points plus rest of the neighborhood
    output[x] = src[x] * radius + columnSum;
    ptr = x + srcW;
    radiusOffset = radius * srcW;
    ptrNeighBottom = ptr + radiusOffset;
    bottomValue = src[x + (srcH - 1) * srcW];
    for (y = 1; y < srcH; y++) {
      // if radius within image square, to get next column sum we need to substract src[ptr - radius * srcW]
      // point and add src[ptr + radius * srcW]; for radius outside we need to copy src(x,0)
      // and src(x,srcH-1)
      leavingPoint = y < radius ? src[x] : src[ptr - radiusOffset];
      arrivingPoint = y > srcH - radius ? bottomValue : src[ptrNeighBottom];
      output[ptr] = output[ptr - srcW] + arrivingPoint - leavingPoint;
      ptr += srcW;
      ptrNeighBottom += srcW;
    }
  }

  for (y = 0; y < srcH; y++) {
    // first point in each row
    rowSum = 0;
    // start from the 2nd
    ptr = y * srcH + 1;
    for (x = 1; x <= radius; x++) {
      rowSum += src[ptr++];
    }
    // first and outside points plus rest of the neighborhood;
    // add to the output of the 1st pass
    output[y * srcH] += src[y * srcH] * radius + rowSum;
    ptr = y * srcW + 1;
    radiusOffset = radius;
    ptrNeighBottom = ptr + radiusOffset;
    bottomValue = src[y * srcW + srcH - 1];
    rowSum = output[y * srcH];
    output[y * srcH] = (output[y * srcH] * RADIUS_NORM) >> 8;
    for (x = 1; x < srcW; x++) {
      // if radius within image square, to get next row sum we need to substract src[ptr - radius]
      // point and add src[ptr + radius]; for radius outside we need to copy src(0,y)
      // and src(srcW-1,y)
      leavingPoint = x < radius ? src[y * srcW] : src[ptr - radiusOffset];
      arrivingPoint = x > srcW - radius ? bottomValue : src[ptrNeighBottom];
      rowSum = rowSum + arrivingPoint - leavingPoint;
      output[ptr] += rowSum;
      output[ptr] = (output[ptr] * RADIUS_NORM) >> 8;
      ptr += 1;
      ptrNeighBottom += 1;
    }
  }
  return output;
}

module.exports = blur;
