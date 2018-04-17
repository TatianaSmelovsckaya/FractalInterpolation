"use strict";


//  (!) Привести константу в порядок
let PIXEL_CHANNELS = 24 * PIXELS_IN_REGION;
let CHANNEL_COUNT = 3;


// OK
// Поиск похожего домена по Евклидовой метрике
let findSimilarDomainAsOLS = function (regionObject, domains) {
    // (!) Привести значение в порядок
    let minDistance = 2**34;

    let neededDomainIndex = 0;
    let neededPerformanceType = 0;

    let neededAlphas = [1,1,1];
    let neededBetas = [0,0,0];

    let region = regionObject.matrix;

    for (let domainIndex = 0; domainIndex < domains.length; domainIndex++) {
        let performedDomains = domains[domainIndex].performedDomains;

        for (let performanceIndex = 0; performanceIndex < performedDomains.length; performanceIndex++) {
            let domain = performedDomains[performanceIndex];

            let sumRegion = [0, 0, 0];
            let sumDomain = [0, 0, 0];
            let sumRegionDomain = [0, 0, 0];
            let sumDomainSquare = [0, 0, 0];

            let distance = 0;

            for (let i = 0; i < REGION_SIZE; i++) {
                for (let j = 0; j < REGION_SIZE; j++) {
                    let regionR = region[i][j][0];
                    let regionG = region[i][j][1];
                    let regionB = region[i][j][2];
                    let regionGray = Math.floor(0.299 * regionR + 0.587 * regionG + 0.184 * regionB);

                    let domainR = domain[i][j][0];
                    let domainG = domain[i][j][1];
                    let domainB = domain[i][j][2];
                    let domainGray = Math.floor(0.299 * domainR + 0.587 * domainG + 0.184 * domainB);

                    distance += (regionGray - domainGray) ** 2;

                    for (let channel = 0; channel < CHANNEL_COUNT; channel++) {
                        sumRegion[channel] += region[i][j][channel];
                        sumDomain[channel] += domain[i][j][channel];
                        sumRegionDomain[channel] += region[i][j][channel] * domain[i][j][channel];
                        sumDomainSquare[channel] += domain[i][j][channel] ** 2;
                    }
                }
            }

            let alphas = [];
            let betas = [];

            for (let channel = 0; channel < CHANNEL_COUNT; channel++) {
                let numeratorAlpha   = PIXELS_IN_REGION * sumRegionDomain[channel] - sumRegion[channel] * sumDomain[channel];
                let denomeratorAlpha = PIXELS_IN_REGION * sumDomainSquare[channel] - sumDomain[channel] ** 2;

                let alpha = (denomeratorAlpha === 0) ? 0 : numeratorAlpha / denomeratorAlpha;
                let beta = (sumRegion[channel] - alpha * sumDomain[channel]) / PIXELS_IN_REGION;

                alphas.push(alpha);
                betas.push(beta);
            }

            distance = Math.sqrt(distance);

            if (distance < minDistance) {
                minDistance = distance;
                neededDomainIndex = domainIndex;
                neededPerformanceType = performanceIndex;
                neededAlphas = alphas;
                neededBetas = betas;
            }
        }
    }

    return {
        offsetX: domains[neededDomainIndex].offsetX,
        offsetY: domains[neededDomainIndex].offsetY,
        performanceType: neededPerformanceType,
        alphas: neededAlphas,
        betas: neededBetas
    };
}

// (!) Не работает!!!
// Поиск похожего домена методом корреляции
let findSimilarDomainAsCorrelation = function (regionObject, domains) {
    let maxDistance = 0;

    let neededDomainIndex = 0;
    let neededPerformanceType = 0;

    let neededAlphas = [1,1,1];
    let neededBetas = [0,0,0];

    let region = regionObject.matrix;
    let regionAverage = regionObject.averages[3];
    let regionDispersion = regionObject.dispersions[3];

    for (let domainIndex = 0; domainIndex < domains.length; domainIndex++) {
        let performedDomains = domains[domainIndex].performedDomains;

        let domainAverage = domains[domainIndex].averages[3];
        let domainDispersion = domains[domainIndex].dispersions[3];

        for (let performanceIndex = 0; performanceIndex < performedDomains.length; performanceIndex++) {
            let domain = performedDomains[performanceIndex];

            let sumRegion = [0, 0, 0];
            let sumDomain = [0, 0, 0];
            let sumRegionDomain = [0, 0, 0];
            let sumDomainSquare = [0, 0, 0];

            let covariance = 0;

            for (let i = 0; i < REGION_SIZE; i++) {
                for (let j = 0; j < REGION_SIZE; j++) {
                    for (let channel = 0; channel < CHANNEL_COUNT; channel++) {
                        sumRegion[channel] += region[i][j][channel];
                        sumDomain[channel] += domain[i][j][channel];
                        sumRegionDomain[channel] += region[i][j][channel] * domain[i][j][channel];
                        sumDomainSquare[channel] += domain[i][j][channel] ** 2;

                        covariance += (region[i][j][channel] - regionAverage) * (domain[i][j][channel] - domainAverage);
                    }
                }
            }

            let alphas = [];
            let betas = [];

            for (let channel = 0; channel < CHANNEL_COUNT; channel++) {
                let numeratorAlpha   = PIXELS_IN_REGION * sumRegionDomain[channel] - sumRegion[channel] * sumDomain[channel];
                let denomeratorAlpha = PIXELS_IN_REGION * sumDomainSquare[channel] - sumDomain[channel] ** 2;

                let alpha = (denomeratorAlpha === 0) ? 0 : numeratorAlpha / denomeratorAlpha;
                let beta = (sumRegion[channel] - alpha * sumDomain[channel]) / PIXELS_IN_REGION;

                alphas.push(alpha);
                betas.push(beta);
            }

            let numeratorDistance = covariance / PIXELS_IN_REGION;
            let denomeratorDistance = Math.sqrt(regionDispersion * domainDispersion);
            let distance = (denomeratorDistance === 0) ? 0 : numeratorDistance / denomeratorDistance;

            if (Math.abs(distance) > Math.abs(maxDistance)) {
                maxDistance = distance;
                neededDomainIndex = domainIndex;
                neededPerformanceType = performanceIndex;
                neededAlphas = alphas;
                neededBetas = betas;
            } else if (Math.abs(distance) - Math.abs(maxDistance) === 0 ) {
                neededDomainIndex = domainIndex;
                neededPerformanceType = performanceIndex;
                neededAlphas = alphas;
                neededBetas = betas;
            }
        }
    }

    if (maxDistance === 0) {
        console.log(1);
    }

    return {
        offsetX: domains[neededDomainIndex].offsetX,
        offsetY: domains[neededDomainIndex].offsetY,
        performanceType: neededPerformanceType,
        alphas: neededAlphas,
        betas: neededBetas
    };
}

// OK
// Поиск похожего домена по метрике SSIM
let findSimilarDomainAsSSIM = function (regionObject, domains) {
    const K1 = 0.01;
    const K2 = 0.03;

    const BITS_PER_PIXEL = 8;
    const L = 2 ** BITS_PER_PIXEL - 1;

    const C1 = (K1 * L) ** 2;
    const C2 = (K2 * L) ** 2;
    
    let maxDistance = 0;

    let neededDomainIndex = 0;
    let neededPerformanceType = 0;

    let neededAlphas = [1,1,1];
    let neededBetas = [0,0,0];

    let region = regionObject.matrix;
    let regionAverage = regionObject.averages[3];
    let regionDispersion = regionObject.dispersions[3];

    for (let domainIndex = 0; domainIndex < domains.length; domainIndex++) {
        let performedDomains = domains[domainIndex].performedDomains;

        let domainAverage = domains[domainIndex].averages[3];
        let domainDispersion = domains[domainIndex].dispersions[3];

        for (let performanceIndex = 0; performanceIndex < performedDomains.length; performanceIndex++) {
            let domain = performedDomains[performanceIndex];

            let sumRegion = [0, 0, 0];
            let sumDomain = [0, 0, 0];
            let sumRegionDomain = [0, 0, 0];
            let sumDomainSquare = [0, 0, 0];

            let covariance = 0;

            for (let i = 0; i < REGION_SIZE; i++) {
                for (let j = 0; j < REGION_SIZE; j++) {
                    for (let channel = 0; channel < CHANNEL_COUNT; channel++) {
                        sumRegion[channel] += region[i][j][channel];
                        sumDomain[channel] += domain[i][j][channel];
                        sumRegionDomain[channel] += region[i][j][channel] * domain[i][j][channel];
                        sumDomainSquare[channel] += domain[i][j][channel] ** 2;

                        covariance += (region[i][j][channel] - regionAverage) * (domain[i][j][channel] - domainAverage);
                    }
                }
            }

            let alphas = [];
            let betas = [];

            for (let channel = 0; channel < CHANNEL_COUNT; channel++) {
                let numeratorAlpha   = PIXELS_IN_REGION * sumRegionDomain[channel] - sumRegion[channel] * sumDomain[channel];
                let denomeratorAlpha = PIXELS_IN_REGION * sumDomainSquare[channel] - sumDomain[channel] ** 2;

                let alpha = (denomeratorAlpha === 0) ? 0 : numeratorAlpha / denomeratorAlpha;
                let beta = (sumRegion[channel] - alpha * sumDomain[channel]) / PIXELS_IN_REGION;

                alphas.push(alpha);
                betas.push(beta);
            }

            covariance /= PIXELS_IN_REGION;

            let numeratorDistance = (2 * regionAverage * domainAverage + C1) * (2 * covariance + C2);
            let denomeratorDistance = (regionAverage ** 2 + domainAverage ** 2 + C1) * (regionDispersion + domainDispersion + C2);
            let distance = numeratorDistance / denomeratorDistance;

            if (distance > maxDistance) {
                maxDistance = distance;
                neededDomainIndex = domainIndex;
                neededPerformanceType = performanceIndex;
                neededAlphas = alphas;
                neededBetas = betas;
            }
        }
    }

    return {
        offsetX: domains[neededDomainIndex].offsetX,
        offsetY: domains[neededDomainIndex].offsetY,
        performanceType: neededPerformanceType,
        alphas: neededAlphas,
        betas: neededBetas
    };
}


let metricFunctions = [];
metricFunctions.push(findSimilarDomainAsOLS);
metricFunctions.push(findSimilarDomainAsCorrelation);
metricFunctions.push(findSimilarDomainAsSSIM);


// Поиск похожего домена для каждого региона
function findSimilarDomains(data, domains) {
    console.log();
    console.log("Поиск похожего домена - Старт");

    let similarDomains = [];

    let startTime = new Date();

    for (let regionIndex = 0; regionIndex < REGIONS_IN_IMAGE; regionIndex++) {
        let offsetX = regionIndex % REGIONS_IN_LINE;
        let offsetY  = Math.floor(regionIndex / REGIONS_IN_LINE);

        let regionMatrix = formMatrix(data, offsetX, offsetY, REGION_SIZE);
        let regionAverages = calculateAverages(regionMatrix);
        let regionDispersions = calculateDispersions(regionMatrix, regionAverages);

        let region = {
            matrix: regionMatrix,
            averages: regionAverages,
            dispersions: regionDispersions
        }

        // let similarDomain = {};

        // if (METRIC_NUMBER === 0) {
            // let similarDomain = findSimilarDomainAsOLS(region, domains);
            // similarDomains.push(similarDomain);
        // } else if (METRIC_NUMBER === 1) {
            // let similarDomain = findSimilarDomainAsSSIM(region, domains);
            // similarDomains.push(similarDomain);
        // } else {
            // let similarDomain = findSimilarDomainAsCorrelation(region, domains);
            // similarDomains.push(similarDomain);
        // }
        // let similarDomain = findSimilarDomainAsOLS(region, domains);
        // let similarDomain = findSimilarDomainAsCorrelation(region, domains);
        // let similarDomain = findSimilarDomainAsSSIM(region, domains);
        let similarDomain = metricFunctions[METRIC_NUMBER - 1](region, domains);

        similarDomains.push(similarDomain);


        


        //Ищем похожий домен с помощью коэффициента корреляции
        // let minDistance = 0;
        // let similarDomainIndex = 0;
        // let neededPerformanceIndex = 0;

        // for (let domainIndex = 0; domainIndex < allDomains.length; domainIndex++) {
            // let performedDomains = allDomains[domainIndex].performedDomains;
            // let domainAverage = allDomains[domainIndex].averages;

            // for (let performanceIndex = 0; performanceIndex < performedDomains.length; performanceIndex++) {
                // let domain = performedDomains[performanceIndex];
                // let distance = 0; 
                // let covariance = 0; 
                // let regionDispersion = 0; 
                // let domainDispersion = 0;

                // for (let i = 0; i < REGION_SIZE; i++) {
                    // for (let j = 0; j < REGION_SIZE; j++) {
                        // covariance += (region[i][j][0] - regionAverage) * (domain[i][j][0] - domainAverage);
                        // covariance += (region[i][j][1] - regionAverage) * (domain[i][j][1] - domainAverage);
                        // covariance += (region[i][j][2] - regionAverage) * (domain[i][j][2] - domainAverage);

                        // regionDispersion += (region[i][j][0] - regionAverage)**2;
                        // regionDispersion += (region[i][j][1] - regionAverage)**2;
                        // regionDispersion += (region[i][j][2] - regionAverage)**2;

                        // domainDispersion += (domain[i][j][0] - domainAverage)**2;
                        // domainDispersion += (domain[i][j][1] - domainAverage)**2;
                        // domainDispersion += (domain[i][j][2] - domainAverage)**2;
                    // }
                // }

                // if (regionDispersion === 0 || domainDispersion === 0) {
                    // console.log(1);
                // }

                // distance = covariance / Math.sqrt(regionDispersion * domainDispersion);

                // if (Math.abs(distance) > Math.abs(minDistance)) {
                    // minDistance = distance;
                    // similarDomainIndex = domainIndex;
                    // neededPerformanceIndex = performanceIndex;
                // }
            // }
        // }

        // changedRegions.push({
            // region: allDomains[similarDomainIndex].performedDomains[neededPerformanceIndex],
            // offsetX: allDomains[similarDomainIndex].offsetX,
            // offsetY: allDomains[similarDomainIndex].offsetY,
            // performanceType: neededPerformanceIndex
        // });


        // let minDistance = 0;
        // let similarDomainIndex = 0;
        // let neededPerformanceIndex = 0;
        // let neededAlpha = 0;
        // let neededBeta = 0;

        // for (let domainIndex = 0; domainIndex < allDomains.length; domainIndex++) {
            // let performedDomains = allDomains[domainIndex].performedDomains;
            // let domainAverage = allDomains[domainIndex].averages;

            // for (let performanceIndex = 0; performanceIndex < performedDomains.length; performanceIndex++) {
                // let domain = performedDomains[performanceIndex];

                // let covariance = 0; 
                // let regionDispersion = 0; 
                // let domainDispersion = 0;

                // let sumR = 0;
                // let sumD = 0;
                // let sumRD = 0;
                // let sumD2 = 0;

                // for (let i = 0; i < REGION_SIZE; i++) {
                    // for (let j = 0; j < REGION_SIZE; j++) {
                        // let regionR = region[i][j][0];
                        // let regionG = region[i][j][1];
                        // let regionB = region[i][j][2];

                        // let domainR = domain[i][j][0];
                        // let domainG = domain[i][j][1];
                        // let domainB = domain[i][j][2];

                        // sumR += regionR + regionG + regionB;
                        // sumD += domainR + domainG + domainB;
                        // sumRD += regionR * domainR + regionG * domainG + regionB * domainB;
                        // sumD2 += domainR**2 + domainG**2 + domainB**2;
                        
                        // covariance += (regionR - regionAverage) * (domainR - domainAverage);
                        // covariance += (regionG - regionAverage) * (domainG - domainAverage);
                        // covariance += (regionB - regionAverage) * (domainB - domainAverage);

                        // regionDispersion += (regionR - regionAverage)**2;
                        // regionDispersion += (regionG - regionAverage)**2;
                        // regionDispersion += (regionB - regionAverage)**2;

                        // domainDispersion += (domainR - domainAverage)**2;
                        // domainDispersion += (domainG - domainAverage)**2;
                        // domainDispersion += (domainB - domainAverage)**2;
                    // }
                // }

                // let alpha = (PIXEL_CHANNELS * sumRD - sumR * sumD) / (PIXEL_CHANNELS * sumD2 - sumD**2);
                // let beta = (sumR - alpha * sumD) / PIXEL_CHANNELS;

                // let distance = covariance / Math.sqrt(regionDispersion * domainDispersion);

                // if (Math.abs(distance) > Math.abs(minDistance)) {
                    // minDistance = distance;
                    // similarDomainIndex = domainIndex;
                    // neededPerformanceIndex = performanceIndex;
                    // neededAlpha = alpha;
                    // neededBeta = beta;
                // }
            // }
        // }
        
        
        
    }

    let finishTime = new Date();
    let completionTimeAsSeconds = (finishTime - startTime) / 1000;

    console.log("Поиск похожего домена - Финиш");
    console.log("Время исполения: " + completionTimeAsSeconds + " секунд");

    return similarDomains;
}
