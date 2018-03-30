"use strict";


const PIXEL_OPACITY = 255;


// Отрисовка сжатого изображения на холст
function drawCompressedImage(data, similarDomains) {
    console.log();
    console.log("Отрисовка сжатого изображения - Старт");

    let startTime = new Date();

    let compressedCanvas = document.getElementById("compressedImage__canvas");
    let compressedContext = compressedCanvas.getContext('2d');
    let compressedImageData = compressedContext.createImageData(IMAGE_SIZE, IMAGE_SIZE);
    let compressedData = compressedImageData.data;
    
    for (let regionIndex = 0; regionIndex < REGIONS_IN_LINE ** 2; regionIndex++) {
        let regionOffsetX = regionIndex % REGIONS_IN_LINE;
        let regionOffsetY = Math.floor(regionIndex / REGIONS_IN_LINE);

        let regionOffsetInPixelsX = regionOffsetX * REGION_SIZE;
        let regionOffsetInPixelsY = regionOffsetY * REGION_SIZE * IMAGE_SIZE;

        let domainObject = similarDomains[regionIndex];

        let domainOffsetInPixelsX = domainObject.offsetX;
        let domainOffsetInPixelsY = domainObject.offsetY;
        let performanceType = domainObject.performanceType;

        let domain = formMatrix(data, domainOffsetInPixelsX, domainOffsetInPixelsY);
        let region = performDomain(domain, performanceType);

        let alpha = domainObject.alpha;
        let beta = domainObject.beta;

        for (let i = 0; i < REGION_SIZE; i++) {
            for (let j = 0; j < REGION_SIZE; j++) {
                let index = 4 * (regionOffsetInPixelsX + regionOffsetInPixelsY + i * IMAGE_SIZE + j);

                let regionR = alpha * region[i][j][0] + beta;
                compressedData[index] = floorPixelChannel(regionR);

                let regionG = alpha * region[i][j][1] + beta;
                compressedData[index+1] = floorPixelChannel(regionG);

                let regionB = alpha * region[i][j][2] + beta;
                compressedData[index+2] = floorPixelChannel(regionB);

                compressedData[index+3] = PIXEL_OPACITY;
            }
        }
    }

    compressedContext.putImageData(compressedImageData, 0, 0);

    let finishTime = new Date();
    let completionTimeAsSeconds = (finishTime - startTime) / 1000;

    console.log("Отрисовка сжатого изображения - Финиш");
    console.log("Время исполения: " + completionTimeAsSeconds + " секунд");
}
