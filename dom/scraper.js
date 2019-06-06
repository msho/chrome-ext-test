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

    static getDomData() {
        return {
            url: window.location.href,
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

    /* *** */

    static getProjectName() {
		// try get selected project
		let domProjName = document.getElementsByClassName('topband_projsel');
		if (domProjName.length && domProjName[0].innerText)
			return domProjName[0].innerText;
		
		// couldn't, try get it from more menu tabs..
        let domProjNameSibling = document.getElementById('menumoretabs');
        if (!domProjNameSibling)
            return '';

        return domProjNameSibling.nextElementSibling.innerText;
    }

    static getTaskListName() {
        let domProjList = document.getElementById('ltndisp');
        if (!domProjList)
            return '';

        let strProjFullName = domProjList.innerHTML;
        if (!strProjFullName)
            return '';

        // strPojFullName could look like 'projName&nbsp;(external)
        let infoIndex = strProjFullName.lastIndexOf('&nbsp;');
        if (infoIndex === -1)
            return strProjFullName;

        return strProjFullName.substring(0, infoIndex);

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