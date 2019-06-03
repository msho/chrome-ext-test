(async function() {

	function getFromStorage(key){
		return new Promise(r => {
	      chrome.storage.sync.get(key, (item) => r(item[key]));
    	});
	}
	
  function getPortalUrl() {
	  return getFromStorage('portalUrl');
    /*return new Promise(r => {
      chrome.storage.sync.get('portalUrl', (portalUrl) => r(portalUrl['portalUrl']));
    });*/
  }
  var Data = {};

  Data.portalUrl = await getPortalUrl();
  /*chrome.storage.sync.get('portalUrl', (portalUrl) =>
    Data.portalUrl = portalUrl['portalUrl']);*/

	Data.dicNamesMail = await getFromStorage('dicNamesMail');
	Data.dicNamesMail = Data.dicNamesMail || {};
  /*chrome.storage.sync.get('dicNamesMail', (dicNamesMail) =>
    Data.dicNamesMail = dicNamesMail['dicNamesMail'] || {});*/

  async function isUrlForWsScraping() {
	  let urlsForWs = await getFromStorage('listen-urls');
	  
	  for (let urlHash of urlsForWs) {
	  	if (location.hash.indexOf(urlHash) > 0)
			return true;
	  }
	  return false;
	  
    /*return location.hash.indexOf('todomilestones/') > 0 ||
      location.hash.indexOf('projectcalendar/') > 0 ||
      location.hash.indexOf('myworkcalendar') > 0 ||
      location.hash.indexOf('myclassic') > 0 ||
      location.hash.indexOf('tasklistdetail/') > 0*/
  }

  // Determine wether to listen to ws or not
  function isExDisabled() {

    return new Promise(resolve => {
      /*if (!isUrlForWsScraping())
        return resolve(true);
       ^ ^ ^ ^
      * * apperantly, the page is not refreshed, that said, 
      * * xhrOverrideScript is called only once at page load 
      * * so look for page location is not the correct way to go
      */

      // XHR listener is disdabled if extension is disabled, so reload is needed if extension is enabled again.
      chrome.storage.sync.get('isDisabled',
        isDisabled => resolve(isDisabled['isDisabled'])
      ); //get isDisabled from storage
    }); // return new Promise
  } // isDisabled

  function handleExDisabled() {
    //listen if EX is enabled again
    console.log('disabled for xhr listening');
    Data.isFirstTimeDisabled = true;
  } // handleExDisabled

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

    //handle disabled from menu events
    if (request.event === 'disabled-from-menu')
      onDisabledFromMenuChanged(request.data);

    // handle url change (portal-url happend when url changed)
    else if (request.event === 'portal-url')
      onUrlChanged();


  }); // on message from BG

  function enableCallingScrapeData(showLogs) {
    if (showLogs)
      console.log('enable scrape XHR WS data');
	  
	// remove old XHR requests
	  var responseContainingEle = document.getElementById('__interceptedData');
	if (responseContainingEle)
		document.body.removeChild(responseContainingEle);
	
    Data.isCallingScrapeData = true;
    requestIdleCallback(scrapeData);
  }
  function onUrlChanged() {
    // url is ok for scraping
    if (Data.isCallingScrapeData === false && isUrlForWsScraping() && !Data.disableFromMenu) {
      enableCallingScrapeData(true);
    }
  }

  function onDisabledFromMenuChanged(isDisabled) {
    // if script is not injected due to disabled ex (and user enable it)
    if (Data.isFirstTimeDisabled && !isDisabled && !Data.isRefreshMessageShown) {
      // it is enabled! tell user to refresh if he want it to sync calendar again
      /*displayMessage('For syncing newly created Zoho-tasks from this page to Google Cleandar<br /> one must refresh the page', 'warning', 10000);*/
      alert('For syncing newly created Zoho-tasks from this page to Google Cleandar\n one must refresh the page');
      Data.isRefreshMessageShown = true;
    }

    // if ex was disabled and now enabled -> enable call scrapeData again
    if (Data.isCallingScrapeData === false && !isDisabled) {	
      enableCallingScrapeData(true);
    }

    Data.disableFromMenu = isDisabled;
  } // onDisabledFromMenuChanged

/*
  var displayMessage = displayMessage || function (msg, type, msStay) {
    let domMsg = document.createElement('div');
    let height = 30;
    let alertsCount = document.getElementsByClassName('sync-alert').length;
    let bgColor = (type === 'error') ? '#F08080' : '#90EE90'
    height = 2 * height * alertsCount + height;

    domMsg.setAttribute('class', 'sync-alert');
    domMsg.style = `position:fixed;left: 130px; top: ${height}px;background-color: ${bgColor};padding: 10px; height: 30px;z-index:99999;`
    domMsg.innerHTML = msg;

    document.body.appendChild(domMsg);
    setTimeout(() => document.body.removeChild(domMsg), msStay || 5000);
  }
*/
	
  async function interceptData() {
    let isDisabled = await isExDisabled();
    if (isDisabled) {
      // if EX(tension) disabled, do not listen to ws. 
      // if enabled again, tell client to refresh in order to listen to ws again
      return handleExDisabled();
    }

    var xhrOverrideScript = document.createElement('script');
    xhrOverrideScript.type = 'text/javascript';
    xhrOverrideScript.innerHTML = `
    (function() {
      console.log('creating xhr script listener');
      var XHR = XMLHttpRequest.prototype;
      var send = XHR.send;
      var open = XHR.open;
      XHR.open = function(method, url) {
          this.url = url; // the request url
          return open.apply(this, arguments);
      }
      XHR.send = function() {
          this.addEventListener('load', function() {

            if (this.url=== '/${Data.portalUrl}/addcalendartask.do') {
                  console.log('found addcalendartask.do');

                  var dataDOMElement = document.createElement('div');
                  dataDOMElement.id = '__interceptedData';
                  dataDOMElement.innerText = this.response;
                  dataDOMElement.style.height = 0;
                  dataDOMElement.style.overflow = 'hidden';
                  document.body.appendChild(dataDOMElement);
              }               
          });
          return send.apply(this, arguments);
      };
    })();
    `
    document.head.prepend(xhrOverrideScript);
  }

  function checkForDOM() {
    if (document.body && document.head) {
      interceptData();
    } else {
      requestIdleCallback(checkForDOM);
    }
  }
  requestIdleCallback(checkForDOM);

  function scrapeData() {

    Data.isCallingScrapeData = false;

    var responseContainingEle = document.getElementById('__interceptedData');
    if (!responseContainingEle)
      return finishScrape();

    var resp = JSON.parse(responseContainingEle.innerHTML);
    if (resp[0]) {
      resp = resp[0]
    } else if (!resp.TYPE || resp.TYPE !== 'task') {
      return finishScrape(responseContainingEle);
    }

    console.log('yeahjjjjjjjjjjjjjj');

    var objRet;

    if (resp.TASKS && resp.TASKS[0] && resp.TASKS[0].TASKS)
      objRet = XhrScrapper.getTaskFromTasks(resp.TASKS[0]);

    else if (resp.GANTTTASK)
      objRet = XhrScrapper.getTaskFromGan(resp.GANTTTASK);
    else if (resp.ID)
      objRet = XhrScrapper.getTaskFromSimple(resp);

    else //objRet not valid
      return finishScrape(responseContainingEle);

    if (!objRet.taskListName)
      objRet.taskListName = resp.TLISTNAME;

    if (!objRet.url)
      objRet.url = `https://projects.zoho.com/${Data.portalUrl}#taskdetail/${resp.PID}/${resp.NEXT}/${resp.ADDEDTODOTASK}`;

    // send message to BG! apply google calendar API!
    if (objRet.startDate && objRet.startDate.length > 1 && objRet.dueDate.trim('-') && objRet.usersEmail) {
      chrome.runtime.sendMessage({ type: 'changed-dom', data: objRet });
    }

    //TODO: Tell bg to look if next page is valid? (and store task id if not in url). maybe chage url and add id if needed
    console.log(window.location.href);
    //pushState({},'',objRet.url);

    return finishScrape(responseContainingEle);

  } // scrapeData

  function finishScrape(responseContainingEle) {

    if (!Data.disableFromMenu && isUrlForWsScraping()) { 
		// if URL ok and enbaled, continue to listen to scrapping data
      enableCallingScrapeData();
    
	} else {
		// if URL not ok or extension disabled, stop to listen to scrapping data (and remove the last XHR request data)
		if (responseContainingEle) {
			document.body.removeChild(responseContainingEle);
		}
		
      console.log('disable scrape XHR WS data');
    }
  } // finishScrape

  Data.isCallingScrapeData = true;
  requestIdleCallback(scrapeData);

  var XhrScrapper = function () {

    function getDicIdToUser() {
      var dicIdUser = {};
      var options = document.querySelectorAll('select#personresponsible option ');

      for (let o of options) {
        let username = o.getAttribute('title');
        let id = o.getAttribute('value') || o.innerText;

        if (username && id)
          dicIdUser[id] = username;
      }

      return dicIdUser;
    }

    function getUsersByNames(strNames) {
      // strNames is csv names
      if (!strNames || !strNames.split)
        return null;

      var arrEmails = [];
      var arrNames = strNames.split(', ');
      //get names from ExStorage.get('dicNamesMail');

      for (let strUsername of arrNames) {

        let email = getEmailByUsername(strUsername.trim());

        if (email)
          arrEmails.push(email);
      }

      return arrEmails;
    }

    function getEmailByUsername(strUsername) {
      let email = Data.dicNamesMail[strUsername];
      if (!email) {
        email = getEmailFromClient(strUsername);
      }
      return email;
    }

    function getUsersByIds(arrIds) {
      var emails = [];

      var dicIdToUser = getDicIdToUser();

      for (let id of arrIds) {
        var user = dicIdToUser[id];

        if (!user || !user.trim)
          continue;

        let email = getEmailByUsername(user.trim());
        if (email)
          emails.push(email);
      }

      return emails;
    }

    function getProjectName() {
      let domProjNameSibling = document.getElementById('menumoretabs');
      if (!domProjNameSibling)
        return '';

      return domProjNameSibling.nextElementSibling.innerText;
    }

    function convertTimeStringToIso(strDate) {
      /**
       * @param strDate in format year,month,day,hour,minutes
       * @return date string format dd/MM/yyyy hh:mm
       */
      if (!strDate || !strDate.split)
        return null;

      arrDate = strDate.split(',');
      if (strDate.length !== 5)
        return null;

      return arrDate[2] + '/' + arrDate[1] + arrDate[0] + ' ' + arrDate[3] + ':' + arrDate[4];
    }

    function convertTimeToIso(dateNum) {
      /**
       * @param dateNum in iso number
       * @return date string format dd/MM/yyyy hh:mm
       */
      var date = new Date(dateNum);
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      var day = date.getDate();
      var hour = date.getHours();
      var minutes = date.getMinutes();

      if (month < 10)
        month = '0' + month;
      if (day < 10)
        day = '0' + day;
      if (hour < 10)
        hour = '0' + hour;
      if (minutes < 10)
        minutes = '0' + minutes;

      return `${day}/${month}/${year} ${hour}:${minutes}`;

    }

    function getTaskListName() {
      var domTaskListName = document.getElementById('tlistdispid');
      if (!domTaskListName || !domTaskListName.innerText)
        return '';

      var taskListName = domTaskListName.innerText;

      // remove last (list-name) from 'list-name (list-name)';
      var startIndex = taskListName.lastIndexOf(' (');
      if (startIndex > 0)
        taskListName = taskListName.substring(0, startIndex);

      return taskListName;
    }

    function getTaskFromTasks(tsk) {
      return {
        title: tsk.TTITLE,
        startDate: tsk.TASKS[2],
        dueDate: tsk.TASKS[3],
        usersEmail: getUsersByNames(tsk.TOWNER), // csv names
        projectName: getProjectName()
      };
    }

    function getTaskFromGan(tsk) {
      return {
        title: tsk.name,
        startDate: convertTimeStringToIso(tsk.STARTDATE), // year,month,day,hour,minutes
        dueDate: convertTimeStringToIso(tsk.ENDDATE),  // year,month,day,hour,minutes
        usersEmail: getUsersByNames(tsk.OWNERS), // csv names
        projectName: getProjectName()
      };
    }

    function getTaskFromSimple(tsk) {

      return {
        title: tsk.TITLE,
        startDate: tsk.COMPSD,
        dueDate: tsk.COMPED,
        usersEmail: getUsersByIds(tsk.OWNER), // OWNER is array of ids
        projectName: tsk.PROJNAME,
        url: `https://projects.zoho.com/${Data.portalUrl}#taskdetail/${tsk.PROJID}/${tsk.PARENTID}/${tsk.ID}`,
        taskListName: getTaskListName()
      };
    }

    return {
      getTaskFromGan: getTaskFromGan,
      getTaskFromTasks: getTaskFromTasks,
      getTaskFromSimple: getTaskFromSimple
    };

  }(); // XhrScraper

  function getEmailFromClient(strUsername) {
    //get email from user
    if (!strUsername || strUsername === 'Unassigned')
      return '';

    var email = prompt(`Please enter email of ${strUsername}`);
    if (!email)
      return '';

    // add email to storage
    Data.dicNamesMail[strUsername] = email;
    chrome.storage.sync.set({ dicNamesMail: Data.dicNamesMail });

    return email;
  }
  
})();