"use strict";


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


// Стягивание домена к размерам региона (метод усреднения)
function compressDomain(domain) {
    let compressedDomain = [];

    for (let i = 0; i < DOMAIN_SIZE; i+=2) {
        let domainRow = [];

        for (let j = 0; j < DOMAIN_SIZE; j+=2) {
            let domainElement = [];

            let domainR = (domain[i][j][0] + domain[i+1][j][0] + domain[i][j+1][0] + domain[i+1][j+1][0]) / 4;
            let domainG = (domain[i][j][1] + domain[i+1][j][1] + domain[i][j+1][1] + domain[i+1][j+1][1]) / 4;
            let domainB = (domain[i][j][2] + domain[i+1][j][2] + domain[i][j+1][2] + domain[i+1][j+1][2]) / 4;

            domainElement.push(floorPixelChannel(domainR));
            domainElement.push(floorPixelChannel(domainG));
            domainElement.push(floorPixelChannel(domainB));

            domainRow.push(domainElement);
        }

        compressedDomain.push(domainRow);
    }

    return compressedDomain;
}


// Поворот региона на 90 градусов по часовой стрелке
function rotateRegion(region) {
    let rotatedRegion = [];

    for (let j = 0; j < REGION_SIZE; j++) {
        let regionRow = [];

        for (let i = REGION_SIZE; i > 0; i--) {
            let regionElement = [];

            regionElement.push(region[i-1][j][0]);
            regionElement.push(region[i-1][j][1]);
            regionElement.push(region[i-1][j][2]);

            regionRow.push(regionElement);
        }

        rotatedRegion.push(regionRow);
    }

    return rotatedRegion;
}


// Отражение региона по вертикали
function reflectRegion(region) {
    let reflectedRegion = [];

    for (let i = 0; i < REGION_SIZE; i++) {
        let regionRow = [];

        for (let j = REGION_SIZE; j > 0; j--) {
            let regionElement = [];

            regionElement.push(region[i][j-1][0]);
            regionElement.push(region[i][j-1][1]);
            regionElement.push(region[i][j-1][2]);

            regionRow.push(regionElement);
        }

        reflectedRegion.push(regionRow);
    }

    return reflectedRegion;
}


// Преобразование домена в соответствии с performanceTypes
function performDomain(domain, type = -1) {
    let region = compressDomain(domain);

    let performedDomains = [];
    performedDomains.push(region);

    let performanceCount = (type === -1) ? performanceTypes.length - 1 : type;

    for (let i = 0; i < performanceCount; i++) {
        region = ((i+1) % 4 == 0) ? reflectRegion(region) : rotateRegion(region);
        performedDomains.push(region);
    }

    return (type === -1) ? performedDomains : region;
}


// Формирование матрицы по заданному сдвигу (количество матриц) и размеру
function formMatrix(data, offsetX, offsetY, matrixSize = DOMAIN_SIZE) {
    let matrix = [];

    let offsetInPixelsX = offsetX * REGION_SIZE;
    let offsetInPixelsY = offsetY * REGION_SIZE * IMAGE_SIZE;

    for (let i = 0; i < matrixSize; i++) {
        let matrixRow = [];

        for (let j = 0; j < matrixSize; j++) {
            let matrixElement = [];

            let index = 4 * (offsetInPixelsX + offsetInPixelsY + i * IMAGE_SIZE + j);
            
            matrixElement.push(data[index]);
            matrixElement.push(data[index+1]);
            matrixElement.push(data[index+2]);

            matrixRow.push(matrixElement);
        }

        matrix.push(matrixRow);
    }

    return matrix;
}


// Вычисление мат.ожидания матрицы
function calculateMatrixAverage(matrix) {
    let average = 0;

    let matrixSize = matrix.length;

    for (let i = 0; i < matrixSize; i++) {
        for (let j = 0; j < matrixSize; j++) {
            let matrixR = matrix[i][j][0];
            let matrixG = matrix[i][j][1];
            let matrixB = matrix[i][j][2];

            let gray = 0.299 * matrixR + 0.587 * matrixG + 0.184 * matrixB;

            average += floorPixelChannel(gray);
        }
    }

    return average / (matrixSize ** 2);
}

// Получение стянутых доменов с учётом возможных преобразований (повороты и отражение)
function getAllDomains(data) {
    console.log();
    console.log("Получение всевозможных доменов - Старт");

    let startTime = new Date();

    let domains = [];

    for (let regionIndex = 0; regionIndex < REGIONS_IN_LINE ** 2; regionIndex++) {
        if ((regionIndex % REGIONS_IN_LINE) !== (REGIONS_IN_LINE - 1) && regionIndex < (REGIONS_IN_LINE * (REGIONS_IN_LINE - 1))) {
            let offsetX = regionIndex % REGIONS_IN_LINE;
            let offsetY = parseInt(regionIndex / REGIONS_IN_LINE);

            let domain = formMatrix(data, offsetX, offsetY);

            let performedDomains = performDomain(domain);
            let average = calculateMatrixAverage(performedDomains[0]);

            domains.push({
                performedDomains: performedDomains,
                offsetX: offsetX,
                offsetY: offsetY,
                average: average
            });
        }
    }

    let finishTime = new Date();
    let completionTimeAsSeconds = (finishTime - startTime) / 1000;

    console.log("Получение всевозможных доменов - Финиш");
    console.log("Время исполения: " + completionTimeAsSeconds + " секунд");

    return domains;
}
