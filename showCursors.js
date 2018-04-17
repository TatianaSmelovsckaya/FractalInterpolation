"use strict";

// OK
// Обработчик кликов на холст
let onMouseDownHandler = function(event) {
    const PIXELS_IN_REM = 16;

    const PERFORMANCE_TYPE_OFFSET_X = 2;
    const PERFORMANCE_TYPE_OFFSET_Y = 1;

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

    let regionX = regionDifferenceX * REGION_SIZE;
    let regionY = regionDifferenceY * REGION_SIZE;

    let similarDomainIndex = regionDifferenceY * REGIONS_IN_LINE + regionDifferenceX;

    let similarDomain = changedRegions[similarDomainIndex];

    let domainOffsetX = similarDomain.offsetX;
    let domainOffsetY = similarDomain.offsetY;

    let domainX = domainOffsetX * REGION_SIZE;
    let domainY = domainOffsetY * REGION_SIZE;

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

    let performanceBlock = document.getElementsByClassName("performance")[0];
    performanceBlock.style.display = "flex";

    let performanceType = document.getElementById("performance__type");
    let type = similarDomain.performanceType;
    performanceType.innerHTML = "Преобразование: " + performanceTypes[type];

    let performanceAlphaR = document.getElementById("performance__alphaR");
    performanceAlphaR.innerHTML = "AlphaR:&nbsp;" + similarDomain.alphas[0];
    let performanceAlphaG = document.getElementById("performance__alphaG");
    performanceAlphaG.innerHTML = "AlphaG:&nbsp;" + similarDomain.alphas[1];
    let performanceAlphaB = document.getElementById("performance__alphaB");
    performanceAlphaB.innerHTML = "AlphaB:&nbsp;" + similarDomain.alphas[2];

    let performanceBetaR = document.getElementById("performance__betaR");
    performanceBetaR.innerHTML = "BetaR:&nbsp;" + similarDomain.betas[0];
    let performanceBetaG = document.getElementById("performance__betaG");
    performanceBetaG.innerHTML = "BetaG:&nbsp;" + similarDomain.betas[1];
    let performanceBetaB = document.getElementById("performance__betaB");
    performanceBetaB.innerHTML = "BetaB:&nbsp;" + similarDomain.betas[2];
}

// ОК
// Подсветка обработанного региона
function showCursors() {
    let originalRegionCursor = document.getElementById("originalImage__regionCursor");
    originalRegionCursor.style.width = REGION_SIZE - 1;
    originalRegionCursor.style.height = REGION_SIZE - 1;

    let originalDomainCursor = document.getElementById("originalImage__domainCursor");
    originalDomainCursor.style.width = DOMAIN_SIZE - 1;
    originalDomainCursor.style.height = DOMAIN_SIZE - 1;

    let compressedRegionCursor = document.getElementById("compressedImage__regionCursor");
    compressedRegionCursor.style.width = REGION_SIZE - 1;
    compressedRegionCursor.style.height = REGION_SIZE - 1;

    let compressedCanvas = document.getElementById("compressedImage__canvas");
    compressedCanvas.addEventListener('mousedown', onMouseDownHandler);
}
