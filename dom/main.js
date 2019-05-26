console.log('wwwwwhaaat??!?');
locationHasChanged();

function displayMessage(msg, type) {
    let domMsg = document.createElement('div');
    let height = 30;
    let alertsCount = document.getElementsByClassName('sync-alert').length;
    let bgColor = (type ==='error')? '#F08080' : '#90EE90'
    height = 2*height*alertsCount + height;

    domMsg.setAttribute('class','sync-alert');
    domMsg.style = `position:fixed;left: 130px; top: ${height}px;background-color: ${bgColor};padding: 10px; height: 30px;z-index:99999;`
    domMsg.innerHTML = msg;

    document.body.appendChild(domMsg);
    setTimeout(()=>document.body.removeChild(domMsg), 5000);
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
    else if (request.event ==='portal-url') {
        window.portalUrl = request.portalUrl;
        console.log(portalUrl);
    }

}); //onMessage from background

function locationHasChanged() {
    window.taskDetailTries = 0;

    // I'm not sure im at task page yet
    onNotTaskPage();

    if (location.hash && location.hash.indexOf('taskdetail/') > 0) {

        Promice.race[waitTaskDetailReady,waitCalendarActivityReady].then(isReady => {
            if (isReady ==='calendarAct')
                onCalendarReady(); //TODO:<-- 
                //need to listen to addcalendartask.do, get content and add event to url https://projects.zoho.com/${urlFromBg}#taskdetail/PROJID/PARENTID/ID
            else if (isReady === 'taskAct')
                onTaskReady();
            else
                onNotTaskPage();
        }); //task ready

    } else {
        onNotTaskPage();
    }

} //locationHasChanged

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

function waitCalendarActivityReady(){
    return new Promise(resolve => {

        clearInterval(window.isReadyClendarInterval);
        window.isReadyClendarInterval = setInterval(() => {

            if (Scraper.isElementIdExist('newmeeting') && Scraper.isElementIdExist('logtimecalidfrom')) {
                // inside task details
                clearInterval(window.isReadyClendarInterval);
                return resolve('calendarAct');
            }

            if (window.taskDetailTries++ > 10) {
                // not task detail - return false
                clearInterval(window.isReadyClendarInterval);
                return resolve(false);
            }

            console.log(`waiting for task to be ready ${window.taskDetailTries} times`);

        }, 200); // setInterval

    }); //Promise
} //waitCalendarActivityReady

function waitTaskDetailReady() {
    return new Promise(resolve => {

        clearInterval(window.isReadyInterval);
        window.isReadyInterval = setInterval(() => {

            if (Scraper.isLabelFieldExist('Owner') && Scraper.isElementIdExist('username')) {
                // inside task details
                clearInterval(window.isReadyInterval);
                return resolve('taskAct');
            }

            if (window.taskDetailTries++ > 10) {
                // not task detail - return false
                clearInterval(window.isReadyInterval);
                return resolve(false);
            }

            console.log(`waiting for task to be ready ${window.taskDetailTries} times`);

        }, 200); // setInterval

    }); //Promise
} //whenTaskDetailReady