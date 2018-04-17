"use strict";


let IMAGE_SIZE = 256;
let REGION_SIZE = 4;
let DOMAIN_SIZE = 2 * REGION_SIZE;

let REGIONS_IN_LINE = IMAGE_SIZE / REGION_SIZE;
let REGIONS_IN_IMAGE = REGIONS_IN_LINE ** 2;

let PIXELS_IN_REGION = REGION_SIZE ** 2;
let PIXELS_IN_DOMAIN = DOMAIN_SIZE ** 2;

let OPACITY_CHANNEL = 255;

let performanceTypes = [
    "Без изменений",
    "Поворот на 90",
    "Поворот на 180",
    "Поворот на 270",
    "Поворот на 270 + Отражение",
    "Отражение",
    "Поворот на 90 + Отражение",
    "Поворот на 180 + Отражение"
];

let METRIC_NUMBER = 0;

let FILE_NAME = "";

//
// СОЗДАНИЕ НЕПОДВИЖНОЙ ТОЧКИ
//


let changedRegions = [];

// OK
// Представление изображения в градациях серого
function makeGrayImage(context) {
    let imageData = context.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    let data = imageData.data;

    for (let i = 0; i < data.length; i+=4) {
        let gray = Math.floor(0.299 * data[i] + 0.587 * data[i+1] + 0.184 * data[i+2]);

        data[i] = gray;
        data[i+1] = gray;
        data[i+2] = gray;
    }

    context.putImageData(imageData, 0, 0);
}

// OK
// Загрузка изображения на холст
// 'C:\fakepath\filename' -> filename , 'C:\fakepath\'.length = 12
function uploadImage(namespace, pathToFile) {
    let filename = pathToFile.substr(12);
    let partsOfFilename = filename.split('.');
    FILE_NAME = partsOfFilename[0] + partsOfFilename[1];

    let uploadedImage = document.createElement('img');
    uploadedImage.src = 'img/' + filename;

    uploadedImage.onload = function() {
        let canvas = document.getElementById(namespace + "__canvas");
        let context = canvas.getContext('2d');
        context.drawImage(uploadedImage, 0, 0, IMAGE_SIZE, IMAGE_SIZE);

        // makeGrayImage(context);
    }
}

// OK
// Обработчик клика по кнопке "Сформировать"
function startCompression() {
    let originalCanvas = document.getElementById("originalImage__canvas");
    let originalContext = originalCanvas.getContext('2d');
    let originalImageData = originalContext.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    let originalData = originalImageData.data;

    let regionSizeCollection = document.getElementsByName('regionSize');
    for (let i = 0; i < regionSizeCollection.length; i++) {
        if (regionSizeCollection[i].checked) {
            REGION_SIZE = parseInt(regionSizeCollection[i].value);
            DOMAIN_SIZE = 2 * REGION_SIZE;

            REGIONS_IN_LINE = IMAGE_SIZE / REGION_SIZE;
            REGIONS_IN_IMAGE = REGIONS_IN_LINE ** 2;

            PIXELS_IN_REGION = REGION_SIZE ** 2;
            PIXELS_IN_DOMAIN = DOMAIN_SIZE ** 2;
        }
    }
    console.log(REGION_SIZE);
    console.log(DOMAIN_SIZE);

    let metricCollection = document.getElementsByName('metric');
    for (let i = 0; i < metricCollection.length; i++) {
        if (metricCollection[i].checked) {
            METRIC_NUMBER = parseInt(metricCollection[i].value);
        }
    }
    console.log(METRIC_NUMBER);

    // Получение из изображения всевозможных доменов (см. getAllDomains.js)
    let allDomains = getAllDomains(originalData);

    // Поиск похожего домена для каждого региона (см. findSimilarDomains.js)
    changedRegions = findSimilarDomains(originalData, allDomains);
    
    // Отрисовка сжатого изображения (см. drawCompressedImage.js)
    drawCompressedImage(originalData, changedRegions);

    // Активация ссылки на скачивание файла с коэффициентами интерполяции (см. activateLinkOnFile.js)
    activateLinkOnFile(changedRegions);

    // Подсветка обработанного региона (см. showCursors.js)
    showCursors();
}


//
// ФРАКТАЛЬНАЯ ИНТЕРПОЛЯЦИЯ
//


const INTERPOLATION_ITERATIONS = 100;

let dataForInterpolation;

// ОК
// Загрузка данных в формате JSON
function uploadDataJSON(pathToFile) {
    let filename = pathToFile.substr(12);

    let rawFile = new XMLHttpRequest();

    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", filename, true);

    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            dataForInterpolation = JSON.parse(rawFile.responseText);
            console.log(dataForInterpolation[1023]);
        }
    }

    rawFile.send(null);
}

// ОК
// Обработчик клика по кнопке "Начать интерполяцию"
function startInterpolation() {
    console.log("");
    console.log("Интерполяция - Старт");

    let interpolationDateStart = new Date();

    let processedCanvas = document.getElementById("processedImage__canvas");
    let processedContext = processedCanvas.getContext('2d');
    let processedImageData = processedContext.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    let processedData = processedImageData.data;

    let canvas1 = document.getElementById("interpolatedImage__canvas1");
    let context1 = canvas1.getContext('2d');
    context1.putImageData(processedImageData, 0, 0);
    let imageData1 = context1.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    let data1 = imageData1.data;

    let canvas2 = document.getElementById("interpolatedImage__canvas2");
    let context2 = canvas2.getContext('2d');
    context2.putImageData(processedImageData, 0, 0);
    let imageData2 = context2.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    let data2 = imageData2.data;

    for (let interpolationIndex = 0; interpolationIndex < INTERPOLATION_ITERATIONS; interpolationIndex++) {
        let timer = setTimeout(function () {
            let neededContext;
            let neededImageData;
            let firstData, secondData;

            if (interpolationIndex % 2 === 0) {
                neededContext = context2;
                neededImageData = imageData2;
                firstData = data1;
                secondData = data2;
                canvas1.style.display = "none";
                canvas2.style.display = "block";
            } else {
                neededContext = context1;
                neededImageData = imageData1;
                firstData = data2;
                secondData = data1;
                canvas1.style.display = "block";
                canvas2.style.display = "none";
            }

            for (let regionIndex = 0; regionIndex < REGIONS_IN_IMAGE; regionIndex++) {
                let regionOffsetX = regionIndex % REGIONS_IN_LINE;
                let regionOffsetY = Math.floor(regionIndex / REGIONS_IN_LINE);

                let regionOffsetInPixelsX = regionOffsetX * REGION_SIZE;
                let regionOffsetInPixelsY = regionOffsetY * REGION_SIZE * IMAGE_SIZE;

                let regionObject = dataForInterpolation[regionIndex];

                let alphas = regionObject.alphas;
                let betas = regionObject.betas;

                let domain = formMatrix(firstData, regionObject.offsetX, regionObject.offsetY);
                    let performedDomain = performDomain(domain, regionObject.performanceType);

                for (let i = 0; i < REGION_SIZE; i++) {
                    for (let j = 0; j < REGION_SIZE; j++) {
                        let index = 4 * (regionOffsetInPixelsX + regionOffsetInPixelsY + i * IMAGE_SIZE + j);

                        for (let channel = 0; channel < CHANNEL_COUNT; channel++) {
                            secondData[index + channel] = alphas[channel] * performedDomain[i][j][channel] + betas[channel];
                        }

                        secondData[index+3] = OPACITY_CHANNEL;
                    }
                }
            }

            neededContext.putImageData(neededImageData, 0, 0);
            console.log(interpolationIndex);
        }, 100);
    }

    let interpolationDateFinish = new Date();
    let interpolationDate = (interpolationDateFinish - interpolationDateStart) / 1000;

    console.log("Интерполяция - Финиш");
    console.log("Время выполнения: " + interpolationDate + " секунд");
}
