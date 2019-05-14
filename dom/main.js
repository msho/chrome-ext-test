console.log('wwwwwhaaat??!?');

document.body.addEventListener("load", locationHasChanged)// on load

window.addEventListener('hashchange',locationHasChanged); //url hash has changed

function locationHasChanged(){
    window.taskDetailTries = 0;
    
    if (location.hash && location.hash.indexOf('taskdetail/') > 0) {
        whenTaskdetailReady().then(isReady=> {
            console.log(`is task-detail ready: ${isReady}`);
            chrome.runtime.sendMessage({isTaskDetail: isReady});
        });
    } else {
        chrome.runtime.sendMessage({isTaskDetail: false});
    }

} //locationHasChanged

function whenTaskdetailReady(){
    return new Promise(resolve=> {
        if (window.taskDetailTries++ > 3) {
            // not task detail - return false
            resolve(false);
        }

        console.log(`trying to determine if task-detail ready ${window.taskDetailTries} times`)

        let domTask = document.querySelector('#ntdetid .dt-field-label');
        if (domTask.innerText  === 'Owner') {
            // inside task details
            resolve(true);
        } else {
            setTimeout(whenTaskdetailReady, 200);
        }

    }); //Promise
} //whenTaskdetailReady