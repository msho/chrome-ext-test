function save_options() {
    var portalUrl = document.getElementById('portal-url').value;
    ExStorage.set('portal-url', portalUrl);


    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function () {
        status.textContent = '';
    }, 1250);

} //save options

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
async function restore_options() {
    // Use default value color = 'red' and likesColor = true.
    let portalUrl = await ExStorage.get('portal-url');
    document.getElementById('portal-url').value = portalUrl;

}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
