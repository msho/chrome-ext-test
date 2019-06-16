class ExStorage {
	static get(id) {
		return new Promise(res => {
			chrome.storage.sync.get(id, data => res(data[id]));
		});

	}

	static set(id, val) {
		var setObj = {};
		setObj[id] = val;
		return new Promise(res => {
			chrome.storage.sync.set(setObj, () => res(true));
		});
	} //ExStorage.set

	static async createTasksObj() {
		// create tasks object if not exist

		let tasks = await ExStorage.get('tasks')
		if (!tasks)
			ExStorage.set('tasks', {});
	}// createTasksObj

	static async addOrUpdateTask(objTask) {

		// get task id
		let taskId = StorageHelper.getTaskId(objTask)
		if (taskId === null)
			return null; // could not find task id

		// get tasks from storage
		let tasks = await ExStorage.get('tasks');

		//set task
		tasks[taskId] = objTask;
		ExStorage.set('tasks', tasks);

	}

	static async deleteTask(taskId) {
		// get tasks from storage
		let tasks = await ExStorage.get('tasks');

		// remove task from storage if exist
		if (taskId in tasks)
			delete tasks[taskId];

	} // addOrUpdateTask

	static async getTask(taskId) {
		let tasks = await ExStorage.get('tasks');

		return tasks[taskId];
	}

	static async isDisabled() {
		return await ExStorage.get('isDisabled');
	}

	static async setDisabled(isDisabled) {
		await ExStorage.set('isDisabled', isDisabled);
	}

	//hidden extention, disabled by code and dims the icon
	static async setHidden(isHidden) {
		await ExStorage.set('isHidden', isHidden);
	}

	static async isHidden() {
		return await ExStorage.get('isHidden');
	}
} // ExStorage

class StorageHelper {
	static getTaskId(objTask) {
		let url = objTask.url;
		if (!url || url.indexOf('#') < 1)
			return null; // bad objTask url

		let hash = url.substring(url.indexOf('#'));
		let arrHash = hash.split('/');
		if (arrHash.legth < 3)
			return null; // bad objTask url

		return arrHash[1] + arrHash[3]; //projId + taskId
	}
} // StorageHelper 