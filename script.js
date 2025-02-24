let selectedUrl = "";
let selectedResource = "";
let valueEnteredUrlInput = "";
let apiData = [];

document.addEventListener("DOMContentLoaded", function () {
    const select = document.getElementById("select_api");
    const button = document.getElementById("resource_btn");
    const listaRecursos = document.getElementById("listaRecursos");

    let apiData = [];

    // Cargar JSON desde un archivo
    fetch("./utils/models.json")
        .then(response => response.json())
        .then(data => {
            apiData = data.apis;

            data.apis.forEach(api => {
                const option = document.createElement("option");
                option.value = api.url;
                option.textContent = api.name;
                select.appendChild(option);
            });
        })
        .catch(error => console.error("Error cargando el JSON:", error));

    // Evento para mostrar recursos al hacer clic en el botón
    button.addEventListener("click", function () {
        const selectedApi = select.value;
        const api = apiData.find(api => api.url === selectedApi);

        if (!api) return;

        let resources = api.resources || [];

        if (resources.length === 0) {
            console.error("No hay recursos disponibles para esta API.");
        } else {
            listaRecursos.innerHTML = "";

            resources.forEach(resource => {
                let li = document.createElement("li");
                li.className = "list-group-item list-group-item-action";
                li.textContent = resource;
                li.style.cursor = "pointer";

                li.addEventListener("click", () => {
                    selectedResource = resource;
                    $("#recursoModal").modal("hide");
                });

                listaRecursos.appendChild(li);
            });

            // Mostrar el modal
            $("#recursoModal").modal("show");
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const selectApi = document.getElementById("select_api");
    const buttons = document.querySelectorAll("#copy_url, #show_url, #resource_btn");
    const consultBtn = document.querySelector("#consult_btn");
    const urlInput = document.querySelector("#url_input");

    function toggleActions() {
        const isSelectEmpty = selectApi.value === "";
        const isInputEmpty = urlInput.value.trim() === "";

        if (!isInputEmpty) {
            selectedUrl = "";
            selectedResource = "";
            valueEnteredUrlInput = urlInput.value;

            selectApi.disabled = true;
            buttons.forEach(button => button.disabled = true);
        } else if (!isSelectEmpty) {
            selectedUrl = selectApi.value;
            selectedResource = "";
            valueEnteredUrlInput = "";

            selectApi.disabled = false;
            urlInput.disabled = true;
            buttons.forEach(button => button.disabled = false);
        } else {
            selectApi.disabled = false;
            urlInput.disabled = false;
            buttons.forEach(button => button.disabled = true);
        }

        consultBtn.disabled = isSelectEmpty && isInputEmpty;
    }

    urlInput.addEventListener("input", toggleActions);
    selectApi.addEventListener("change", toggleActions);

    toggleActions();
});

function generateColumns(data) {
    const headTable = document.getElementById("headTable");
          headTable.innerHTML = "";

    const headRow = document.createElement("tr");

    // Obtener las claves del objeto
    Object.keys(data).forEach(key => {
        const th = document.createElement("th");
        th.textContent = key.charAt(0).toUpperCase() + key.slice(1);
        headRow.appendChild(th);
    });

    headTable.appendChild(headRow);
}

function loadDataTable(data) {
    const table = document.getElementById("dataTable");
          table.innerHTML = "";

    data.forEach(item => {
        const row = document.createElement("tr");

        Object.keys(item).forEach(key => {
            const td = document.createElement("td");

            if (key === "image") {
                const img = document.createElement("img");

                img.src = item[key];
                img.alt = item.name;
                img.width = 50;

                td.appendChild(img);
            } else if (typeof item[key] === "object" && item[key] !== null) {
                let entries = Object.entries(item[key]);

                if (entries.length <= 3) {
                    td.innerHTML = entries
                        .map(([subKey, subValue]) => `<div><strong>${subKey}:</strong> ${subValue}</div>`)
                        .join("");
                } else {
                    const textarea = document.createElement("textarea");

                    textarea.value = entries.map(([subKey, subValue]) => `${subKey}: ${subValue}`).join("\n");
                    textarea.disabled = true;

                    td.appendChild(textarea);
                }
            } else if (isValidDate(item[key])) {
                const fecha = new Date(item[key]);
                const fechaFormateada = fecha.toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                });

                td.textContent = fechaFormateada;
            } else {
                td.textContent = item[key];
            }

            row.appendChild(td);
        });

        table.appendChild(row);
    });
}

async function consult() {
    try {
        let fullUrl = selectedUrl + selectedResource || valueEnteredUrlInput;
        if (selectedUrl && !selectedResource) {
            showAlert("Para consultar, primero seleccione un recurso.");

            return;
        }

        openLoading();

        let res = await fetch(fullUrl);
        if (!res.ok) throw new Error(`Error en la consulta: ${res.status}`);

        const data = await res.json();

        if (Array.isArray(data.results)) {
            apiData = data.results;
        } else if (Array.isArray(data.data)) {
            apiData = data.data;
        } else {
            if (Array.isArray(data)) {
                apiData = data;
            } else {
                apiData = [data];
            }
        }

        if (apiData.length > 0) {

            if (valueEnteredUrlInput) {
                document.getElementById("toolbar_title").textContent = "Consulta por URL directa";
            } else if (selectedResource) {
                document.getElementById("toolbar_title").textContent = selectedResource;
            }
            
            generateColumns(apiData[0]); // Crear columnas dinámicas
            loadDataTable(apiData); // Llenar la tabla con datos

            showAsTable();
        }
    } catch (error) {
        console.error("Error al consultar la api:", error);
    } finally {
        Swal.close();
    }
}

function copyUrl() {
    let select = document.getElementById("select_api");
    let selectedValue = select.value;

    navigator.clipboard.writeText(selectedValue + selectedResource)
        .then(() => {
            showCopyUrlAlert();
        })
        .catch(err => console.error("Error al copiar:", err));
}

function showUrl() {
    let select = document.getElementById("select_api");
    let selectedValue = select.value;

    showAlert(selectedValue + selectedResource);
}

// Util functions

function isValidDate(value) {
    if (typeof value !== "string") return false;
    if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return false;

    const date = new Date(value);

    return !isNaN(date.getTime());
}

function showAsJSON() {
    const container = document.getElementById("dataContainer");
          container.innerHTML = `<pre>${JSON.stringify(apiData, null, 2)}</pre>`;
          container.style.display = "block";

    document.getElementById("allTable").style.display = "none";
}

function formatXML(xmlString) {
    let parser = new DOMParser();
    let xml = parser.parseFromString(xmlString, "application/xml");

    // Aplicar indentación con XSLT si está disponible
    let xslt = new DOMParser().parseFromString(
        `<?xml version="1.0"?>
        <xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
            <xsl:output method="xml" indent="yes"/>
            <xsl:template match="/">
                <xsl:copy-of select="."/>
            </xsl:template>
        </xsl:stylesheet>`,
        "application/xml"
    );

    let xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(xslt);
    let resultDocument = xsltProcessor.transformToDocument(xml);
    let formattedXml = new XMLSerializer().serializeToString(resultDocument);

    return formattedXml.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function showAsXML() {
    let jsonToXml = `<root>${apiData
        .map(obj => `<item>${Object.entries(obj)
            .map(([key, val]) => `<${key}>${val}</${key}>`)
            .join("")}</item>`)
        .join("")}</root>`;

    let container = document.getElementById("dataContainer");
        container.innerHTML = `<pre>${formatXML(jsonToXml)}</pre>`;
        container.style.display = "block";
    
    document.getElementById("allTable").style.display = "none";
}

function showAsTable() {
    document.getElementById("dataContainer").style.display = "none";
    document.getElementById("allTable").style.display = "table";
}

function downloadCSV() {
    let table = document.getElementById("allTable");
    let rows = table.querySelectorAll("tr");
    let csvContent = "";

    rows.forEach(row => {
        let cols = row.querySelectorAll("th, td");
        let rowData = [];

        cols.forEach(col => {
            let textarea = col.querySelector("textarea");
            let text = textarea ? textarea.value : col.innerText;

            text = text.replace(/"/g, '""');

            if (text.includes(",") || text.includes("\n")) {
                text = `"${text}"`;
            }

            rowData.push(text);
        });

        csvContent += rowData.join(",") + "\n";
    });

    let blob = new Blob([csvContent], { type: "text/csv" });
    let link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "tabla.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Alert messages
function showCopyUrlAlert() {
    Swal.fire({
        text: "🔗 URL compiada!",
        timer: 1000,
        width: "225px",
        showConfirmButton: false
    });
}

function showAlert(value) {
    Swal.fire({
        text: value,
        showConfirmButton: true,
        confirmButtonText: "OK",
        customClass: {
            confirmButton: 'btn-ok',
        }
    });
}

function openLoading() {
    let style = document.createElement("style");
        style.innerHTML = `
            .swal2-popup .swal2-loader {
                border-color: #85998d transparent #85998d transparent;
            }
        `;

    document.head.appendChild(style);

    Swal.fire({
        title: "Consultando api...",
        text: "Por favor espera",
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
}