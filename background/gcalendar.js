function xhrWithAuth(method, url, interactive, callback) {
    var access_token;

    var retry = true;

    getToken();

    function getToken() {
        chrome.identity.getAuthToken({ interactive: interactive }, function (token) {
            if (chrome.runtime.lastError) {
                callback(chrome.runtime.lastError);
                return;
            }

            access_token = token;
            requestStart();
        });
    }

    function requestStart() {
        console.log(access_token);
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
        xhr.onload = requestComplete;
        xhr.send();
    }

    function requestComplete() {
        if (this.status == 401 && retry) {
            retry = false;
            chrome.identity.removeCachedAuthToken({ token: access_token },
                getToken);
        } else {
            callback(this.status, this.response);
        }
    }
} //xhrWithAuth
/*
  		** 4. Implament Gcalendar.Setters.createEvent(userEmail, domChanged)
  		** 5. Implament Gcalendar.Setters.updateEvent(userEmail, domChanged)
*/
let Gcalendar = {
    Requests: {
        Getters: {
			event: async function(email, url) {
			
			  //email = 'rans@wirex-systems.com';
			  //search event with url and return it
			  return new Promise( res => {
			    xhrWithAuth(
			    'GET',
			    `https://www.googleapis.com/calendar/v3/calendars/${email}/events?q=${url}`,
			    true,
			    function(status, response){
				  //resolve function
				  return res(Gcalendar.Responses.event(status, response));
				 }) //xhrWithAuth
				}); //Promise
				//return null if not found
			},
            calendarList: function(){
                xhrWithAuth('GET',
                'https://www.googleapis.com/calendar/v3/users/me/calendarList',
                true,
                Gcalendar.Responses.calenderList);
            }
            
        }   // Getters
    }, // Requests
	
	Setters: {
		updateEvent: function(gEvent, data) {
			//TODO: implament
			console.log('set this data');
			console.log(data);
		}
	},

    Responses: {
        calenderList: function(status, response) {
            console.log(status);
            console.log(response)
        },
		event: function(status, response) {
			
			if (!response)
				return null;
			
			if (status !== 200) {
				handleBadStatus(status, 'event', response );
				return; //undefiend;
			}
			
			let objResp = JSON.parse(response);
			console.log(objResp);
			
			return objResp;
		}
    } // Responses
} // Gcalendar

function handleBadStatus(status, type, resp) {
  // TODO: send message to content script that could not get type (maybe lack of permissions)
	console.log('error ' + status);
	console.log(resp);
}
