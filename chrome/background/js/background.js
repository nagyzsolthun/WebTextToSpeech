require(["SettingsHandler", "TtsProvider","IconDrawer"], function(settingsHandler, tts, iconDrawer) {
	var iconCanvas = document.createElement("canvas");
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
			tts.read({text:c.text,lan:c.lan});
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
					iconDrawer.drawLoading();
					break;
				case("webReader.missed"):
					console.log("missed received");
					iconDrawer.drawMissed();
					break;
				case("webReader.set"):
					console.log("set " + request.setting + ": " + request.value + " received");
					settingsHandler.set(request.setting,request.value);
					switch(request.setting) {
						case("selectEvent"): setContentJsSetting("selectEvent", request.value); break;
						case("readOnClick"): setContentJsSetting("readOnClick", request.value); break;
						case("readOnKeyboard"): setContentJsSetting("readOnKeyboard", request.value); break;	//TODO
						case("keyboardReadEvent"): break; //TODO
						case("speed"): tts.set("speed",request.value); break;
						case("preferredTts"): tts.preferredTts = request.value; break;
					}
					break;
			}
		}
	);

	// ===================================== initial settings =====================================
	tts.set("onStart", function() {iconDrawer.drawPlaying()});
	tts.set("onEnd", function() {iconDrawer.drawTurnedOn()});
	
	settingsHandler.getAll(function(settings) {
		tts.set("speed", settings.speed);
		if(settings.turnedOn) iconDrawer.drawTurnedOn();
		else iconDrawer.drawTurnedOff();
	});
});