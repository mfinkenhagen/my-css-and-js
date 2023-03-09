
/**
 * When the content div is clicked the event and what is to be monitored for a click is passed in.
 * From the path (the path through the DOM to the clicked element) the first element that passes the 
 * matches check is the one that the parent will be notified of. The bswEvent and usefull string parameters
 * from the HTMLElement will be in the message.
 * @param {any} ce - the click event
 * @param {any} evts - the array of events to monitor. This will only process the click ones
 */
export const monitorClicks = (clickEvent, evts) => {
    console.info(`monitorEvents monitorClicks content click`, clickEvent, evts);
    let elements = [];

    try {
        if (clickEvent && clickEvent.path && clickEvent.path.length > 0) {
            elements = clickEvent.path;
        } else if(clickEvent.composed){
            elements = clickEvent.composedPath();
        }
        if (elements.length > 0) {
            for (let idx = 0; idx < evts.length; idx++) {
                let evt = evts[idx];
                if (evt.elements.toLowerCase() !== "window" && (evt.eventName.toLowerCase() === "click" || evt.eventName.toLowerCase() === "touchstart")) {
                    
                    for (let i = 0; i < elements.length; i++) {
                        let matchedEvent = null;
                        const element = elements[i];
                        console.info(`monitorEvents monitorClicks element.matches check `, element, evt);
                        if (element.matches && element.matches(evt.elements)) {
                            //evt.element = element;
                            let bswElement = {
                                //attributes: element.attributes ? [...element.attributes] : [],
                                className: element.className,
                                //dataset: element.dataset && element.dataset.propertyIsEnumerable()?[...element.dataset]:[],
                                innerHTML: element.innerHTML,
                                innerText: element.innerText,
                                id: element.id,
                                nodeName: element.nodeName,
                                outerHTML: element.outerHTML,
                                outerText: element.outerText,
                                tagName: element.tagName,
                                text: element.text,
                                textContent: element.textContent,
                                title: element.title
                            };
                            matchedEvent = {
                                evt, bswElement: { ...bswElement }
                            };
                            if (matchedEvent != null) {
                                console.info(`monitorEvents monitorClicks posting matchedEvent`, matchedEvent);
                                window.parent.postMessage(matchedEvent, "*");
                                if (window.parent !== window.top) {
                                    window.top.postMessage(matchedEvent, "*");
                                }
                                return true;
                            }

                        }
                    }
                }
            }
            return false;
        }
        return false;

    } catch (e) { console.info(`monitorEvents monitorClicks failed monitorClicks`, e); }

}