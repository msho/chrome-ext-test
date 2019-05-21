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
            title: Scraper.getTitle(),
            startDate: Scraper.getStartDate(),
            dueDate: Scraper.getDueDate(),
            userEmail: Scraper.getUserEmail(),
            //TODO:
            projectName: Scraper.getTaskListName()
        };
    }

    static isElementIdExist(strId) {
        return document.getElementById(strId) !== null;
    }

    /* *** */

    static getTaskListName() {
        return "TODO: //"
    }
    static getUserEmail() {
        let ownerName = Scraper.getOwnerName();
        return Scraper.getUserEmailByName(ownerName);
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

    static getOwnerName() {
        let domOwnerVal = Scraper.getValueFieldNextTo('Owner');
        if (!domOwnerVal)
            return '';

        domOwnerVal = domOwnerVal.firstElementChild || domOwnerVal;
        return domOwnerVal.getAttribute('data-towner');
    }

    static getUserEmailByName(strUsername) {
        if (strUsername === 'Me') {
            if (window.Utils) {
                return window.Utils.emailId;
            }
        }

        let dicUsers = Scraper.getAllUsers();
        return dicUsers[strUsername] || '';
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

            console.log(username + ' ' + email);

        } // for each domSelectUsers

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

/*
** 1. domInit - from message, when page is loaded, get from scraping the start-date, due-date, title, progect-name, user-email (and url from sender?)
  ** 2. domChanged - append event to date and when changed, send message with domChanged new event data.
  */