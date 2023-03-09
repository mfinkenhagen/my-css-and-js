/*Initialy this is just taking things to identify a process has started. These will toggle the touched flag */
console.info(`index jquery is loaded ${$().jquery} `);
import { monitorClicks } from './monitorClicks.js';
const observeConfig = { attributes: true, childList: true, subtree: true };
var bswMatchers = ``;
var bWiredUp;

const eventTypes={
    'childList':'bswMatchedMutation',
    'attributes':'bswAttributeMatchedMutation'
}

function notifyParent(evt) {
    try {
        window.parent.postMessage(evt, "*");
        if (window.parent !== window.top) {
            window.top.postMessage(evt, "*");
        }
    }
    catch (ex) {
        console.error(ex);
    }
}

function addEventListeners(events) {
    ///{ elements: "li._ListElement", eventName: "click", message: "buttonChoice", containerId: "appPopupRoot" }
	console.info(`index addEventListeners envents`,events);
	//const contents={};
	try{
		for(let index = 0; index < events.length;index++){
			const container = events[index].containerId ? events[index].containerId : 'content';
			const eventName = events[index].eventName;
			const content = document.getElementById(container);
			if(content){
				content.addEventListener(eventName, evt => {
					monitorClicks(evt, events);// ? console.info(`index monitorClicks is true so message should have posted`) : console.info(`index monitorClicks is false so message did not post`); 
				});
				if(eventName.toLowerCase() === 'click'){
					//events[index].eventName='touchstart';
					content.addEventListener('touchstart', evt => {
						monitorClicks(evt, events);// ? console.info(`index monitorClicks touchstart is true so message should have posted`) : console.info(`index touchstart monitorClicks is false so message did not post`); 
					});
				}
			}
		}
	}catch(e){console.info(`index ERROR e`,e);}
}

const addObservers = (observers) => {
    listen(observers);
}

const observerCallback = function (mutationsList) {
    let matcher = bswMatchers;
    if(matcher.length === 0)return;
    try{
        for (const mutation of mutationsList) {
            let previousSibling = getElementName(mutation.previousSibling);
            postMatches(mutation,previousSibling,matcher);
        }
    }catch(error){
        console.info(`index observerCallback ERROR: `,error,mutationsList);
    }
}

function postMatches(mutation,previousSibling,matchers){
    const finders = Array.isArray(matchers)?matchers:[matchers];//(typeof matchers === "string" && matchers.indexOf(",")>0)?matchers.split(","):[matchers];
    const event = eventTypes[mutation.type];
    if(event){
        for(let index = 0; index < finders.length; index++){
            const matcher = finders[index].trim();
            let removed = mutation.removedNodes.length === 0 ? "" : getElementName(mutation.removedNodes[0]);
            let added = mutation.addedNodes.length === 0 ? "" : getElementName(mutation.addedNodes[0]);
            let oldValue = mutation.oldValue || "";
            let attName = mutation.attributeName || "";
            if(doPost(mutation,matcher)){
                window.parent.postMessage({ event: event, 
                                            data: { type: mutation.type, 
                                                    target: matcher, 
                                                    removed: removed, 
                                                    added: added, 
                                                    oldValue: oldValue, 
                                                    attName: attName, 
                                                    previousSibling: previousSibling } 
                                            }, '*');
                observer.disconnect();
            }
        }
    }
 }

function doPost(mutation,matcher){
	return (mutation.target.nodeType === 1 || mutation.target.nodeType === 2 ) && (mutation.target.matches(matcher) || mutation.target.querySelectorAll(matcher)?.length > 0);
}
const observer = new MutationObserver(observerCallback);

function listen(observers) {
    console.log(`index listen observers ${observers}`);
    if (observers?.length > 0) {
        try {
            observer.disconnect();
            if (observers) {
                observer.observe(document.querySelector(observers), observeConfig);
                //check if the matching element is on the page and throw a match event if it is
                checkPage();
            }
        } catch (e) {
            //no need to do anything if we have any error
            console.log(`ChildChangeObservation error occured during match detection`, e);
        }
    }
}

function checkPage(){
    const matchers = Array.isArray(bswMatchers)?bswMatchers:[bswMatchers];
    for(let index = 0; index < matchers.length;index++){
        const match = matchers[index];
        if (match.length > 0 && document.querySelector(match) !== null) {
            console.log(`index checkPage bswMatchers will postMessage`,bswMatchers);
            window.parent.postMessage({ event: "bswMatchedMutation", data: { type: "childList", target: match, removed: "", added: "", previousSibling: "" } }, '*');
            observer.disconnect();
        }
    }

}





const addMatchers = (matchers) => {
    bswMatchers = matchers;
}

$(() => {
    if (!bWiredUp && !window.ReactNativeWebView) { bWiredUp = webListening(); }
    else if (!bWiredUp && window.ReactNativeWebView) { bWiredUp = mobileListening(); }
}
);

const webListening = ()=> {
    window.addEventListener('message', event => {
        addEvents(event);
        addObservations(event);
        addMatches(event);
    });
    notifyParent({ eventName: "loaded" });
    return true;
     }
const mobileListening = () => {
    console.info(`index mobileListening wiring up`);
    return true;
}

const addMatches = (message) => {
    if (message?.data?.name === 'bswMatch' && message?.data?.data?.length > 0) {
        addMatchers(message.data.data);
        notifyParent({ eventName: "matcheloaded" });
    }
}
const addObservations = (message) => {
    if (message?.data?.name === 'observe' && message?.data?.data?.length > 0) {
        addObservers(message.data.data);
        notifyParent({ eventName: "observeloaded" });
    }
}
//The events that we want to be notified about
const addEvents = (message) => {
    if (message?.data?.name === 'events' && message?.data?.data?.length > 0) {
        //to start with lets only handle click events. Add more later
        const clickEvents = message.data.data.filter(e => e.eventName === 'click');
        addEventListeners(clickEvents);
        notifyParent({ eventName: "eventsloaded" });
    }
}

function getElementName(el) {
    let name = "";
    if (el) {
        let { tagName, id, className } = el;
        const tName = tagName ? tagName.toLowerCase() : '';
        const elementId = id ? `#${id}` : '';
        const elementClassName = className ? `.${className.replace(/ +/g, '.')}` : '';
        name = `${tName}${elementId}${elementClassName}`;
    } 
    return name;
}


