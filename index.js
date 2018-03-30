"use strict";


function floorPixelChannel(pixelChannel) {
    return (pixelChannel < 0) ? 0 : ((pixelChannel > 255) ? 255 : Math.floor(pixelChannel));
}


// Привести константы в порядок
const IMAGE_SIZE = 256;
const REGION_SIZE = 4;
const DOMAIN_SIZE = 8;
const REGIONS_IN_LINE = IMAGE_SIZE / REGION_SIZE;
const PIXEL_CHANNELS = 24 * (REGION_SIZE ** 2);


let changedRegions = [];


// Загрузка изображения на холст
// 'C:\fakepath\filename' -> filename , 'C:\fakepath\'.length = 12
function uploadImage(namespace, filename) {
    let uploadedImage = document.createElement('img');
    uploadedImage.src = 'img/' + filename.substr(12);

    uploadedImage.onload = function() {
        let canvas = document.getElementById(namespace + "__canvas");
        let context = canvas.getContext('2d');
        context.drawImage(uploadedImage, 0, 0, IMAGE_SIZE, IMAGE_SIZE);
    }
}


// Скачивание данных для интерполяции как JSON-файл
function activateLinkOnFile(data) {
    let dataAsString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));

    let linkOnFile = document.getElementById("compressedImage__downloadDatafile");
    linkOnFile.setAttribute("href", dataAsString);
    linkOnFile.setAttribute("download", "data1.json");

    linkOnFile.style.display = "block";
}


//Функция обработки изображения
function startCompressionImage() {

    let originalCanvas = document.getElementById("originalImage__canvas");
    let originalContext = originalCanvas.getContext('2d');
    let originalImageData = originalContext.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    let originalData = originalImageData.data;

    // Часть 1. Получение из изображения всевозможных доменов (см. getDomains.js)
    let allDomains = getAllDomains(originalData);

    // Часть 2. Поиск похожего домена для каждого региона (см. findSimilarDomains.js)
    changedRegions = findSimilarDomains(originalData, allDomains);

    //Часть 3. Отрисовка сжатого изображения (см. drawCompressedImage.js)
    drawCompressedImage(originalData, changedRegions);

    // Часть 4. Активация ссылки на скачивание файла с коэффициентами интерполяции
    activateLinkOnFile(changedRegions);

    // Часть 5. Возможность кликать по сжатому изображению для подсветки обработанного региона
    let compressedCanvas = document.getElementById("compressedImage__canvas");
    compressedCanvas.addEventListener('mousedown', onMouseDownHandler);
}


// Обработчик кликов на холст
let onMouseDownHandler = function(event) {
    // Нормально расчитать коррекцию позиций!!!
    const correctionX = IMAGE_SIZE + 160;
    const correctionY = 28;

    let pageX = event.pageX;
    let pageY = event.pageY;

    let compressedCanvas = document.getElementById("compressedImage__canvas");

    let canvasPosition = compressedCanvas.getBoundingClientRect();
    let canvasX = Math.floor(canvasPosition.x);
    let canvasY = Math.floor(canvasPosition.y);

    let regionDifferenceX = Math.floor((pageX - canvasX) / REGION_SIZE);
    let regionDifferenceY = Math.floor((pageY - canvasY) / REGION_SIZE);

    let regionX = canvasX + regionDifferenceX * REGION_SIZE - correctionX;
    let regionY = canvasY + regionDifferenceY * REGION_SIZE;

    let similarDomainIndex = regionDifferenceY * REGIONS_IN_LINE + regionDifferenceX;

    let similarDomain = changedRegions[similarDomainIndex];

    let domainOffsetX = similarDomain.offsetX;
    let domainOffsetY = similarDomain.offsetY;

    console.log(similarDomainIndex);
    console.log(similarDomain);
    console.log(domainOffsetX);
    console.log(domainOffsetY);

    let domainX = canvasX + domainOffsetX * REGION_SIZE - correctionX;
    let domainY = canvasY + domainOffsetY * REGION_SIZE;
    
    let regionCursorInOriginalImage = document.getElementById('regionCursorInOriginalImage');
    regionCursorInOriginalImage.style.left = regionX + "px";
    regionCursorInOriginalImage.style.top = regionY + "px";
    regionCursorInOriginalImage.style.display = "block";

    let domainCursorInOriginalImage = document.getElementById('domainCursorInOriginalImage');
    domainCursorInOriginalImage.style.left = domainX + "px";
    domainCursorInOriginalImage.style.top = domainY + "px";
    domainCursorInOriginalImage.style.display = "block";

    let regionCursorInCompressedImage = document.getElementById('regionCursorInCompressedImage');
    regionCursorInCompressedImage.style.left = regionX + correctionX + "px";
    regionCursorInCompressedImage.style.top = regionY + "px";
    regionCursorInCompressedImage.style.display = "block";

    let performanceType = document.getElementById("performanceType");
    performanceType.style.left = canvasX + "px";
    performanceType.style.top = canvasY - correctionY + "px";

    let type = similarDomain.performanceType;
    performanceType.innerHTML = performanceTypes[type];

    performanceType.style.display = "block";
}

// Получение "из Леночки кота"

const interpolationIterations = 5;

function startInterpolationImage() {
    // function readTextFile(file, callback) {
        // var rawFile = new XMLHttpRequest();
        // rawFile.overrideMimeType("application/json");
        // rawFile.open("GET", file, true);
        // rawFile.onreadystatechange = function() {
            // if (rawFile.readyState === 4 && rawFile.status == "200") {
                // callback(rawFile.responseText);
            // }
        // }
        // rawFile.send(null);
    // }

    // let cr;
    // readTextFile("data.json", function(text){
        // cr = JSON.parse(text);
        // console.log(cr[1023]);
    // });
    
    console.log("");
    console.log("Интерполяция - Старт");

    let interpolationDateStart = new Date();

    let processedCanvas = document.getElementById("processedImage__canvas");
    let processedContext = processedCanvas.getContext('2d');
    let processedImageData = processedContext.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    let processedData = processedImageData.data;

    let interpolatedCanvas = document.getElementById("interpolatedImage__canvas");
    let interpolatedContext = interpolatedCanvas.getContext('2d');
    let interpolatedImageData = interpolatedContext.createImageData(processedImageData);
    let interpolatedData = interpolatedImageData.data;

    for (let interpolationIndex = 0; interpolationIndex < interpolationIterations; interpolationIndex++) {
        let timer = setInterval(function () {
            let neededContext;
            let neededImageData;
            let firstData, secondData;

            if (interpolationIndex % 2 === 0) {
                neededContext = interpolatedContext;
                neededImageData = interpolatedImageData;
                firstData = processedData;
                secondData = interpolatedData;
            } else {
                neededContext = processedContext;
                neededImageData = processedImageData;
                firstData = interpolatedData;
                secondData = processedData;
            }

            for (let regionIndex = 0; regionIndex < REGIONS_IN_LINE ** 2; regionIndex++) {
                let regionX = REGION_SIZE * (regionIndex % REGIONS_IN_LINE);
                let regionY = IMAGE_SIZE * REGION_SIZE * parseInt(regionIndex / REGIONS_IN_LINE);

                // console.log(cr);
                let regionInfo = changedRegions[regionIndex];
                let alpha = regionInfo.alpha;
                let beta = regionInfo.beta;

                let domain = formMatrix(firstData, regionInfo.offsetX, regionInfo.offsetY);
                    let performedDomain = performDomain(domain, regionInfo.performanceType);

                for (let i = 0; i < REGION_SIZE; i++) {
                    for (let j = 0; j < REGION_SIZE; j++) {
                        let index = 4 * (regionX + regionY + i*IMAGE_SIZE + j);

                        secondData[index]   = alpha * performedDomain[i][j][0] + beta;
                        secondData[index+1] = alpha * performedDomain[i][j][1] + beta;
                        secondData[index+2] = alpha * performedDomain[i][j][2] + beta;
                        secondData[index+3] = firstData[index+3];
                    }
                }
            }

            neededContext.putImageData(neededImageData, 0, 0);

            let dataURL = interpolatedCanvas.toDataURL();
            let interpolatedImage = document.getElementById('interpolatedImage__source');
            interpolatedImage.src = dataURL;
        }, 1000);
    }

    let interpolationDateFinish = new Date();
    let interpolationDate = (interpolationDateFinish - interpolationDateStart) / 1000;

    console.log("Интерполяция - Финиш");
    console.log("Время выполнения: " + interpolationDate + " секунд");
}
