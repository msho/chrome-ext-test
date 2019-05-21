let domInitData, domChangedData;

function showHideActionIcon(isToShow, tabId) {
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
    // hide icon
    console.log('hiding icon');

    // disable click event
    chrome.pageAction.hide(tabId);

    //set icon to appear disabled
    chrome.pageAction.setIcon({
      tabId: tabId,
      path: "images/get_started128_disabled.png"
    });
  }
} // showHideActionIcon

chrome.runtime.onInstalled.addListener(function () {
}); //onInstalled

chrome.pageAction.onClicked.addListener(function () {
  console.log('ok');

  /*TODO: implemant :****
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
    domInitData = request.data;

  } else if (request.type === 'changed-dom') {
    //get dom updated data
    domChangedData = request.data;

  } else {
    // unkown request type
    console.log(`Wierd request ${request.type}`)
  }

}); //on message

chrome.webRequest.onCompleted.addListener(function (details) {
  console.log(details)

  // send message to content script that the dom has been updated.
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { event: "task-updated" }, function (response) {
      console.log(response);
    });
  });
  
}, {
    urls: ["https://projects.zoho.com/portal/grseeconsulting/updateaction.do"],
    types: ["xmlhttprequest"]
  }); //webRequest done
