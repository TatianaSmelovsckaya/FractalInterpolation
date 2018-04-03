"use strict";

// OK
// Стягивание домена к размерам региона (метод усреднения)
function compressDomain(domain) {
    let region = [];

    for (let i = 0; i < DOMAIN_SIZE; i+=2) {
        let regionRow = [];

        for (let j = 0; j < DOMAIN_SIZE; j+=2) {
            let regionElement = [];

            let regionR = Math.floor((domain[i][j][0] + domain[i+1][j][0] + domain[i][j+1][0] + domain[i+1][j+1][0]) / 4);
            let regionG = Math.floor((domain[i][j][1] + domain[i+1][j][1] + domain[i][j+1][1] + domain[i+1][j+1][1]) / 4);
            let regionB = Math.floor((domain[i][j][2] + domain[i+1][j][2] + domain[i][j+1][2] + domain[i+1][j+1][2]) / 4);

            regionElement.push(regionR);
            regionElement.push(regionG);
            regionElement.push(regionB);

            regionRow.push(regionElement);
        }

        region.push(regionRow);
    }

    return region;
}

// OK
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

// OK
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

// OK
// Преобразование домена в соответствии с performanceTypes
function performDomain(domain, type = -1) {
    let region = compressDomain(domain);

    let performedDomains = [];
    performedDomains.push(region);

    let performancesCount = (type === -1) ? performanceTypes.length - 1 : type;

    for (let i = 0; i < performancesCount; i++) {
        region = ((i+1) % 4 == 0) ? reflectRegion(region) : rotateRegion(region);
        performedDomains.push(region);
    }

    return (type === -1) ? performedDomains : region;
}

// OK
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

// OK
// Вычисление мат.ожидания для компонентов R,G,B и яркости
function calculateAverages(region) {
    let averages = [0, 0, 0, 0];

    for (let i = 0; i < REGION_SIZE; i++) {
        for (let j = 0; j < REGION_SIZE; j++) {
            let regionR = region[i][j][0];
            let regionG = region[i][j][1];
            let regionB = region[i][j][2];

            let gray = Math.floor(0.299 * regionR + 0.587 * regionG + 0.184 * regionB);

            averages[0] += regionR;
            averages[1] += regionG;
            averages[2] += regionB;
            averages[3] += gray;
        }
    }

    averages[0] /= PIXELS_IN_REGION;
    averages[1] /= PIXELS_IN_REGION;
    averages[2] /= PIXELS_IN_REGION;
    averages[3] /= PIXELS_IN_REGION;

    return averages;
}

// OK
// Вычисление дисперсии для компонентов R,G,B и яркости
function calculateDispersions(region, averages) {
    let dispersions = [0, 0, 0, 0];

    for (let i = 0; i < REGION_SIZE; i++) {
        for (let j = 0; j < REGION_SIZE; j++) {
            let regionR = region[i][j][0];
            let regionG = region[i][j][1];
            let regionB = region[i][j][2];

            let gray = Math.floor(0.299 * regionR + 0.587 * regionG + 0.184 * regionB);

            dispersions[0] += (regionR - averages[0]) ** 2;
            dispersions[1] += (regionG - averages[1]) ** 2;
            dispersions[2] += (regionB - averages[2]) ** 2;
            dispersions[3] += (Math.floor(gray) - averages[3]) ** 2;
        }
    }

    dispersions[0] /= PIXELS_IN_REGION;
    dispersions[1] /= PIXELS_IN_REGION;
    dispersions[2] /= PIXELS_IN_REGION;
    dispersions[3] /= PIXELS_IN_REGION;

    return dispersions;
}

// OK
// Получение стянутых доменов с учётом возможных преобразований (повороты и отражение)
function getAllDomains(data) {
    console.log();
    console.log("Получение всевозможных доменов - Старт");

    let domains = [];

    let startTime = new Date();

    for (let regionIndex = 0; regionIndex < REGIONS_IN_IMAGE; regionIndex++) {
        if ((regionIndex % REGIONS_IN_LINE) !== (REGIONS_IN_LINE - 1) && regionIndex < (REGIONS_IN_LINE * (REGIONS_IN_LINE - 1))) {
            let offsetX = regionIndex % REGIONS_IN_LINE;
            let offsetY = Math.floor(regionIndex / REGIONS_IN_LINE);

            let domain = formMatrix(data, offsetX, offsetY);
            
            let performedDomains = performDomain(domain);
            let averages = calculateAverages(performedDomains[0]);
            let dispersions = calculateDispersions(performedDomains[0], averages);

            domains.push({
                performedDomains: performedDomains,
                offsetX: offsetX,
                offsetY: offsetY,
                averages: averages,
                dispersions: dispersions
            });
        }
    }

    let finishTime = new Date();
    let completionTimeAsSeconds = (finishTime - startTime) / 1000;

    console.log("Получение всевозможных доменов - Финиш");
    console.log("Время исполения: " + completionTimeAsSeconds + " секунд");

    return domains;
}
