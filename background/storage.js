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
            chrome.storage.sync.set(setObj, () =>res(true));
        });
    } //ExStorage.set

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

    static async isHidden(){
        return await ExStorage.get('isHidden');
    }
}