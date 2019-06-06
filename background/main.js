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

  // urls that can add new task and need to listen to the xhr requests at them
  ExStorage.set('listen-urls', [
    'tasklistdetail',
    'myclassic',
    'myworkcalendar',
    'projectcalendar',
    'todomilestones'
  ]);

  // url that can edit task
  ExStorage.set('task-page', 'taskdetail/');

  // when click on extension icon and ext tells its ready..
  ExStorage.set('ready-messages', ['I\'m enabled and ready to sync m\'lord']);

}); //onInstalled

chrome.pageAction.onClicked.addListener(async function (sender) {
  if (await ExStorage.isHidden() || await ExStorage.isDisabled()) {
    console.log('?');
    return;
  }

  let arrMessages = await ExStorage.get('ready-messages');
  let strMessage = arrMessages[Math.floor(Math.random() * arrMessages.length)];
  sendMessageToDom({ event: 'alert', text: strMessage }, undefined, sender.tabId);
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
    // get dom original data
    initDomData = request.data;

  } else if (request.type === 'changed-dom') {
    // get dom updated data
    callGcalendarApi(request.data)

  } else if (request.type === 'remove-task') {
    // user clicked on remove task
    removeFromGcalendar(request.data.usersEmail, request.data);

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

  sendMessageToDom({ 'event': 'disabled-from-menu', data: !isDisabled }, null, tab && tab.id);

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

function findRemovedOwners(currentData, initData) {
  if (!initData || !initData.usersEmail || !initData.usersEmail.length)
    return null;

  // return all emails that were at init-data but removed from current-data
  return initData.usersEmail.filter(e =>
    !currentData.usersEmail.includes(e)
  );
}

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

    let usersToRemove = findRemovedOwners(domData, initDomData);
    initDomData = domData;

    console.log('recieved data from dom');
    console.log(domData);

    callGcalendarApi(domData, usersToRemove)


  }); // sendMessageToDom
} // onWebRequestCompleted

async function callGcalendarApi(domData, usersToRemove) {
  /**
   * Search for event in the Google Calendar,
   * * if found, edit it, otherwise, create new Google Caledar event
   */
  changedDomData = domData;

  if (!changedDomData.url || !changedDomData.startDate || changedDomData.startDate.length < 2 || !changedDomData.dueDate) {
    console.log('not enough data for google calledar');
    return;
  }

  for (let userEmail of changedDomData.usersEmail) {
    
    // get Google-Calendar event
    let gEvent = await getGoogleEvent(userEmail, changedDomData);

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
  } // for each user owner

  removeFromGcalendar(usersToRemove, changedDomData);

} // callGcalendarApi

async function removeFromGcalendar(usersToRemove, data) {
  if (!usersToRemove || !usersToRemove.length)
    return;

  for (let emailToRemove of usersToRemove) {

    // get G-calendar event 
    let gEventToRemove = await getGoogleEvent(emailToRemove, data);

    // found an event, remove it.
    if (gEventToRemove) {
      Gcalendar.Setters.removeEvent(emailToRemove, gEventToRemove);

    } else {
      console.log(`did not found this event ${data.url} at ${emailToRemove}. Cannot remove event`);
    }

  } //for each user owner to remove 
}

function getGoogleEvent(email, data) {
  if (!email) {
    console.log('not enough data for google calledar');
    return '';
  }

  //Gcalendar.Requests.Getters.calendarList
  return Gcalendar.Requests.Getters.event(email, data.url);
}
