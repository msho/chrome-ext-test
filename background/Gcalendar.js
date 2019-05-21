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

let Gcalendar = {
    Requests: {
        Getters: {
            calendarList: function(){
                xhrWithAuth('GET',
                'https://www.googleapis.com/calendar/v3/users/me/calendarList',
                true,
                Gcalendar.Responses.calenderList);    
            }
            
        }   // Getters
    }, // Requests
    Responses: {
        calenderList: function(status, response) {
            console.log(status);
            console.log(response)
        }
    }
}

let Gcalendar

function calendarListFetched(data, data2, data3) {
    console.log('got calendar data!!');
    console.log(data); console.log(data2); console.log(data3);
}
