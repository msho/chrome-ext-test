
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
}); //onInstalled

chrome.pageAction.onClicked.addListener(function () {
  console.log('ok');
  // TODO: get start-date, due-date, title, progect-name, user-email from 'message'

  /*TODO: implemant :****
  ** 1. domInit - from message, when page is loaded, get from scraping the start-date, due-date, title, progect-name, user-email (and url from sender?)
  ** 2. domChanged - append event to date and when changed, send message with domChanged new event data.
  ** 3. Implament Gcalendar.Requests.Getters.event(userEmail, domInit.url)
  ** 4. Implament Gcalendar.Setters.createEvent(userEmail, domChanged)
  ** 5. Implament Gcalendar.Setters.updateEvent(userEmail, domChanged)
*/
  //Gcalendar.Requests.Getters.calendarList
  let gEvent = Gcalendar.Requests.Getters.event(userEmail, domInit.url);
  if (gEvent === null) {
    Gcalendar.Setters.createEvent(userEmail, domChanged);
  } else {
    Gcalendar.Setters.updateEvent(userEmail, domChanged);
  }
}); //action icon clicked

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

  if (!request) {
    console.log('give me something I can work with...');
    return;
  }

  if (request.type === 'action-icon') {
    // disable/enable action
    showHideActionIcon(request.isTaskDetail, sender.tab.id);

  } else if (request.type === 'init-dom') {
    //get dom original data

  } else if (request.type === 'changed-dom') {
    //get dom updated data

  } else {
    console.log(`Wierd request ${request.type}`)

  } // unkown request type

}); //on message

chrome.webRequest.onCompleted.addListener(function (details) {
  console.log(details)

  // send message to content script that the dom has been updated.
}, {
  urls:["https://projects.zoho.com/portal/grseeconsulting/updateaction.do"], 
  types: ["xmlhttprequest"]
}); //webRequest done
