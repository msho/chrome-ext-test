function arrToTextArea(arr) {
	return arr.filter(i => i.trim('\r ').length > 0).join('\n');
}

function getArrFromText(str) {
	return str.split('\n').filter(i => i.trim('\r ').length > 0);
}

function save_options() {

	// portal url
	let portalUrl = document.getElementById('portal-url').value;
	ExStorage.set('portal-url', portalUrl);

	// listen urls
	let xhrUrls = getArrFromText(document.getElementById('xhr-urls').value);
	ExStorage.set('listen-urls', xhrUrls);

	// edit task url
	let editTask = document.getElementById('edit-task-url').value;
	ExStorage.set('task-page', editTask);

	// ready messages
	let readyText = getArrFromText(document.getElementById('ready-text').value);
	ExStorage.set('ready-messages', readyText);

	var status = document.getElementById('status');
	status.textContent = 'Options saved.';
	setTimeout(function () {
		status.textContent = '';
	}, 1250);

} //save options

async function restore_options() {
	// portal url
	let portalUrl = await ExStorage.get('portal-url');
	document.getElementById('portal-url').value = portalUrl;

	// listen urls
	let arrXhrUrls = await ExStorage.get('listen-urls');
	document.getElementById('xhr-urls').value = arrToTextArea(arrXhrUrls);

	// edit task url
	let editUrl = await ExStorage.get('task-page');
	document.getElementById('edit-task-url').value = editUrl;

	// ready messages
	let arrReadyText = await ExStorage.get('ready-messages');
	document.getElementById('ready-text').value = arrToTextArea(arrReadyText);


}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);

document.getElementById('easter-egg').addEventListener('dblclick', () => { document.getElementById('more-options').style.display = 'block' });
