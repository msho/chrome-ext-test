console.log('wwwwwhaaat??!?');
locationHasChanged();

document.body.addEventListener("load", locationHasChanged)// on load

window.addEventListener('hashchange', locationHasChanged); //url hash has changed

function locationHasChanged() {
    window.taskDetailTries = 0;

    // I'm not sure im at task page yet
    onNotTaskPage();

    if (location.hash && location.hash.indexOf('taskdetail/') > 0) {

        waitTaskDetailReady().then(isReady => {
            if (isReady) 
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
    chrome.runtime.sendMessage({ isTaskDetail: false });
}

function onNotTaskPage() {
    console.log(`is task-detail ready: false`);
    chrome.runtime.sendMessage({ type: 'action-icon', isTaskDetail: false });
}

function waitTaskDetailReady() {
    return new Promise(resolve => {

        clearInterval(window.isReadyInterval);
        window.isReadyInterval = setInterval(() => {

            if (Scraper.isLabelFieldExist('Owner') && Scraper.isElementIdExist('username')) {
                // inside task details
                clearInterval(window.isReadyInterval);
                return resolve(true);
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