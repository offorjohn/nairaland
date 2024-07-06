var atno = 1;
var options = 3;
var XMLHttpFactories = [
    function () {return new XMLHttpRequest();},
    function () {return new ActiveXObject("Msxml2.XMLHTTP");},
    function () {return new ActiveXObject("Msxml3.XMLHTTP");},
    function () {return new ActiveXObject("Microsoft.XMLHTTP");}
];

function wrapText(elementID, openTag, closeTag) {
    var textArea = document.getElementById(elementID);
    var len = textArea.value.length;
    var start = textArea.selectionStart;
    var end = textArea.selectionEnd;
    var selectedText = textArea.value.substring(start, end);
    var replacement = openTag + selectedText + closeTag;
    textArea.value = textArea.value.substring(0, start) + replacement + textArea.value.substring(end, len);
    textArea.setSelectionRange(start, start)
    textArea.focus();
    textArea.selectionStart = textArea.selectionEnd = end + openTag.length + closeTag.length;
}

function addText(elementID, tag) {
    var textArea = document.getElementById(elementID);
    var len = textArea.value.length;
    var insertposition = textArea.selectionEnd;
    textArea.value = textArea.value.substring(0, insertposition) + tag + textArea.value.substring(insertposition, len);
    textArea.focus();
    textArea.selectionStart = textArea.selectionEnd = insertposition + tag.length;
}

function toEnd(elementID)
    {
        var textArea = document.getElementById(elementID);
        textArea.focus();
        textArea.selectionStart = textArea.selectionEnd = textArea.value.length;
    }

function sendRequest(url,callback,postData) {
    var req = createXMLHTTPObject();
    if (!req) return 'No request';
    var method = (postData) ? "POST" : "GET";
    req.open(method,url,true);
    if (postData)
        req.setRequestHeader('Content-type','application/x-www-form-urlencoded');
    req.onreadystatechange = function () {
        if (req.readyState != 4) return 'State not 4';
        if (req.status != 200 && req.status != 304) {
            return 'Status 204';
        }
        callback(req);
    };
    if (req.readyState == 4) return 'State 4';
    req.send(postData);
}

function createXMLHTTPObject() {
    var xmlhttp = false;
    for (var i=0;i<4;i++) {
        try {
            xmlhttp = XMLHttpFactories[i]();
        }
        catch (e) {
            continue;
        }
        break;
    }
    return xmlhttp;
}

function handleQuote(req){
    addText("body", req.responseText);
    document.getElementById("body").focus();
}

function quotePost(post, session) {
    var requesturl = '/getpost?post=' + post + '&session=' + session;
    sendRequest(requesturl, handleQuote);
}

function like(requesturl, undourl, numlikes, textid, linkid){
	var likes = parseInt(numlikes);
	likes += 1;
	var likeText = " Like";
	if (likes > 1) {likeText += "s";};
	document.getElementById(textid).innerHTML = likes.toString() + likeText;
	likeLink = document.getElementById(linkid);
	likeLink.onclick = function(){
		unlike(undourl, requesturl, likes, textid, linkid);
		return false;};

	likeLink.innerHTML = "Unlike";
	likeLink.href = undourl;
	sendRequest(requesturl, handleLikePost);
	return false;
}

function handleLikePost(req){}

function unlike(requesturl, undourl, numlikes, textid, linkid){
	var likes = parseInt(numlikes);
	likes -= 1;
	var likeText = " Like";
	var temp = likes;
	if (likes == 0){
		temp = "";
		likeText = "";}
	else if (likes > 1) {likeText + "s";}
	
	document.getElementById(textid).innerHTML = temp.toString() + likeText;
	likeLink = document.getElementById(linkid);
	likeLink.innerHTML = "Like";
	
	likeLink.onclick = function() {
		like(undourl, requesturl, likes, textid, linkid);
		return false;
	};
	likeLink.href = undourl;
	sendRequest(requesturl, handleLikePost);
	return false;
}

function setpoststate(_state, post, requesturl, session, redirect){
	var state = parseInt(_state);
	redirect2 = encodeURI(redirect)
	redirect = redirect2

	showUrl = '/do_setpoststate?'+ 'state=0&post=' + post + '&session='+ session;
	hideUrl = '/do_setpoststate?'+ 'state=1&post=' + post + '&session=' + session;
	spamUrl = '/do_setpoststate?' + 'state=2&post=' + post + '&session=' + session;
	
	switch(state){
		case 0://make post normal
			hideElement = document.getElementById("hp" + post);
			hideElement.innerHTML = "Hide";
			hideElement.href = hideUrl;
			hideElement.onclick = function(){
				setpoststate("1", post, hideUrl, session, redirect);
				return false;};
			
			spamElement = document.getElementById("sp" + post);
			spamElement.innerHTML = "Mark Spam";
			spamElement.href = spamUrl;
			spamElement.onclick = function(){
				setpoststate("2", post, spamUrl, session, redirect);
				return false;
			};
			
			textElement = document.getElementById("ht" + post);
			textElement.innerHTML = "";
			undoGrey(post);
			
			sendRequest(requesturl, handleStateChange);
			break;
		case 1://hide post
			linkElement = document.getElementById("hp"+post);
			linkElement.innerHTML = "Show";
			linkElement.href = showUrl;
			linkElement.onclick = function(){
				setpoststate("0", post, showUrl, session, redirect);
				return false;};
			
			spamElement = document.getElementById("sp" + post);
			spamElement.innerHTML = "Mark Spam";
			spamElement.href = spamUrl;
			spamElement.onclick = function(){
				setpoststate("2", post, spamUrl, session, redirect);
				return false;};
			
			textElement = document.getElementById("ht" + post);
			textElement.innerHTML = "(HIDDEN!)";
			makePostGrey(post);
			sendRequest(requesturl, handleStateChange);
			break;
			
		case 2://mark as spam
			linkElement = document.getElementById("hp" + post);
			linkElement.innerHTML = "Not Spam";
			linkElement.href = showUrl;
			linkElement.onclick = function(){
				setpoststate("0", post, showUrl, session, redirect);
				return false;};
			
			hideElement = document.getElementById("sp" + post);
			hideElement.innerHTML = "Hide But Not Spam";
			hideElement.href = hideUrl;
			hideElement.onclick = function(){
				setpoststate("1", post, hideUrl, session, redirect);
				return false;};
			
			textElement = document.getElementById("ht" + post);
			textElement.innerHTML = "(SPAM!)";
			makePostGrey(post);
			sendRequest(requesturl, handleStateChange);
			break;
	}
}

function makePostGrey(post){
	postBody = document.getElementById("pb"+post);
	postBody.className += " gr";
	
	postSig = document.getElementById("posig"+post);
	if(postSig){postSig.className += " gr";}
}

function undoGrey(post){
	var reg = new RegExp("(?:^|\\s)gr(?!\\S)", "g");
	
	postBody = document.getElementById("pb"+post);
	postBody.className = postBody.className.replace(reg, '');
	
	postSig = document.getElementById("posig"+post);
	if(postSig){
		postSig.className = postSig.className.replace(reg, '');
	}
}

function handleStateChange(req){}

function handlefollows(undourl, requesturl, state, undoText, doText, classref){
	var allElements = document.getElementsByClassName(classref);
	state = parseInt(state);
	for(var i = 0; i < allElements.length; i++){
		allElements[i].innerHTML = doText;
		allElements[i].href = undourl;
		allElements[i].onclick = function(){
			handlefollows(requesturl, undourl, (state ? 0 : 1), doText, undoText, classref);
			return false;
		};
	}
	sendRequest(requesturl, handleStateChange);
}

function share(requesturl, undoUrl, id, count, state, textid){
	var element = document.getElementById(id);
	var countDisplay = document.getElementById(textid);
	
	state = parseInt(state);
	var text = "";
	var doText = "";
	var newCount = 0;
	
	if(state){
		newCount = parseInt(count) - 1;
		doText = "Share";
		
		if(newCount > 0){
			if(newCount == 1){text = newCount + " Share";}
			else{text = newCount + " Shares";}
		}
	}else{
		newCount = parseInt(count) + 1;
		doText = "Un-Share";
		
		if(newCount > 1){text = newCount + " Shares";}
		else{text = newCount + " Share";}
	}
	
	countDisplay.innerHTML = " " + text;
	element.innerHTML = doText;
	element.href = undoUrl;
	element.onclick = function(){
		share(undoUrl, requesturl, id, newCount, (state ? 0 : 1), textid);
		return false;
	};
	
	sendRequest(requesturl, handleStateChange);
	return false;
}

function unfollowtopic(requesturl, topic){
	var tablerow = document.getElementById('top'+topic);
	function dummyFunction(){
		tablerow.innerHTML = '';
		sendRequest(requesturl, handleStateChange);
	}
	window.setTimeout(function(){dummyFunction();}, 125);
}

function dismissreport(requesturl, report){
	var tablerow = document.getElementById('rep'+report);
	function dummyFunction(){
		tablerow.innerHTML = '<tr><td>';
		sendRequest(requesturl, handleStateChange);
	}
	window.setTimeout(function(){dummyFunction();}, 125);
}

function hideAppAd(){
	var element = document.getElementById("appad");
	element.innerHTML = "";
	
	sendRequest("/appadclosed", handleStateChange)
	return false;
}

const nlRules = {
    "1": "Please post all threads in the right section, and don't derail threads by posting off topic.",
    "2": "Don't abuse, bully, deliberately insult/provoke, fight, or wish harm to Nairaland members OR THEIR TRIBES",
    "3": "Don't threaten, support or DEFEND violent acts against any person, tribe, race, animals, or group (e.g. rape)",
    "4": "Discussions of the art of love-making should be restricted to the hidden sexuality section.",
    "5": "Don't post pornographic or disgusting pictures or videos on any section of Nairaland",
    "6": "Don't post adverts or affiliate links outside the areas where adverts are explicitly allowed.",
    "7": "Don't say, do, or THREATEN to do anything that's detrimental to the security, success, or reputation of Nairaland.",
    "8": "Don't post false information on Nairaland.",
    "9": "Don't use Nairaland for illegal acts, e.g scams, plagiarism, hacking, gay meetings, incitement, promoting secession.",
    "10": "Don't violate the privacy of any people e.g. by posting their private pics, info, or chats without permission.",
    "11": "Don't create distracting posts with: ALL WORDS BOLD / huge font sizes / ALL CAPS / distracting imagesspaces, etc.",
    "12": "Don't insert signatures into your posts. Instead, add the desired signature to your profile.",
    "13": "Please report any post or topic that violates the rules of Nairaland using the (Report) button.",
    "14": "Please search the forum before creating a new thread on Nairaland.",
    "15": "Don't attempt to post censored words by misspelling them.",
    "16": "Don't promote shady investments like HYIP, MLM on Nairaland.",
    "18": "Don't spam the forum by advertising in the wrong places or posting the same content many times.",
    "19": "Don't use alternate accounts to access Nairaland after being banned. If you do, make sure we don't find out.",
    "20": "Complaints to or against moderators must be sent privately. Please don't disobey, disrespect, or defame them.",
    "21": "Please spell words correctly when you post, and try to use perfect grammar and punctuation.",
    "22": "Don't ask Nairaland members for contact details (email, phone, bbpin) or investments."
}

const MAX_RULE_COUNT = 22;

// run only on /reported or /reported/page
if (window.location.pathname.match("\/reported(?:\/[0-9]+)?$") != null){

    window.addEventListener("load", () => {
        const reporters = document.querySelectorAll(".w.pd:not(.l)");
        Array.from(reporters).map((reporter) => {        
            /** @type { String } */
            /* match all the text within quotes that is not a quote */
            const report = reporter.innerText.match('"[^"]*"')[0];

            /* match all consecutive whole numbers */
            const rules = Array.from(report.matchAll("[0-9]+"));

            const rulesText = rules.map((rule) => {
                if (parseInt(rule) <= MAX_RULE_COUNT && parseInt(rule) > 0)
                    return `${rule}. ${nlRules[rule]}`
            }).join("\n");
            
            reporter.setAttribute("title", rulesText);
        });
    })
}