locationHasChanged();

var displayMessage = displayMessage || function (msg, type) {
    let domMsg = document.createElement('div');
    let height = 30;
    let alertsCount = document.getElementsByClassName('sync-alert').length;
    let bgColor = (type === 'error') ? '#F08080' : '#90EE90'
    height = 2 * height * alertsCount + height;

    domMsg.setAttribute('class', 'sync-alert');
    domMsg.style = `position:fixed;left: 130px; top: ${height}px;background-color: ${bgColor};padding: 10px; height: 30px;z-index:99999;`
    domMsg.innerHTML = msg;

    document.body.appendChild(domMsg);
    setTimeout(() => document.body.removeChild(domMsg), 5000);
}

document.body.addEventListener("load", locationHasChanged)// on load

//window.addEventListener('hashchange', function () { setTimeout(locationHasChanged, 201); }); //url hash has changed
window.addEventListener('hashchange', locationHasChanged); //url hash has changed

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

    if (request.event === 'alert') {
        displayMessage(request.text, request.type);

    } else if (request.event === 'task-updated') {
        setTimeout(async function () {
            let domData = await Scraper.getDomData();
            sendResponse(domData);
        }, 300);

        // tells the background reciever that a response would be sent.
        return true;
    }
    else if (request.event === 'portal-url') {
        chrome.storage.sync.set({ portalUrl: request.portalUrl });

    }

}); //onMessage from background

async function locationHasChanged() {

    // I'm not sure im at task page yet
    onNotTaskPage();
    if (window.ExCal)
        clearIntervals();

    window.ExCal = { calendarActTries: 0, taskActTries: 0 };

    let arrHashListenUrls = await ExStorage.get('listen-urls');
    let strHashTask = await ExStorage.get('task-page');

    if (location.hash && (
        location.hash.indexOf(strHashTask) > 0 ||
        arrHashListenUrls.some(it => { return location.hash.indexOf(it) > 0 })
    )
    ) {

        Promise.race(
            [waitActivityReady(isInCalcPage, 'calendarAct'),
            waitActivityReady(isInTaskPage, 'taskAct')]
        ).then(isReady => {

            if (isReady === 'calendarAct')
                onCalendarReady();

            else if (isReady === 'taskAct')
                onTaskReady();

            else if (isReady === 'race won')
                console.log('race won, you have an hacker mister');

            else
                onNotTaskPage();
        }); //task ready

    }

} //locationHasChanged

function onCalendarReady() {
    console.log(`is calendar ready: true`);
    chrome.runtime.sendMessage({ type: 'action-icon', isTaskDetail: true });

    //handleRemoveFromCalendar();
}

async function onTaskReady() {
    console.log(`is task-detail ready: true`);
    chrome.runtime.sendMessage({ type: 'action-icon', isTaskDetail: true });

    let domInit = await Scraper.getDomData();
    console.log(domInit);
    chrome.runtime.sendMessage({ type: 'init-dom', data: domInit });

    //if delete is pressed, send delete to server
    let domDelete = document.querySelector('div.posrel[onclick*=del]');
    if (!domDelete)
        return;

}

function onNotTaskPage() {
    console.log(`is task-detail ready: false`);
    chrome.runtime.sendMessage({ type: 'action-icon', isTaskDetail: false });
}

function clearIntervals() {
    for (let iKey in window.ExCal) {
        if (iKey.startsWith('isReady'))
            clearInterval(window.ExCal[iKey]);
    }
}

function waitActivityReady(func, strResOk) {

    let intervalKey = 'isReady' + strResOk;

    return new Promise(resolve => {

        clearInterval(window.ExCal[intervalKey]);
        window.ExCal[intervalKey] = setInterval(() => {

            if (window.ExCal.isRaceWon === true) {
                // already found what I was looking for at another function

                // clear intervals
                clearIntervals();

                return resolve('race won');
            }

            func().then(function (isReady) {
                if (isReady) {
                    // inside activity details
                    clearInterval(window.ExCal[intervalKey]);
                    resolve(strResOk);
                    window.ExCal.isRaceWon = true;
                    return;

                }

                if (window.ExCal[strResOk + 'Tries']++ > 10) {
                    // not task detail - return false
                    clearInterval(window.ExCal[intervalKey]);
                    return resolve(false);
                }

                console.log(`waiting for task to be ready ${window.ExCal[strResOk + 'Tries']} times`);
            });

        }, 200); // setInterval

    }); //Promise
} // waitActivityReady

async function isInCalcPage() {
    //return Scraper.isElementIdExist('newmeeting') && Scraper.isElementIdExist('logtimecalidfrom');
    let arrHashListenUrls = await ExStorage.get('listen-urls');

    return location.hash &&
        arrHashListenUrls.some(it => { return location.hash.indexOf(it) > 0 });

}
async function isInTaskPage() {
    return Scraper.isLabelFieldExist('Owner') && Scraper.isElementIdExist('username');
}