class Scraper {
    static isLabelFieldExist(strLabelText) {
        return Scraper.getLabelField(strLabelText) !== null;
    } // isLabelFieldExist

    static getLabelField(strLabelText) {
        let domLabels = document.querySelectorAll('#ntdetid .dt-field-label');
        for (let domLabel of domLabels) {
            if (domLabel.innerText.trim() === strLabelText)
                return domLabel;
        }

        // not found
        return null;
    } // getLabelField

    static async getEventUrl() {
        let url = window.location.href;
        if (url.indexOf('taskdetail/'))
            return url;

        // url has not updated correctly - zoho bug

        // task id
        let taskId = Scraper.getTaskId();

        //proj id
        let projId = Scraper.getProjectId();
        if (!projId)
            return null;
        
        // taskList id
        let taskListId = Scraper.getTaskListId();
        if (!taskListId)
            return null;

        let portalUrl = await ExStorage.get('portalUrl');
        let taskdetailPage = await ExStorage.get('task-page');
        
        return `https://projects.zoho.com/${portalUrl}#${taskdetailPage}${projId}/${taskListId}/${taskId}`;
    }

    static getTaskId(){
        let secTaskId = document.getElementById('task_cust_fields').firstElementChild.id;
        if (!secTaskId)
            return null;

        return secTaskId.substring('sec-'.length, secTaskId.length);
    }

    static async getDomData() {
        return {
            url: await Scraper.getEventUrl(),
            title: Scraper.getTitle(),
            startDate: Scraper.getStartDate(),
            dueDate: Scraper.getDueDate(),
            usersEmail: Scraper.getUsersEmail(),
            projectName: Scraper.getProjectName(),
            taskListName: Scraper.getTaskListName()
        };
    }

    static isElementIdExist(strId) {
        return document.getElementById(strId) !== null;
    }

    static getProjectId() {
        let urlHash = window.location.href;
        if (!urlHash)
            return null;

        let arrHash = location.hash.split('/');
        if (arrHash.length < 2)
            return null;

        return arrHash[1];
    }

    static getTaskListId() {
        let urlHash = window.location.href;
        if (!urlHash)
            return null;

        let arrHash = location.hash.split('/');
        if (arrHash.length < 3)
            return null;

        return arrHash[2];
    }

    static getProjNameFromId() {
        if (typeof glProjList === 'undefined' || !glProjList.length)
            return null; // could not find proj-list

        let projId = Scraper.getProjectId();
        if (!projId)
            return null; // could not find proj id

        for (let arrProj of glProjList) {
            if (arrProj[0] === projId)
                return arrProj[1]; // found proj id, return its name
        }

        // could not find proj in glProjList
        return null;
    }

    static getTaskListFromDisplay() {
        let domTaskList = document.getElementById('ltndisp');
        if (!domTaskList)
            return null;

        let strTaskListName = domTaskList.innerHTML;
        if (!strTaskListName)
            return null;

        // strTaskListName could look like 'projName&nbsp;(external)
        let infoIndex = strTaskListName.lastIndexOf('&nbsp;');
        if (infoIndex === -1)
            return strTaskListName;

        return strTaskListName.substring(0, infoIndex);
    }

    static getTaskListFromListActive() {
        let arrDomtaskList = document.getElementsByClassName('list-name active');
        if (!arrDomtaskList || !arrDomtaskList.length)
            return null;

        return arrDomtaskList[0].innerText;
    }

    static getTaskListFromTaskInfo() {
        let arrDomTaskInfo = document.querySelectorAll('#tsk_info > div > div');
        if (arrDomTaskInfo.length < 3)
            return null;

        return arrDomTaskInfo[2].lastElementChild.innerText;
    }

    /* *** */

    static getProjectName() {

        // try get projName from task info
        let domProjName = document.querySelector('#tsk_info a');
        if (domProjName && domProjName.innerText)
            return domProjName.innerText;

        // nope, try to get project name from id
        let strProjName = Scraper.getProjNameFromId();
        if (strProjName)
            return strProjName;

        // failed, try get selected project
        domProjName = document.getElementsByClassName('topband_projsel');
        if (domProjName.length && domProjName[0].innerText && domProjName[0].innerText.trim() !== 'Home')
            return domProjName[0].innerText;

        // couldn't, try get it from more menu tabs..
        let domProjNameSibling = document.getElementById('menumoretabs');
        if (!domProjNameSibling)
            return '';

        return domProjNameSibling.nextElementSibling.innerText;
    }

    static getTaskListName() {
        return Scraper.getTaskListFromDisplay() ||
            Scraper.getTaskListFromListActive() ||
            Scraper.getTaskListFromTaskInfo() ||
            '';

    }
    static getUsersEmail() {
        let ownerNames = Scraper.getOwnerNames();
        if (!ownerNames || !ownerNames.split)
            return [];

        return Scraper.getUsersEmailsByName(ownerNames.split(', '));
    }

    static getTitle() {
        let domTitle = document.querySelector('.task-title .detail-tsktitle');
        if (!domTitle)
            return '';

        return domTitle.value || '';
    }

    static getStartDate() {
        return Scraper.getDateNextTo('Start Date');
    }
    static getDueDate() {
        return Scraper.getDateNextTo('Due Date');
    }

    /* *** */

    static getOwnerNames() {
        let domOwnerVal = Scraper.getValueFieldNextTo('Owner');
        if (!domOwnerVal)
            return '';

        domOwnerVal = domOwnerVal.firstElementChild || domOwnerVal;
        return domOwnerVal.getAttribute('data-towner');
    }

    static getUsersEmailsByName(arrUserNames) {
        var arrEmails = [];
        let dicUsers = Scraper.getAllUsers();

        for (let strUsername of arrUserNames) {
            if (strUsername === 'Me') {
                if (window.Utils) {
                    arrEmails.push(window.Utils.emailId);
                    continue;
                }
            }

            arrEmails.push(dicUsers[strUsername] || '');
        }
        return arrEmails;
    }

    static getAllUsers() {
        // Select element that contains all the users
        let domSelectUsers = document.getElementById('username');
        if (!domSelectUsers)
            return {};

        var dicUsers = {};
        for (let domUser of domSelectUsers.children) {
            // title contains username(email)
            let strTitle = Scraper.getTitleFromDomUser(domUser);

            // find out where is '('
            let startEmailIndex = strTitle.lastIndexOf('(');
            if (startEmailIndex < 2)
                continue;

            let username = strTitle.substring(0, startEmailIndex);
            let email = strTitle.substring(startEmailIndex + 1, strTitle.length - 1);
            dicUsers[username] = email;

        } // for each domSelectUsers

        ExStorage.set('dicNamesMail', dicUsers);
        return dicUsers;
    }

    static getTitleFromDomUser(domUser) {
        let strTitle = domUser.getAttribute('title');
        if (strTitle)
            return strTitle;

        if (domUser.firstElementChild && domUser.firstElementChild.getAttribute('title')) {
            // title inside element child
            return domUser.firstElementChild.getAttribute('title');
        }

        // no title found
        return '';

    }

    static getDateNextTo(strLabel) {
        let domVal = Scraper.getValueFieldNextTo(strLabel);
        if (!domVal) {
            return '';
        }
        let domInputVal = domVal.querySelector('input[type="text"]');
        if (!domInputVal) {
            console.log('Could not find input value of date ' + strLabel);
            return '';
        }

        return domInputVal.value || '';
    }

    static getValueFieldNextTo(strLabel) {
        let domLabel = Scraper.getLabelField(strLabel);
        if (!domLabel)
            return null;
        return domLabel.nextElementSibling;
    }

} // Scraper class