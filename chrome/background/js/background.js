require(["SettingsHandler", "tts/TtsProvider","icon/drawer"], function(settingsHandler, tts, iconDrawer) {
	var iconCanvas = document.createElement("canvas");
	iconCanvas.width = iconCanvas.height = 18;	//this is the size of the chrome icon TODO reference
	iconDrawer.canvas = iconCanvas;
	iconDrawer.onRenderFinished = loadIconToToolbar;
	
	/** iconDrawer draws the icon on a canvas, this function shows the canvas on the toolbar */
	function loadIconToToolbar() {
		chrome.browserAction.setIcon({
			imageData: iconCanvas.getContext("2d").getImageData(0, 0, 19, 19)
		});
	}

	// ===================================== handle messages =====================================
	
	function read(c) {
		settingsHandler.getAll(function(settings) {
			if(! settings.turnedOn) {return;}
			tts.read({text:c.text,lan:c.lan,speed:settings.speed});
		});
	}
	
	/** notifies all contentJs' about a changed setting */
	function setContentJsSetting(setting, value) {
		console.log("notife content: set " + setting + ": " + value);
		chrome.tabs.query({}, function(tabs) {
			settingsHandler.getAll(function(settings) {
				var message = {action:"webReader.set",setting:setting,value:value};
				for (var i=0; i<tabs.length; i++) {
					chrome.tabs.sendMessage(tabs[i].id, message);
				}
			});
		});
	}
	
	// ========================================= handling messages =========================================
	//receiving messages from cotnent script (to read) and popup (turnon/turnoff/getstatus)
	chrome.runtime.onMessage.addListener(
		function(request, sender, sendResponse) {
			switch(request.action) {
				case("webReader.getSettings"):
					console.log("getSettings received");
					settingsHandler.getAll(function(settings){
						sendResponse(settings);
					});
					break;
				case("webReader.getTtsServiceNames"):
					console.log("getTtsServiceNames received");
					sendResponse(tts.serviceNames);
					break;
				case("webReader.testTtsService"):
					console.log("testTtsService received");
					tts.test(request.tts, sendResponse);
					return true;	//very important: keeps sendResponse channel open until it is used
				case("webReader.getError"):
					console.log("getError received");
					sendResponse(error);
					break;
				case("webReader.turnOn"):
					console.log("turnOn received");
					settingsHandler.set("turnedOn",true);
					iconDrawer.drawTurnedOn();
					break;
				case("webReader.turnOff"):
					console.log("turnOff received");
					settingsHandler.set("turnedOn",false);
					tts.stop();	//in case it is reading, we stop it
					iconDrawer.drawTurnedOff();
					break;
				case("webReader.read"):
					console.log("read received");
					read({text: request.text,lan: request.lan || navigator.language});
					break;
				case("webReader.missed"):	//TODO get rid of this
					console.log("missed received");
					iconDrawer.drawError();
					break;
				case("webReader.set"):
					console.log("set " + request.setting + ": " + request.value + " received");
					settingsHandler.set(request.setting,request.value);
					switch(request.setting) {
						case("selectEvent"): setContentJsSetting("selectEvent", request.value); break;
						case("readOnClick"): setContentJsSetting("readOnClick", request.value); break;
						case("readOnKeyboard"): setContentJsSetting("readOnKeyboard", request.value); break;	//TODO
						case("keyboardReadEvent"): break; //TODO
						case("speed"): tts.speed = request.value; break;
						case("preferredTts"): tts.preferredTts = request.value; break;
					}
					break;
			}
		}
	);
	// ===================================== error handling =====================================
	//error.tts the name of the tts
	//error.cause the cause of the error
	//error.url if the cause is URL_ERROR, the url
	var error = null;

	// ===================================== initial settings =====================================
	tts.onEvent = function(event) {
		switch(event.type) {
			case("loading"): iconDrawer.drawLoading(); break;
			case("start"): error = null; iconDrawer.drawPlaying(); break;
			case("end"): iconDrawer.drawTurnedOn(); break;
			case("error"):
				error = {tts:event.tts,errorType:event.errorType,url:event.url};	//TODO include url?
				iconDrawer.drawError();
				break;
		}
	}
	
	settingsHandler.getAll(function(settings) {
		tts.preferredTts = settings.preferredTts;
		tts.speed = settings.speed;
		if(settings.turnedOn) iconDrawer.drawTurnedOn();
		else iconDrawer.drawTurnedOff();
	});
});