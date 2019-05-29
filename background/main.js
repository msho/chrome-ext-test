let initDomData, changedDomData;

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

  ExStorage.set('portal-url', 'portal/grseeconsulting');
}); //onInstalled

chrome.pageAction.onClicked.addListener(async function (sender) {
  if (await ExStorage.isHidden() || await ExStorage.isDisabled()) {
    console.log('?');
    return;
  }

  console.log(sender.tab);
  sendMessageToDom({ event: 'alert', text: 'I\'m enabled and ready to sync m\'lord' }, undefined, sender.tabId);
});

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
    callGcalendarApi(request.data)
  } else {
    // unkown request type
    console.log(`Wierd request ${request.type}`)
  }

}); //on message

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {

  if (changeInfo.status === 'complete')
    sendMessageToDom({ 
      event: 'portal-url', portalUrl: await ExStorage.get('portal-url') 
    }, 
      null, tabId);
}); //on tabs updated

chrome.webRequest.onCompleted.addListener(onWebRequestCompleted, {
  urls: [`https://projects.zoho.com/*/updateaction.do`],
  types: ["xmlhttprequest"],
}); //webRequest done

function getCurrentTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      return resolve(tabs[0]);
    }); //tabs.query

  }); //new Promise
} // getCurrentTab

async function showHideActionIcon(isToShow, tabId) {
  await ExStorage.setHidden(!isToShow);

  disableActionButton(tabId);
} // showHideActionIcon

async function disableActionButton(tabId) {
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
    if (!chrome.webRequest.onCompleted.hasListener(onWebRequestCompleted)) {
      chrome.webRequest.onCompleted.addListener(onWebRequestCompleted,
        {
          urls: [`https://projects.zoho.com/*/updateaction.do`],
          types: ["xmlhttprequest"],
        });
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
    if (chrome.webRequest.onCompleted.hasListener(onWebRequestCompleted)) {
      chrome.webRequest.onCompleted.removeListener(onWebRequestCompleted);
    }
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

  disableActionButton(tab && tab.id);
} // menuDisableEnable

function sendMessageToDom(msg, cb, tabId) {
  if (tabId) {
    chrome.tabs.sendMessage(tabId, msg, cb);

  } else {
    // need to get tabId
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, msg, cb);
    });
  }
} // sendMessageToDom

function onWebRequestCompleted(details) {

  sendMessageToDom({ event: "task-updated" }, function (domData) {
    if (!domData || !domData.startDate || !domData.dueDate) {
      console.error('no data recieved from dom')
      return;
    }

    if (!domData.usersEmail || !domData.usersEmail.length) {
      console.error('no owners recieved from dom')
      return;
    }

    console.log('recieved data from dom');
    console.log(domData);

    callGcalendarApi(domData)

    
  }); // sendMessageToDom
} // onWebRequestCompleted

async function callGcalendarApi(domData){
  changedDomData = domData;

  for (let userEmail of changedDomData.usersEmail) {
    //Gcalendar.Requests.Getters.calendarList
    let gEvent = await Gcalendar.Requests.Getters.event(userEmail, changedDomData.url);

    // check if calendar event exist
    if (gEvent === null) {
      // event not found, create a new one
      Gcalendar.Setters.createEvent(changedDomData, userEmail);
    } else if (gEvent) {
      // update current event
      Gcalendar.Setters.updateEvent(gEvent, changedDomData, userEmail);
    } else {
      //some error
      console.error('weired response from google api: ');

    } // if calendar event exist?
}
}
