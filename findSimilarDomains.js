"use strict";


function findSimilarDomains(data, domains) {
    console.log();
    console.log("Поиск похожего домена - Старт");

    let startTime = new Date();

    let similarDomains = [];

    for (let regionIndex = 0; regionIndex < REGIONS_IN_LINE ** 2; regionIndex++) {
        let offsetX = regionIndex % REGIONS_IN_LINE;
        let offsetY  = parseInt(regionIndex / REGIONS_IN_LINE);

        let regionMatrix = formMatrix(data, offsetX, offsetY, REGION_SIZE);

        let region = {
            matrix: regionMatrix,
            average: calculateMatrixAverage(regionMatrix)
        }

        // let similarDomain = findSimilarDomainAsOLS(region, domains);
        // let similarDomain = findSimilarDomainAsOLSWithSimilarityCoefficients(region, domains);
        // let similarDomain = findSimilarDomainAsCorrelation(region, domains);
        // let similarDomain = findSimilarDomainAsCorrelationWithSimilarityCoefficients(region, domains);
        // let similarDomain = findSimilarDomainAsSSIM(region, domains);
        let similarDomain = findSimilarDomainAsSSIMWithSimilarityCoefficients(region, domains);

        similarDomains.push(similarDomain);
    }
    
    let finishTime = new Date();
    let completionTimeAsSeconds = (finishTime - startTime) / 1000;

    console.log("Поиск похожего домена - Финиш");
    console.log("Время исполения: " + completionTimeAsSeconds + " секунд");

    return similarDomains;
}


function findSimilarDomainAsOLS(regionObject, domains) {
    let region = regionObject.matrix;

    // Расчитать мин.расстояние по-нормальному!!!
    let minDistance = 2 ** 34;
    let neededDomainIndex = 0;
    let neededPerformanceType = 0;

    for (let domainIndex = 0; domainIndex < domains.length; domainIndex++) {
        let performedDomains = domains[domainIndex].performedDomains;

        for (let performanceIndex = 0; performanceIndex < performedDomains.length; performanceIndex++) {
            let domain = performedDomains[performanceIndex];

            let distance = 0;

            for (let i = 0; i < REGION_SIZE; i++) {
                for (let j = 0; j < REGION_SIZE; j++) {
                    let regionR = region[i][j][0];
                    let regionG = region[i][j][1];
                    let regionB = region[i][j][2];

                    let domainR = domain[i][j][0];
                    let domainG = domain[i][j][1];
                    let domainB = domain[i][j][2];

                    distance += (regionR - domainR) ** 2;
                    distance += (regionG - domainG) ** 2;
                    distance += (regionB - domainB) ** 2;
                }
            }

            if (distance < minDistance) {
                minDistance = distance;
                neededDomainIndex = domainIndex;
                neededPerformanceType = performanceIndex;
            }
        }
    }

    let similarDomain = {
        // region: domains[neededDomainIndex].performedDomains[neededPerformanceType],
        offsetX: domains[neededDomainIndex].offsetX,
        offsetY: domains[neededDomainIndex].offsetY,
        performanceType: neededPerformanceType,
        alpha: 1,
        beta: 0
    };

    return similarDomain;
}


function findSimilarDomainAsOLSWithSimilarityCoefficients(regionObject, domains) {
    let region = regionObject.matrix;

    // Расчитать мин.расстояние по-нормальному!!!
    let minDistance = 2 ** 34;
    let neededDomainIndex = 0;
    let neededPerformanceType = 0;
    let neededAlpha = 1;
    let neededBeta = 0;

    for (let domainIndex = 0; domainIndex < domains.length; domainIndex++) {
        let performedDomains = domains[domainIndex].performedDomains;
        let domainAverage = domains[domainIndex].average;

        for (let performanceIndex = 0; performanceIndex < performedDomains.length; performanceIndex++) {
            let domain = performedDomains[performanceIndex];

            let sumR = 0;
            let sumD = 0;
            let sumRD = 0;
            let sumD2 = 0;

            let distance = 0;

            for (let i = 0; i < REGION_SIZE; i++) {
                for (let j = 0; j < REGION_SIZE; j++) {
                    let regionR = region[i][j][0];
                    let regionG = region[i][j][1];
                    let regionB = region[i][j][2];

                    let domainR = domain[i][j][0];
                    let domainG = domain[i][j][1];
                    let domainB = domain[i][j][2];

                    sumR += regionR + regionG + regionB;
                    sumD += domainR + domainG + domainB;
                    sumRD += regionR * domainR + regionG * domainG + regionB * domainB;
                    sumD2 += domainR ** 2 + domainG ** 2 + domainB ** 2;

                    distance += (regionR - domainR) ** 2;
                    distance += (regionG - domainG) ** 2;
                    distance += (regionB - domainB) ** 2;
                }
            }

            let alpha = (PIXEL_CHANNELS * sumRD - sumR * sumD) / (PIXEL_CHANNELS * sumD2 - sumD ** 2);
            let beta = (sumR - alpha * sumD) / PIXEL_CHANNELS;

            if (distance < minDistance) {
                minDistance = distance;
                neededDomainIndex = domainIndex;
                neededPerformanceType = performanceIndex;
                neededAlpha = alpha;
                neededBeta = beta;
            }
        }
    }

    let similarDomain = {
        // region: domains[neededDomainIndex].performedDomains[neededPerformanceType],
        offsetX: domains[neededDomainIndex].offsetX,
        offsetY: domains[neededDomainIndex].offsetY,
        performanceType: neededPerformanceType,
        alpha: neededAlpha,
        beta: neededBeta
    };

    return similarDomain;
}


// Проблема: Алгоритм косячит (тестировать на коте)!!!
// Добавить обработку особых случаев (нулевые дисперсии)
function findSimilarDomainAsCorrelation(regionObject, domains) {
    let region = regionObject.matrix;
    let regionAverage = regionObject.average;

    let maxDistance = 0;
    let neededDomainIndex = 0;
    let neededPerformanceType = 0;

    for (let domainIndex = 0; domainIndex < domains.length; domainIndex++) {
        let performedDomains = domains[domainIndex].performedDomains;
        let domainAverage = domains[domainIndex].average;

        for (let performanceIndex = 0; performanceIndex < performedDomains.length; performanceIndex++) {
            let domain = performedDomains[performanceIndex];

            let covariance = 0; 
            let regionDispersion = 0; 
            let domainDispersion = 0;

            for (let i = 0; i < REGION_SIZE; i++) {
                for (let j = 0; j < REGION_SIZE; j++) {
                    let regionR = region[i][j][0];
                    let regionG = region[i][j][1];
                    let regionB = region[i][j][2];

                    let domainR = domain[i][j][0];
                    let domainG = domain[i][j][1];
                    let domainB = domain[i][j][2];
                        
                    covariance += (regionR - regionAverage) * (domainR - domainAverage);
                    covariance += (regionG - regionAverage) * (domainG - domainAverage);
                    covariance += (regionB - regionAverage) * (domainB - domainAverage);

                    regionDispersion += (regionR - regionAverage) ** 2;
                    regionDispersion += (regionG - regionAverage) ** 2;
                    regionDispersion += (regionB - regionAverage) ** 2;

                    domainDispersion += (domainR - domainAverage) ** 2;
                    domainDispersion += (domainG - domainAverage) ** 2;
                    domainDispersion += (domainB - domainAverage) ** 2;
                }
            }

            let distance = covariance / Math.sqrt(regionDispersion * domainDispersion);

            if (Math.abs(distance) > Math.abs(maxDistance)) {
                maxDistance = distance;
                neededDomainIndex = domainIndex;
                neededPerformanceType = performanceIndex;
            }
        }
    }
        
    let similarDomain = {
        // region: domains[neededDomainIndex].performedDomains[neededPerformanceType],
        offsetX: domains[neededDomainIndex].offsetX,
        offsetY: domains[neededDomainIndex].offsetY,
        performanceType: neededPerformanceType,
        alpha: 1,
        beta: 0
    };

    return similarDomain;
}


// Добавить обработку особых случаев (нулевые дисперсии)
function findSimilarDomainAsCorrelationWithSimilarityCoefficients(regionObject, domains) {
    let region = regionObject.matrix;
    let regionAverage = regionObject.average;

    let maxDistance = 0;
    let neededDomainIndex = 0;
    let neededPerformanceType = 0;
    let neededAlpha = 1;
    let neededBeta = 0;

    for (let domainIndex = 0; domainIndex < domains.length; domainIndex++) {
        let performedDomains = domains[domainIndex].performedDomains;
        let domainAverage = domains[domainIndex].average;

        for (let performanceIndex = 0; performanceIndex < performedDomains.length; performanceIndex++) {
            let domain = performedDomains[performanceIndex];

            let sumR = 0;
            let sumD = 0;
            let sumRD = 0;
            let sumD2 = 0;

            let covariance = 0; 
            let regionDispersion = 0; 
            let domainDispersion = 0;

            for (let i = 0; i < REGION_SIZE; i++) {
                for (let j = 0; j < REGION_SIZE; j++) {
                    let regionR = region[i][j][0];
                    let regionG = region[i][j][1];
                    let regionB = region[i][j][2];

                    let domainR = domain[i][j][0];
                    let domainG = domain[i][j][1];
                    let domainB = domain[i][j][2];

                    sumR += regionR + regionG + regionB;
                    sumD += domainR + domainG + domainB;
                    sumRD += regionR * domainR + regionG * domainG + regionB * domainB;
                    sumD2 += domainR ** 2 + domainG ** 2 + domainB ** 2;
                        
                    covariance += (regionR - regionAverage) * (domainR - domainAverage);
                    covariance += (regionG - regionAverage) * (domainG - domainAverage);
                    covariance += (regionB - regionAverage) * (domainB - domainAverage);

                    regionDispersion += (regionR - regionAverage) ** 2;
                    regionDispersion += (regionG - regionAverage) ** 2;
                    regionDispersion += (regionB - regionAverage) ** 2;

                    domainDispersion += (domainR - domainAverage) ** 2;
                    domainDispersion += (domainG - domainAverage) ** 2;
                    domainDispersion += (domainB - domainAverage) ** 2;
                }
            }

            let alpha = (PIXEL_CHANNELS * sumRD - sumR * sumD) / (PIXEL_CHANNELS * sumD2 - sumD ** 2);
            let beta = (sumR - alpha * sumD) / PIXEL_CHANNELS;

            let distance = covariance / Math.sqrt(regionDispersion * domainDispersion);

            if (Math.abs(distance) > Math.abs(maxDistance)) {
                maxDistance = distance;
                neededDomainIndex = domainIndex;
                neededPerformanceType = performanceIndex;
                neededAlpha = alpha;
                neededBeta = beta;
            }
        }
    }
        
    let similarDomain = {
        // region: domains[neededDomainIndex].performedDomains[neededPerformanceType],
        offsetX: domains[neededDomainIndex].offsetX,
        offsetY: domains[neededDomainIndex].offsetY,
        performanceType: neededPerformanceType,
        alpha: neededAlpha,
        beta: neededBeta
    };

    return similarDomain;
}


function findSimilarDomainAsSSIM(regionObject, domains) {
    let region = regionObject.matrix;
    let regionAverage = regionObject.average;

    let maxDistance = 0;
    let neededDomainIndex = 0;
    let neededPerformanceType = 0;

    const K1 = 0.01;
    const K2 = 0.03;

    const BITS_IN_CHANNEL = 8;
    const CHANNELS_COUNT = 3;
    const BITS_PER_PIXEL = CHANNELS_COUNT * BITS_IN_CHANNEL;

    const L = 2 ** BITS_PER_PIXEL - 1;

    const C1 = (K1 * L) ** 2;
    const C2 = (K2 * L) ** 2;

    for (let domainIndex = 0; domainIndex < domains.length; domainIndex++) {
        let performedDomains = domains[domainIndex].performedDomains;
        let domainAverage = domains[domainIndex].average;

        for (let performanceIndex = 0; performanceIndex < performedDomains.length; performanceIndex++) {
            let domain = performedDomains[performanceIndex];

            let covariance = 0; 
            let regionDispersion = 0; 
            let domainDispersion = 0;

            for (let i = 0; i < REGION_SIZE; i++) {
                for (let j = 0; j < REGION_SIZE; j++) {
                    let regionR = region[i][j][0];
                    let regionG = region[i][j][1];
                    let regionB = region[i][j][2];

                    let domainR = domain[i][j][0];
                    let domainG = domain[i][j][1];
                    let domainB = domain[i][j][2];

                    covariance += (regionR - regionAverage) * (domainR - domainAverage);
                    covariance += (regionG - regionAverage) * (domainG - domainAverage);
                    covariance += (regionB - regionAverage) * (domainB - domainAverage);

                    regionDispersion += (regionR - regionAverage) ** 2;
                    regionDispersion += (regionG - regionAverage) ** 2;
                    regionDispersion += (regionB - regionAverage) ** 2;

                    domainDispersion += (domainR - domainAverage) ** 2;
                    domainDispersion += (domainG - domainAverage) ** 2;
                    domainDispersion += (domainB - domainAverage) ** 2;
                }
            }

            let numeratorDistance = (2 * regionAverage * domainAverage + C1) * (2 * covariance + C2);
            let denomeratorDistance = (regionAverage ** 2 + domainAverage ** 2 + C1) * (regionDispersion + domainDispersion + C2);
            let distance = numeratorDistance / denomeratorDistance;

            if (distance > maxDistance) {
                maxDistance = distance;
                neededDomainIndex = domainIndex;
                neededPerformanceType = performanceIndex;
            }
        }
    }
        
    let similarDomain = {
        // region: domains[neededDomainIndex].performedDomains[neededPerformanceType],
        offsetX: domains[neededDomainIndex].offsetX,
        offsetY: domains[neededDomainIndex].offsetY,
        performanceType: neededPerformanceType,
        alpha: 1,
        beta: 0
    };

    return similarDomain;
}


function findSimilarDomainAsSSIMWithSimilarityCoefficients(regionObject, domains) {
    let region = regionObject.matrix;
    let regionAverage = regionObject.average;

    let maxDistance = 0;
    let neededDomainIndex = 0;
    let neededPerformanceType = 0;
    let neededAlpha = 0;
    let neededBeta = 0;

    const K1 = 0.01;
    const K2 = 0.03;

    const BITS_IN_CHANNEL = 8;
    const CHANNELS_COUNT = 3;
    const BITS_PER_PIXEL = CHANNELS_COUNT * BITS_IN_CHANNEL;

    const L = 2 ** BITS_PER_PIXEL - 1;

    const C1 = (K1 * L) ** 2;
    const C2 = (K2 * L) ** 2;

    for (let domainIndex = 0; domainIndex < domains.length; domainIndex++) {
        let performedDomains = domains[domainIndex].performedDomains;
        let domainAverage = domains[domainIndex].average;

        for (let performanceIndex = 0; performanceIndex < performedDomains.length; performanceIndex++) {
            let domain = performedDomains[performanceIndex];

            let sumR = 0;
            let sumD = 0;
            let sumRD = 0;
            let sumD2 = 0;
            
            let covariance = 0; 
            let regionDispersion = 0; 
            let domainDispersion = 0;

            for (let i = 0; i < REGION_SIZE; i++) {
                for (let j = 0; j < REGION_SIZE; j++) {
                    let regionR = region[i][j][0];
                    let regionG = region[i][j][1];
                    let regionB = region[i][j][2];

                    let domainR = domain[i][j][0];
                    let domainG = domain[i][j][1];
                    let domainB = domain[i][j][2];

                    sumR += regionR + regionG + regionB;
                    sumD += domainR + domainG + domainB;
                    sumRD += regionR * domainR + regionG * domainG + regionB * domainB;
                    sumD2 += domainR ** 2 + domainG ** 2 + domainB ** 2;

                    covariance += (regionR - regionAverage) * (domainR - domainAverage);
                    covariance += (regionG - regionAverage) * (domainG - domainAverage);
                    covariance += (regionB - regionAverage) * (domainB - domainAverage);

                    regionDispersion += (regionR - regionAverage) ** 2;
                    regionDispersion += (regionG - regionAverage) ** 2;
                    regionDispersion += (regionB - regionAverage) ** 2;

                    domainDispersion += (domainR - domainAverage) ** 2;
                    domainDispersion += (domainG - domainAverage) ** 2;
                    domainDispersion += (domainB - domainAverage) ** 2;
                }
            }

            let alpha = (PIXEL_CHANNELS * sumRD - sumR * sumD) / (PIXEL_CHANNELS * sumD2 - sumD ** 2);
            let beta = (sumR - alpha * sumD) / PIXEL_CHANNELS;

            let numeratorDistance = (2 * regionAverage * domainAverage + C1) * (2 * covariance + C2);
            let denomeratorDistance = (regionAverage ** 2 + domainAverage ** 2 + C1) * (regionDispersion + domainDispersion + C2);
            let distance = numeratorDistance / denomeratorDistance;

            if (distance > maxDistance) {
                maxDistance = distance;
                neededDomainIndex = domainIndex;
                neededPerformanceType = performanceIndex;
                neededAlpha = alpha;
                neededBeta = beta;
            }
        }
    }
        
    let similarDomain = {
        // region: domains[neededDomainIndex].performedDomains[neededPerformanceType],
        offsetX: domains[neededDomainIndex].offsetX,
        offsetY: domains[neededDomainIndex].offsetY,
        performanceType: neededPerformanceType,
        alpha: neededAlpha,
        beta: neededBeta
    };

    return similarDomain;
}
