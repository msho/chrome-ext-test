function xhrWithAuth(method, url, body, callback) {
    var access_token;

    var retry = true;

    getToken();

    function getToken() {
        chrome.identity.getAuthToken({ interactive: true }, function (token) {
            if (chrome.runtime.lastError) {
                callback('error', chrome.runtime.lastError);
                return;
            }

            access_token = token;
            requestStart();
        });
    }

    function requestStart() {
        var xhr = new XMLHttpRequest();

        xhr.open(method, url);
        xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = requestComplete;

        if (body)
            xhr.send(body);
        else
            xhr.send();
    }

    function requestComplete() {
        if (this.status == 401 && retry) {
            retry = false;
            chrome.identity.removeCachedAuthToken({ token: access_token },
                getToken);
        } else {
            callback(this.status, this.response, method);
        }
    }
} //xhrWithAuth

let Gcalendar = {
    Requests: {
        Getters: {
            event: function (email, url) {
                //search event with url and return it
                console.log(`searching for event with ${url}...`);

                return new Promise(res => {
                    xhrWithAuth(
                        'GET',
                        `https://www.googleapis.com/calendar/v3/calendars/${email}/events?q=${encodeURIComponent(url)}`,
                        null, // no body
                        function (status, response) {
                            //resolve function
                            return res(Gcalendar.Responses.event(status, response));
                        }); //xhrWithAuth
                }); //Promise
                //return null if not found
            }, //Gtters.event

            calendarList: function () {
                console.log(`getting all user calendars...`);
				return new Promise(res => {
                xhrWithAuth(
                    'GET',
                    'https://www.googleapis.com/calendar/v3/users/me/calendarList',
                    null, // no body
                    function(status,response) {
						//resolve function
						return res(Gcalendar.Responses.calenderList(status, response));
					}); // xhrWithAuth
				}); // Promise
            } // Getters.calendarList

        }   // Getters
    }, // Gcalendar.Requests

    Setters: {
        updateEvent: function (gEvent, data, userEmail) {
            console.log('updating G event...');

            let newData = JSON.parse(JSON.stringify(data));
            newData.userEmail = userEmail;

            xhrWithAuth(
                'put',
                `https://www.googleapis.com/calendar/v3/calendars/${newData.userEmail}/events/${gEvent.id}`,
                Gcalendar.Helper.convertDomDataToGevent(newData),
                Gcalendar.Responses.default);
        }, // Setters.updateEvent

        createEvent: function (data, userEmail) {
            console.log('creating new G event...');

            let newData = JSON.parse(JSON.stringify(data));
            newData.userEmail = userEmail;

            xhrWithAuth(
                'post',
                `https://www.googleapis.com/calendar/v3/calendars/${newData.userEmail}/events`,
                Gcalendar.Helper.convertDomDataToGevent(newData),
                Gcalendar.Responses.default);
        }, // Setters.create event

        removeEvent: function (emailToRemove, gEvent) {
            console.log('removing an event from ' + emailToRemove);

            xhrWithAuth(
                'delete',
                `https://www.googleapis.com/calendar/v3/calendars/${emailToRemove}/events/${gEvent.id}`,
                null, //no body
                Gcalendar.Responses.default);
        } // Setters.removeEvent

    }, //Gcalendar.Setters

    Responses: {
		calenderList: function (status, response) {
			if (status < 200 || status > 300) {
				console.error(`error: ${status} \n ${response}`);
				sendMessageToDom({
					event: 'alert', type: 'error',
					text: `Error from G-Calendar:  ${status}<div> ${response} </div>`
				});
				return;
			} // if error
			
			if (response) {
				let objResp = JSON.parse(response);
				console.log('response from google calendar api: ');
				console.log(objResp);
				return objResp.items.map(i=> i.id); // return array of emails
			}
		}, // Responses.calenderList
		
        event: function (status, response) {

            if (!response)
                return null;

            handleResponseStatus(status, 'get-event', response);
            if (status !== 200) {
                return; //undefiend;
            }

            let objResp = JSON.parse(response);

            if (!objResp.items || !objResp.items.length)
                return null;

            // return last item
            return objResp.items[objResp.items.length - 1];
        }, // Responses.event

        default: function (status, response, method) {
            var type = '';
            if (method === 'put')
                type = 'updated'
            else if (method === 'post')
                type = 'created';
            else if (method === 'delete')
                type = 'removed';

            handleResponseStatus(status, type, response);
            return; //undefiend;
        } // Responses.default

    }, // Gcalendar.Responses

    Helper: {
        convertDomDataToGevent: function (domData) {
            let eventTitle = `${domData.title} - ${domData.taskListName} - ${domData.projectName}`;
            let eventDesc = `Event from Zoho\n${eventTitle}\n${domData.url}`;
            let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
            gEevent = {
                "start": {
                    "dateTime": Gcalendar.Helper.convertDate(domData.startDate),
                    "timeZone": timeZone
                },
                "end": {
                    "dateTime": Gcalendar.Helper.convertDate(domData.dueDate),
                    "timeZone": timeZone
                },
                "summary": eventTitle,
                "description": eventDesc,
                "attendees": domData.usersEmail.map((e) => { return { "email": e }; })
            };
            return JSON.stringify(gEevent);
        }, //Helper.convertDomDataToGevent

        convertDate: function (strDateTime) {
            /***
             * @desc Convert string date dd/MM/yyyy hh:mm into google calendar date (toISOString)
             * @param strDateTime the date-time string to convert
             */
            if (!strDateTime) {
                return new Date().toISOString();
            }
            let arrDate = strDateTime.split('/');
            if (arrDate.length !== 3) {
                console.error('bad format date ' + strDateTime);
                return new Date().toISOString();
            }
            let arrYearTime = arrDate[2].split(' ');
            let arrTime = arrYearTime[1].split(':');

            let dateDay = Number(arrDate[0]);
            let dateMonth = Number(arrDate[1]);

            let dateYear = Number(arrYearTime[0]);

            let dateHour = Number(arrTime[0]);
            let dateMin = Number(arrTime[1]);

            try {
                let gDate = new Date();
                gDate.setFullYear(dateYear, dateMonth - 1, dateDay);
                gDate.setHours(dateHour, dateMin);

                return gDate.toISOString();
            } catch (ex) {
                console.error('bad format date ' + strDateTime);
                return new Date().toISOString();
            }

        } // Helper.convertDate 

    } // Gcalendar.Helper
} // Gcalendar

function handleResponseStatus(status, type, resp) {

    if (status < 200 || status > 300) {
        console.error(`error: ${status} \n ${resp}`);
		
		if (type !== 'get-event')
			sendMessageToDom({
				event: 'alert', type: 'error',
				text: `Error from G-Calendar:  ${status}<div> ${resp} </div>`
			});
        return;
    }
    if (resp) {
        let objResp = JSON.parse(resp);
        console.log('response from google calendar api: ');
        console.log(objResp);
    }
    // Do not update dom if get-event feched successfully
    if (type === 'get-event')
        return;

    sendMessageToDom({
        event: 'alert',
        text: `Google Calendar ${type} an event successfully`
    });
} // handleResponseStatus
