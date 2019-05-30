console.log('wwwwwhaaat??!?');
locationHasChanged();

var displayMessage = displayMessage || function(msg, type) {
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

window.addEventListener('hashchange', locationHasChanged); //url hash has changed

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

    if (request.event === 'alert') {
        displayMessage(request.text, request.type);

    } else if (request.event === 'task-updated') {
        setTimeout(function () {
            sendResponse(Scraper.getDomData());
        }, 300);

        // tells the background reciever that a response would be sent.
        return true;
    }
    else if (request.event === 'portal-url') {
        chrome.storage.sync.set({ portalUrl: request.portalUrl });

    }

}); //onMessage from background

function locationHasChanged() {
    window.ExCal = {};

    // I'm not sure im at task page yet
    onNotTaskPage();

    if (location.hash && (
        location.hash.indexOf('taskdetail/') > 0 ||
        location.hash.indexOf('todomilestones/') > 0 ||
        location.hash.indexOf('projectcalendar/') > 0 ||
        location.hash.indexOf('myworkcalendar') > 0 ||
        location.hash.indexOf('myclassic') > 0
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
            else
                onNotTaskPage();
        }); //task ready

    } else {
        // onNotTaskPage();
    }

} //locationHasChanged

function onCalendarReady() {
    console.log(`is calendar ready: true`);
    chrome.runtime.sendMessage({ type: 'action-icon', isTaskDetail: true });
}

function onTaskReady() {
    console.log(`is task-detail ready: true`);
    chrome.runtime.sendMessage({ type: 'action-icon', isTaskDetail: true });

    let domInit = Scraper.getDomData();
    console.log(domInit);
    chrome.runtime.sendMessage({ type: 'init-dom', data: domInit });
}

function onNotTaskPage() {
    console.log(`is task-detail ready: false`);
    chrome.runtime.sendMessage({ type: 'action-icon', isTaskDetail: false });
}

function waitActivityReady(func, strResOk) {
    window.ExCal = window.ExCal || {};
    window.ExCal[strResOk + 'tries'] = window.ExCal[strResOk + 'tries'] || 0;

    let intervalKey = 'isReady' + strResOk;

    return new Promise(resolve => {

        clearInterval(window.ExCal[intervalKey]);
        window.ExCal[intervalKey] = setInterval(() => {

            if (window.ExCal.isRaceWon === true) {
                // already found what I was looking for at another function
                clearInterval(window.ExCal[intervalKey]);
                return resolve(false);
            }

            if (func()) {
                // inside activity details
                window.ExCal.isRaceWon = true;
                clearInterval(window.ExCal[intervalKey]);
                return resolve(strResOk);
            }

            if (window.ExCal[strResOk + 'tries']++ > 10) {
                // not task detail - return false
                clearInterval(window.ExCal[intervalKey]);
                return resolve(false);
            }

            console.log(`waiting for task to be ready ${window.ExCal[strResOk + 'tries']} times`);

        }, 200); // setInterval

    }); //Promise
} // waitActivityReady

function isInCalcPage() {
    //return Scraper.isElementIdExist('newmeeting') && Scraper.isElementIdExist('logtimecalidfrom');
    return location.hash.indexOf('projectcalendar/') > 0 ||
        location.hash.indexOf('myworkcalendar') > 0 ||
        location.hash.indexOf('myclassic') > 0
}
function isInTaskPage() {
    return Scraper.isLabelFieldExist('Owner') && Scraper.isElementIdExist('username');
}