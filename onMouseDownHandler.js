"use strict";

// OK
// Обработчик кликов на холст
let onMouseDownHandler = function(event) {
    const PIXELS_IN_REM = 16;

    const CURSOR_OFFSET_X = 2;
    const CURSOR_OFFSET_Y = 2.5;
    const PERFORMANCE_TYPE_OFFSET_X = 2;
    const PERFORMANCE_TYPE_OFFSET_Y = 1;

    const CURSOR_CORRECTION_X = CURSOR_OFFSET_X * PIXELS_IN_REM;
    const CURSOR_CORRECTION_Y = CURSOR_OFFSET_Y * PIXELS_IN_REM;
    const PERFORMANCE_TYPE_CORRECTION_X = PERFORMANCE_TYPE_OFFSET_X * PIXELS_IN_REM;
    const PERFORMANCE_TYPE_CORRECTION_Y = PERFORMANCE_TYPE_OFFSET_Y * PIXELS_IN_REM;

    let pageX = event.pageX;
    let pageY = event.pageY;

    let compressedCanvas = document.getElementById("compressedImage__canvas");

    let canvasPosition = compressedCanvas.getBoundingClientRect();
    let canvasX = Math.floor(canvasPosition.x);
    let canvasY = Math.floor(canvasPosition.y);

    let regionDifferenceX = Math.floor((pageX - canvasX) / REGION_SIZE);
    let regionDifferenceY = Math.floor((pageY - canvasY) / REGION_SIZE);

    let regionX = regionDifferenceX * REGION_SIZE + CURSOR_CORRECTION_X;
    let regionY = regionDifferenceY * REGION_SIZE + CURSOR_CORRECTION_Y;

    let similarDomainIndex = regionDifferenceY * REGIONS_IN_LINE + regionDifferenceX;

    let similarDomain = changedRegions[similarDomainIndex];

    let domainOffsetX = similarDomain.offsetX;
    let domainOffsetY = similarDomain.offsetY;

    console.log(similarDomainIndex);
    console.log(similarDomain);
    console.log(domainOffsetX);
    console.log(domainOffsetY);

    let domainX = domainOffsetX * REGION_SIZE + CURSOR_CORRECTION_X;
    let domainY = domainOffsetY * REGION_SIZE + CURSOR_CORRECTION_Y;

    let regionCursorInOriginalImage = document.getElementById('originalImage__regionCursor');
    regionCursorInOriginalImage.style.left = regionX + "px";
    regionCursorInOriginalImage.style.top = regionY + "px";
    regionCursorInOriginalImage.style.display = "block";

    let domainCursorInOriginalImage = document.getElementById('originalImage__domainCursor');
    domainCursorInOriginalImage.style.left = domainX + "px";
    domainCursorInOriginalImage.style.top = domainY + "px";
    domainCursorInOriginalImage.style.display = "block";

    let regionCursorInCompressedImage = document.getElementById('compressedImage__regionCursor');
    regionCursorInCompressedImage.style.left = regionX + "px";
    regionCursorInCompressedImage.style.top = regionY + "px";
    regionCursorInCompressedImage.style.display = "block";

    let performanceType = document.getElementById("originalImage__performanceType");
    let type = similarDomain.performanceType;
    performanceType.innerHTML = performanceTypes[type];
    performanceType.style.display = "block";
}
