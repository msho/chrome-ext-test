// TODO: choose browserAction/ page action
chrome.runtime.onInstalled.addListener(function () {
  chrome.browserAction.hide();
  

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    
    // disable/enable action
    request.isTaskDetail? chrome.pageAction.show() : chrome.pageAction.hide();
    
  }); //on message
  
  // not working??
  chrome.pageAction.onClicked.addListener(function () {
    console.log('ok');
  });

  /* consider use function from web page that tells you that you are ready inorder to show/hide icon */
  /*function onWebNav(details) {
    var refIndex = details.url.indexOf('#');
    var strFragment = refIndex >= 0 ? details.url.slice(refIndex+1) : '';
    console.log(strFragment);
    if (strFragment.indexOf('taskdetail/') == 0) { // Starts with taskdetail/? show page action
        chrome.pageAction.show(details.tabId);
    } else {
        chrome.pageAction.hide(details.tabId);
    }
  }

  var filter = {
    url: [{
        hostEquals: 'projects.zoho.com'
    }]
  };

  chrome.webNavigation.onCommitted.addListener(onWebNav, filter);
  chrome.webNavigation.onHistoryStateUpdated.addListener(onWebNav, filter);
  chrome.webNavigation.onReferenceFragmentUpdated.addListener(onWebNav, filter);
  */
}); //onInstalled
