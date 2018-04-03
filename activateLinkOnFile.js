"use strict";

// OK
// Скачивание данных для интерполяции как JSON-файл
function activateLinkOnFile(data) {
    let dataAsString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));

    let linkOnFile = document.getElementById("compressedImage__downloadData");
    linkOnFile.setAttribute("href", dataAsString);
    linkOnFile.setAttribute("download", "data5.json");

    linkOnFile.style.display = "block";
}
