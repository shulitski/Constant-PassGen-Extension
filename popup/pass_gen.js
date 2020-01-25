//#region SymbolClasses

let lowercaseClass = {
	size : 'z'.charCodeAt(0) - 'a'.charCodeAt(0) + 1,
	getSymbol(index) {
		return String.fromCharCode('a'.charCodeAt(0) + index);
	}
};

let uppercaseClass = {
	size : 'Z'.charCodeAt(0) - 'A'.charCodeAt(0) + 1,
	getSymbol(index) {
		return String.fromCharCode('A'.charCodeAt(0) + index);
	}
};

let digitClass = {
	size : '9'.charCodeAt(0) - '0'.charCodeAt(0) + 1,
	getSymbol(index) {
		return String.fromCharCode('0'.charCodeAt(0) + index);
	}
};

let specSymbols = ['!', '"', '#', '$', '%', '&', '\'', '(', ')', '*', '+', ',',
	'-', '.', '/', ':', ';', '<', '=', '>', '?', '@', '[', '\\', ']', '^', '`', '{', '|',
	'}', '~'];
let specialSymbolClass = {
	size : specSymbols.length,
	getSymbol(index) {
		return specSymbols[index];
	}
};

//#endregion SymbolClasses

//#region Algorithms

function parseHexString(str) {
	let result = [];
	while (str.length >= 2) {
		result.push(parseInt(str.substring(0, 2), 16));
		str = str.substring(2, str.length);
	}
	return result;
}

async function digest(str, algorithm) {
	const encoder = new TextEncoder();
	const data = encoder.encode(str);
	const hashBuffer = await crypto.subtle.digest(algorithm, data)
	return Array.from(new Uint8Array(hashBuffer));
}

let algorithms = {
	"SHA3-256" : async function (str) {
		return parseHexString(sha3_256(str));
	},
	"SHA-256" : async function (str) {
		return await digest(str, 'SHA-256');
	},
	"SHA-512" : async function (str) {
		return await digest(str, 'SHA-512');
	},
	"SHA-1" : async function (str) {
		return await digest(str, 'SHA-1');
	},
	"MD5" : async function (str) {
		return parseHexString(md5(str));
	},
};

//#endregion Algorithms

const algorithmName = 'SHA3-256';
//const algorithmName = 'SHA-256';
const passwordLength = 8;
let symbolClasses = [lowercaseClass, digitClass];
function getChar(value) {
	console.log(value + '\n');
	let currentIndex = value;
	if (currentIndex < 0){
		return "?";
	}
	while (true) {
		for (let symbolClass of symbolClasses){
			if (currentIndex < symbolClass.size) {
				console.log('-----\n');
				return symbolClass.getSymbol(currentIndex)
			} else {
				currentIndex -= symbolClass.size
			}
			console.log(currentIndex)
		}
	}
}

async function calculate(){
	let srcString = document.getElementById('password').value + document.getElementById('site-string').value;

	let hexedArray = await algorithms[algorithmName](srcString);
	let resultString = "";
	for(let i = 0; i < passwordLength; i++){
		resultString += getChar(hexedArray[i]);
	}
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
	calculate().then(() => {
		if (event.keyCode === 13) {
			selectResult ()
		}
	});
};

document.getElementById('password').addEventListener("keyup", dataChanged);
document.getElementById('site-string').addEventListener("keyup", dataChanged);

function showPassword() {
	var resultElement = document.getElementById("result");
	resultElement.type = "text";	
	var togglePasswordElement = document.getElementById("toggle-password");
	togglePasswordElement.innerHTML = "Hide";
}

function hidePassword() {
	var resultElement = document.getElementById("result");
	resultElement.type = "password";
	var togglePasswordElement = document.getElementById("toggle-password");
	togglePasswordElement.innerHTML = "Show";
}

function showSettings() {
	var settingsElement = document.getElementById("settings");
	settingsElement.hidden = false;	
	var toggleSettingsElement = document.getElementById("toggle-settings");
	toggleSettingsElement.innerHTML = "Hide";
}

function hideSettings() {
	var settingsElement = document.getElementById("settings");
	settingsElement.hidden = true;
	var toggleSettingsElement = document.getElementById("toggle-settings");
	toggleSettingsElement.innerHTML = "Show settings";
}

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("ok")) {
	calculate();
  } else if(e.target.classList.contains("eye-show")) {
	hidePassword();
	e.target.classList.remove("eye-show");
	e.target.classList.add("eye-hide");
  } else if(e.target.classList.contains("eye-hide")) {
	showPassword();
	e.target.classList.remove("eye-hide");
	e.target.classList.add("eye-show");
  } else if(e.target.classList.contains("open-settings")) {
	showSettings();
	e.target.classList.remove("open-settings");
	e.target.classList.add("close-settings");
  } else if(e.target.classList.contains("close-settings")) {
	hideSettings();
	e.target.classList.remove("close-settings");
	e.target.classList.add("open-settings");
  }
});

function logTabs(tabs) {
    let tab = tabs[0]; // Safe to assume there will only be one result
	let hostname = tab.url.split('/')[2];
	let hostnameParts = hostname.split('.');
	document.getElementById('site-string').value = hostnameParts[hostnameParts.length - 2] + "." + hostnameParts[hostnameParts.length - 1];
}

function onError(err){
    document.getElementById('site-string').value = err;
}

browser.tabs.query({currentWindow: true, active: true}).then(logTabs, onError);
document.getElementById('password').select();