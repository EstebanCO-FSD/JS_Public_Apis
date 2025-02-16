function copyUrl() {
    let select = document.getElementById("select_api");
    let selectedValue = select.value;

    navigator.clipboard.writeText(selectedValue)
        .then(() => {
            showCopyUrlAlert();
        })
        .catch(err => console.error("Error al copiar:", err));
}

function showUrl() {
    let select = document.getElementById("select_api");
    let selectedValue = select.value;

    showUrlAlert(selectedValue);
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

function showUrlAlert(value) {
    Swal.fire({
        icon: "info",
        text: value,
        showConfirmButton: true,
        confirmButtonText: "OK",
        customClass: {
            confirmButton: 'btn-ok',
            popup: 'small-icon'
        }
    });
}
