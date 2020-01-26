async function updateResult(){
	let srcString = document.getElementById('password').value
		+ document.getElementById('site-string').value
		+ document.getElementById('login-string').value;
	let resultString = await generatePassword(srcString, 0);
	let result = document.getElementById('result');
	result.value = resultString;
}

function selectResult () {
    let result = document.getElementById('result');
    result.select();
    document.execCommand("copy");
}

dataChanged = function(event) {
    event.preventDefault();
    if (event.keyCode === 13) {
		updateResult().then(() => {
            selectResult ()
        });
    }
};

document.getElementById('password').addEventListener("keyup", dataChanged);
document.getElementById('site-string').addEventListener("keyup", dataChanged);
document.getElementById('login-string').addEventListener("keyup", dataChanged);

function toggleSettings() {
    let settingsElement = document.getElementById("settings");
    settingsElement.hidden ^= true;
    let toggleSettingsElement = document.getElementById("toggle-settings");
    toggleSettingsElement.innerHTML = settingsElement.hidden ? "Show settings" : "Hide settings";
}

function logTabs(tabs) {
    let tab = tabs[0]; // Safe to assume there will only be one result
    let hostname = tab.url.split('/')[2];
    let hostnameParts = hostname.split('.');
    document.getElementById('site-string').value = hostnameParts[hostnameParts.length - 2] + "." + hostnameParts[hostnameParts.length - 1];
}
function onError(err){
    document.getElementById('site-string').value = err;
}

if (chrome) {
  chrome.tabs.query(
    {active: true, lastFocusedWindow: true},
    (arrayOfTabs) => {
        logTabs(arrayOfTabs);
    }
  );
} else {
  browser.tabs.query({currentWindow: true, active: true}).then(logTabs, onError);
}

document.getElementById('password').select();

function loadPreference(prefName, callback) {
    let callbackWrap = v => {
        callback(v[prefName]);
    };
    if (typeof browser !== "undefined") {
        browser.storage.local.get(prefName).then(callbackWrap);
    } else {
        chrome.storage.local.get(prefName, callbackWrap);
    }
}

function storePreference(obj) {
    let browserApi = chrome || browser;
    browserApi.storage.local.set(Object.fromEntries(obj));
}

function initAbstractCheck(id, prefName, setPref, setCheck, isCheck, eventType) {
    let elem = document.getElementById(id);
    loadPreference(prefName, enabled => {
        if (enabled != null) {
            setPref(enabled);
            setCheck(elem, enabled);
        }
    });
    elem.addEventListener(eventType, function () {
        let enabled = isCheck(this);
        storePreference([[prefName, enabled]]);
        setPref(enabled);
    });
}

function initCheck(id, prefName, setPref) {
    initAbstractCheck(id, prefName, setPref, (elem, enabled) => elem.checked = enabled, elem => elem.checked, 'change')
}

function initSymbolCheck(id, symbolName) {
    initCheck(id, symbolName, (v) => {
        symbolClassMap[symbolName].selected = v;
        if (typeof symbolCountChanged !== "undefined") {
            symbolCountChanged(getSelectedSymbolClassCount());
        }
    });
}
initSymbolCheck('check-lowercase', 'lowercase');
initSymbolCheck('check-uppercase', 'uppercase');
initSymbolCheck('check-digit', 'digit');
initSymbolCheck('check-special-symbol', 'special-symbol');

function getEyeIcon(show)
{
    let browserApi = chrome || browser;
    let imrUrl = browserApi.extension.getURL("icons/" +  (show ? "show-password-icon.png" : "hide-password-icon.png"));
    return `<img class="eye-icon" src="${imrUrl}">`;
}

function initHideButton(id, prefName) {
    let setPref = function (enabled) {
        let elem = document.getElementById(id);
        elem.classList.remove(enabled ? "eye-hide" : "eye-show");
        elem.classList.add(enabled ? "eye-show" : "eye-hide");
        let targetInput = document.getElementById(elem.getAttribute("for"));
        targetInput.type = enabled ? "password" : "text";
        elem.innerHTML = getEyeIcon(enabled);
    };
    let isChecked = e => e.classList.contains("eye-hide");
    initAbstractCheck(id, prefName, setPref, () => {}, isChecked, 'click')
}

initHideButton("toggle-main-password", "hide-main-password");
initHideButton("toggle-site", "hide-site");
initHideButton("toggle-login", "hide-login");
initHideButton("toggle-result", "hide-result");

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("ok")) {
        updateResult();
    } else if(e.target.classList.contains("open-settings")) {
        toggleSettings();
        e.target.classList.remove("open-settings");
        e.target.classList.add("close-settings");
    } else if(e.target.classList.contains("close-settings")) {
        toggleSettings();
        e.target.classList.remove("close-settings");
        e.target.classList.add("open-settings");
    }
});

function syncInput(srcId, destId, eventType, additionalCallback) {
    let srcElement = document.getElementById(srcId);
    srcElement.addEventListener(eventType, function () {
        let destElement = document.getElementById(destId);
        if (srcElement.validity.valid) {
            destElement.value = srcElement.value;
            additionalCallback(srcElement.value);
        }
    });
}

let passwordLengthChanged = v => {
    storePreference([["password-length", v]]);
    passwordLength = v;
};
syncInput("password-length-slider", "password-length-number", "change", passwordLengthChanged);
syncInput("password-length-slider", "password-length-number", "input", passwordLengthChanged);
syncInput("password-length-number", "password-length-slider", "input", passwordLengthChanged);

loadPreference("password-length", l => {
    if (l !== undefined) {
        document.getElementById("password-length-slider").value = l;
        document.getElementById("password-length-number").value = l;
        passwordLength = l;
    }
});

function setMin(min) {
    let slider = document.getElementById("password-length-slider");
    let number = document.getElementById("password-length-number");
    slider.min = min;
    number.min = min;
    if (passwordLength < min) {
        passwordLengthChanged(min);
        slider.value = min;
        number.value = min;
    }
}

setMin(getSelectedSymbolClassCount());

function symbolCountChanged(count) {
    setMin(count);
}

loadPreference("algorithm-name", v => {
    if (v !== undefined) algorithmName = v;
    for (let option of document.getElementById("hash-algorithm").options) {
        console.log(option.value === algorithmName);
        console.log(option.value);
        option.selected = option.value === algorithmName;
    }
    document.getElementById("hash-algorithm").addEventListener("change", v => {
        algorithmName = v.target.selectedOptions[0].value;
        storePreference([["algorithm-name", algorithmName]]);
    });
} );


