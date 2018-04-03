"use strict";


const IMAGE_SIZE = 256;
const REGION_SIZE = 4;
const DOMAIN_SIZE = 8;

const REGIONS_IN_LINE = IMAGE_SIZE / REGION_SIZE;
const REGIONS_IN_IMAGE = REGIONS_IN_LINE ** 2;

const PIXELS_IN_REGION = REGION_SIZE ** 2;
const PIXELS_IN_DOMAIN = DOMAIN_SIZE ** 2;

const OPACITY_CHANNEL = 255;

const performanceTypes = [
    "Без изменений",
    "Поворот на 90",
    "Поворот на 180",
    "Поворот на 270",
    "Поворот на 270 + Отражение",
    "Отражение",
    "Поворот на 90 + Отражение",
    "Поворот на 180 + Отражение"
];



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
function uploadImage(namespace, filename) {
    let uploadedImage = document.createElement('img');
    uploadedImage.src = 'img/' + filename.substr(12);

    uploadedImage.onload = function() {
        let canvas = document.getElementById(namespace + "__canvas");
        let context = canvas.getContext('2d');
        context.drawImage(uploadedImage, 0, 0, IMAGE_SIZE, IMAGE_SIZE);

        // makeGrayImage(context);
    }
}

// OK
// Обработчик клика по кнопке "Начать сжатие"
function startCompression() {
    let originalCanvas = document.getElementById("originalImage__canvas");
    let originalContext = originalCanvas.getContext('2d');
    let originalImageData = originalContext.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    let originalData = originalImageData.data;

    // Получение из изображения всевозможных доменов (см. getAllDomains.js)
    let allDomains = getAllDomains(originalData);

    // Поиск похожего домена для каждого региона (см. findSimilarDomains.js)
    changedRegions = findSimilarDomains(originalData, allDomains);
    
    // Отрисовка сжатого изображения (см. drawCompressedImage.js)
    drawCompressedImage(originalData, changedRegions);

    // Активация ссылки на скачивание файла с коэффициентами интерполяции (см. activateLinkOnFile.js)
    activateLinkOnFile(changedRegions);

    // Подсветка обработанного региона (см. onMouseDownHandler.js)
    let compressedCanvas = document.getElementById("compressedImage__canvas");
    compressedCanvas.addEventListener('mousedown', onMouseDownHandler);
}



//
// ФРАКТАЛЬНАЯ ИНТЕРПОЛЯЦИЯ
//


const INTERPOLATION_ITERATIONS = 25;


function startInterpolation() {
    
    function readTextFile(file, callback) {
        var rawFile = new XMLHttpRequest();
        rawFile.overrideMimeType("application/json");
        rawFile.open("GET", file, true);
        rawFile.onreadystatechange = function() {
            if (rawFile.readyState === 4 && rawFile.status == "200") {
                callback(rawFile.responseText);
            }
        }
        rawFile.send(null);
    }

    let cr;
    readTextFile("1jpg_ssim_4_8.json", function(text){
        cr = JSON.parse(text);
        console.log(cr[1023]);
    });
    
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
                let regionX = REGION_SIZE * (regionIndex % REGIONS_IN_LINE);
                let regionY = IMAGE_SIZE * REGION_SIZE * parseInt(regionIndex / REGIONS_IN_LINE);

                let regionInfo = cr[regionIndex];

                let alphas = regionInfo.alphas;
                let alphaR = alphas[0];
                let alphaG = alphas[1];
                let alphaB = alphas[2];

                let betas = regionInfo.betas;
                let betaR = betas[0];
                let betaG = betas[1];
                let betaB = betas[2];

                let domain = formMatrix(firstData, regionInfo.offsetX, regionInfo.offsetY);
                    let performedDomain = performDomain(domain, regionInfo.performanceType);

                for (let i = 0; i < REGION_SIZE; i++) {
                    for (let j = 0; j < REGION_SIZE; j++) {
                        let index = 4 * (regionX + regionY + i*IMAGE_SIZE + j);

                        secondData[index]   = alphaR * performedDomain[i][j][0] + betaR;
                        secondData[index+1] = alphaG * performedDomain[i][j][1] + betaG;
                        secondData[index+2] = alphaB * performedDomain[i][j][2] + betaB;
                        secondData[index+3] = firstData[index+3];
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
