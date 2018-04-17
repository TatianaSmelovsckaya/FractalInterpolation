"use strict";

// OK
// Скачивание данных для интерполяции как JSON-файл
function activateLinkOnFile(data) {
    let dataAsString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));

    let filename = FILE_NAME + "_" + REGION_SIZE + "_" + METRIC_NUMBER + ".json";

    let linkOnFile = document.getElementById("selectors__downloadData");
    linkOnFile.setAttribute("href", dataAsString);
    linkOnFile.setAttribute("download", filename);

    linkOnFile.style.display = "block";
}
