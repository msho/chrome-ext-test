console.log('wwwwwhaaat??!?');
locationHasChanged();

document.body.addEventListener("load", locationHasChanged)// on load

window.addEventListener('hashchange', locationHasChanged); //url hash has changed

function locationHasChanged() {
    window.taskDetailTries = 0;

    if (location.hash && location.hash.indexOf('taskdetail/') > 0) {
        chrome.runtime.sendMessage({ type: 'action-icon', isTaskDetail: false });
        whenTaskDetailReady().then(isReady => {
            console.log(`is task-detail ready: ${isReady}`);
            chrome.runtime.sendMessage({ type: 'action-icon', isTaskDetail: isReady });

            let domInit = Scraper.getDomData();
            console.log(domInit);
        } //task ready
        ).catch(exp => {console.log(exp)});
    } else {
        console.log(`is task-detail ready: false`);
        chrome.runtime.sendMessage({ isTaskDetail: false });
    }

} //locationHasChanged

function whenTaskDetailReady() {
    return new Promise(resolve => {

        clearInterval(window.isReadyInterval);
        window.isReadyInterval = setInterval(() => {
            console.log(`waiting for task to be ready ${window.taskDetailTries} times`);

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

        }, 300);
        
        /*if (Scraper.isLabelFieldExist('Owner') && Scraper.isElementIdExist('username')) {
            // inside task details
            resolve(true);
        } else {
            setTimeout(whenTaskDetailReady, 800);
        }*/

    }); //Promise
} //whenTaskDetailReady