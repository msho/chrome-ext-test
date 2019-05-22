let initDomData, changedDomData;

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

chrome.pageAction.onClicked.addListener(function (sender) {
  console.log('click ok');
  console.log(sender.tab);
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
    initDomData = request.data;

  } else if (request.type === 'changed-dom') {
    //get dom updated data
    changedDomData = request.data;

  } else {
    // unkown request type
    console.log(`Wierd request ${request.type}`)
  }

}); //on message

chrome.webRequest.onCompleted.addListener(function (details) {
  console.log(details)

  // send message to content script that the dom has been updated.
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { event: "task-updated" }, async function (response) {
	  if (response && response.startDate && response.dueDate) {
        console.log(response);
		changedDomData = response;
		  
		// change google calendar
		/*TODO: implemant :****
  		** 3. Implament Gcalendar.Requests.Getters.event(userEmail, domInit.url)
  		** 4. Implament Gcalendar.Setters.createEvent(userEmail, domChanged)
  		** 5. Implament Gcalendar.Setters.updateEvent(userEmail, domChanged)
		*/
	    //Gcalendar.Requests.Getters.calendarList
	    let gEvent = await Gcalendar.Requests.Getters.event(changedDomData.userEmail, changedDomData.url);
		// check if calendar event exist
	    if (gEvent === null) {
			// event not found, create a new one
		  Gcalendar.Setters.createEvent(domChanged);
	    } else if (changedDomData.url === initDomData.url){
		  // update current event
		  Gcalendar.Setters.updateEvent(gEvent, changedDomData);
	    } else {
			// found an event. but im not sure that its the right one
			console.log(`I got messed up with the urls :( ${initDomData.url}, ${changedDomData.url}`);
		}
	  } //response not empty
	}); //send message to tab
  }); //get current tab
  
}, {
  urls: ["https://projects.zoho.com/portal/grseeconsulting/updateaction.do"],
  types: ["xmlhttprequest"]
}); //webRequest done
