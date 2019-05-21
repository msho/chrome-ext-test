console.log('wwwwwhaaat??!?');
locationHasChanged();

document.body.addEventListener("load", locationHasChanged)// on load

window.addEventListener('hashchange', locationHasChanged); //url hash has changed

function locationHasChanged() {
    window.taskDetailTries = 0;

    if (location.hash && location.hash.indexOf('taskdetail/') > 0) {
        whenTaskDetailReady().then(isReady => {
            console.log(`is task-detail ready: ${isReady}`);
            chrome.runtime.sendMessage({ type: 'action-icon', isTaskDetail: isReady });
        });
    } else {
        console.log(`is task-detail ready: false`);
        chrome.runtime.sendMessage({ isTaskDetail: false });
    }

} //locationHasChanged

function whenTaskDetailReady() {
    return new Promise(resolve => {
        if (window.taskDetailTries++ > 3) {
            // not task detail - return false
            resolve(false);
            return;
        }

        console.log(`trying to determine if task-detail ready ${window.taskDetailTries} times`)
        
        if (Scraper.isLabelFieldExist('Owner')) {
            // inside task details
            resolve(true);
        } else {
            setTimeout(whenTaskDetailReady, 300);
        }

    }); //Promise
} //whenTaskDetailReady