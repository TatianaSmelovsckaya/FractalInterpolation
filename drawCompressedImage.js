"use strict";

// OK
// Огругление значения пикселя при корректировке
function floorPixelChannel(pixelChannel) {
    return (pixelChannel < 0) ? 0 : ((pixelChannel > 255) ? 255 : Math.floor(pixelChannel));
}

// OK
// Отрисовка сжатого изображения на холст
function drawCompressedImage(data, similarDomains) {
    console.log();
    console.log("Отрисовка сжатого изображения - Старт");

    let compressedCanvas = document.getElementById("compressedImage__canvas");
    let compressedContext = compressedCanvas.getContext('2d');
    let compressedImageData = compressedContext.createImageData(IMAGE_SIZE, IMAGE_SIZE);
    let compressedData = compressedImageData.data;

    let startTime = new Date();
    
    for (let regionIndex = 0; regionIndex < REGIONS_IN_IMAGE; regionIndex++) {
        let regionOffsetX = regionIndex % REGIONS_IN_LINE;
        let regionOffsetY = Math.floor(regionIndex / REGIONS_IN_LINE);

        let regionOffsetInPixelsX = regionOffsetX * REGION_SIZE;
        let regionOffsetInPixelsY = regionOffsetY * REGION_SIZE * IMAGE_SIZE;

        let domainObject = similarDomains[regionIndex];

        let domainOffsetX = domainObject.offsetX;
        let domainOffsetY = domainObject.offsetY;
        let performanceType = domainObject.performanceType;

        let domain = formMatrix(data, domainOffsetX, domainOffsetY);
        let region = performDomain(domain, performanceType);

        let alphas = domainObject.alphas;
        let betas = domainObject.betas;

        for (let i = 0; i < REGION_SIZE; i++) {
            for (let j = 0; j < REGION_SIZE; j++) {
                let index = 4 * (regionOffsetInPixelsX + regionOffsetInPixelsY + i * IMAGE_SIZE + j);

                for (let channel = 0; channel < CHANNEL_COUNT; channel++) {
                    let regionChannel = alphas[channel] * region[i][j][channel] + betas[channel];
                    compressedData[index + channel] = floorPixelChannel(regionChannel);
                }

                compressedData[index+3] = OPACITY_CHANNEL;
            }
        }
    }

    compressedContext.putImageData(compressedImageData, 0, 0);

    let finishTime = new Date();
    let completionTimeAsSeconds = (finishTime - startTime) / 1000;

    console.log("Отрисовка сжатого изображения - Финиш");
    console.log("Время исполения: " + completionTimeAsSeconds + " секунд");
}
