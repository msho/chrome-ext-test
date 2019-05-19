
function getCurrentTab() {
  return new Promise((resolve, reject) => {

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var currTab = tabs[0];
      if (currTab) {
        // tab found, return it
        resolve(currTab);
      } else {
        // exception!
        reject('no tab is active:(');
      }
    }); //tabs.query

  }); //new Promise
} //get current Tab function


function showHideActionIcon(isToShow, tabId) {

  /*
  var tabId = 0;
  try {
    tabId = (await getCurrentTab()).id;
  }
  catch (e) {
    console.log(e);
    return;
  }
*/
  if (isToShow) {
    console.log('showing icon');

    // enable icon
    chrome.pageAction.show(tabId);

    // display enabled icon
    chrome.pageAction.setIcon({
      tabId: tabId,
      path: "images/get_started128.png"
    });
  } else {
    console.log('hiding icon');
    // disable click event
    chrome.pageAction.hide(tabId);

    //set icon to appear disabled
    chrome.pageAction.setIcon({
      tabId: tabId,
      path: "images/get_started128_disabled.png"
    });
  }
}

chrome.runtime.onInstalled.addListener(function () {

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

    // disable/enable action
    showHideActionIcon(request.isTaskDetail, sender.tab.id);

  }); //on message

  // not working??
  chrome.pageAction.onClicked.addListener(function () {
    console.log('ok');
  }); //action icon clicked

}); //onInstalled
