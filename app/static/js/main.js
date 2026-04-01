/* =============================================
   Bono Solidario — JavaScript global
   ============================================= */

document.addEventListener('DOMContentLoaded', function () {

    // --- Auto-cerrar alerts después de 4 segundos ---
    // (complementa el timeout de base.html por si acaso)
    document.querySelectorAll('.alert.fade.show').forEach(function (alertEl) {
        setTimeout(function () {
            try {
                bootstrap.Alert.getOrCreateInstance(alertEl).close();
            } catch (e) {
                alertEl.classList.remove('show');
                alertEl.remove();
            }
        }, 4000);
    });

    // --- Activar tooltips globalmente ---
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(function (el) {
        new bootstrap.Tooltip(el);
    });

    // --- Activar popovers globalmente ---
    document.querySelectorAll('[data-bs-toggle="popover"]').forEach(function (el) {
        new bootstrap.Popover(el);
    });

});
