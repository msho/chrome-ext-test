let initDomData, changedDomData;

function getCurrentTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      return resolve(tabs[0]);
    }); //tabs.query

  }); //new Promise
} // getCurrentTab

async function showHideActionIcon(isToShow, tabId) {
  await ExStorage.setHidden(!isToShow);

  chooseIcon(tabId);
} // showHideActionIcon

async function chooseIcon(tabId) {
  let iconEnabled = !(await ExStorage.isDisabled()) && !(await ExStorage.isHidden());
  if (!tabId) tabId = (await getCurrentTab()).id;

  if (iconEnabled) {
    console.log('showing icon');
    chrome.pageAction.show(tabId);

    // display enabled icon
    chrome.pageAction.setIcon({
      tabId: tabId,
      path: "images/get_started128.png"
    });

    // if webRequest missing listener, add it 
    if (!chrome.webRequest.onCompleted.hasListenr(onWebRequestCompleted)) {
      chrome.webRequest.onCompleted.addListener(onWebRequestCompleted);
    }

  } else {
    // hide icon
    console.log('hiding icon');
    chrome.pageAction.hide(tabId);

    //set icon to appear disabled
    chrome.pageAction.setIcon({
      tabId: tabId,
      path: "images/get_started128_disabled.png"
    });

    
    // if webRequest has listener, add it 
    if (chrome.webRequest.onCompleted.hasListenr(onWebRequestCompleted)) {
      chrome.webRequest.onCompleted.removeListener(onWebRequestCompleted);
    }
    // TODO: check listenr and rules if works ://///!!!!!!!!!!!!!!!!!!!!!!!!!
  }
}

async function menuDisableEnable(sender, tab) {
  //get isDisabled from cache
  let isDisabled = await ExStorage.isDisabled();

  //set isDisabled to !isDisabled
  await ExStorage.setDisabled(!isDisabled);

  //update menu menuItemDisable title 
  let menuTitle = 'Enable me';
  if (isDisabled) menuTitle = 'Disable me';

  chrome.contextMenus.update('menuItemDisable', { title: menuTitle });

  chooseIcon(tab && tab.id);
} // menuDisableEnable

chrome.runtime.onInstalled.addListener(function () {

  // extension is enabled by default
  ExStorage.setDisabled(false);
  ExStorage.setHidden(false);

  // create a context button where you can disable google sync
  chrome.contextMenus.create({
    title: "Disable me",
    id: "menuItemDisable",
    contexts: ["page_action"],
    onclick: menuDisableEnable
  });
}); //onInstalled

/*chrome.pageAction.onClicked.addListener(function (sender) {
  console.log('click ok');
  console.log(sender.tab);
}); //action icon clicked*/

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

function onWebRequestCompleted(details){

  // send message to content script that the dom has been updated.
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    
    chrome.tabs.sendMessage(tabs[0].id, { event: "task-updated" }, async function (domData) {
      if (!domData || !domData.startDate || !domData.dueDate) {
        console.error('no data recieved from dom')
        return;
      }

      console.log('recieved data from dom');
      console.log(domData);
      changedDomData = domData;

      //Gcalendar.Requests.Getters.calendarList
      let gEvent = await Gcalendar.Requests.Getters.event(changedDomData.userEmail, changedDomData.url);

      // check if calendar event exist
      if (gEvent === null) {
        // event not found, create a new one
        Gcalendar.Setters.createEvent(changedDomData);
      } else if (gEvent) {
        // update current event
        Gcalendar.Setters.updateEvent(gEvent, changedDomData);
      } else {
        //some error
        console.error('wierd response from google api');

      } //if calendar event exist?

    }); //send message to tab
  }); //get current tab

}

chrome.webRequest.onCompleted.addListener(onWebRequestCompleted, {
    urls: ["https://projects.zoho.com/portal/grseeconsulting/updateaction.do"],
    types: ["xmlhttprequest"],
  }); //webRequest done
