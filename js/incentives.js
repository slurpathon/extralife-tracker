const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

// Get spreadsheet info
const sheetId = urlParams.get('sheetId');
const apiKey = urlParams.get('apiKey');
const range = "DB!A:G";
const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?dateTimeRenderOption=FORMATTED_STRING&majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE&key=${apiKey}`;

// Get slide timer value
const timer = urlParams.get('timer');
const slideTimer = (timer != null) ? timer : 5000;

/* =================== GOOGLE =================== */
// Grab data from Google Sheets API
async function GetData() {
    const res = await fetch(sheetUrl, {
        cache: "no-store"
    });

    let json = await res.json();
    let values = json.values;
    let headerRow = values.splice(0, 1)[0];
    let data = [];

    for (const row of values) {
        let obj = {};
        for (let i = 0; i < headerRow.length; i++) {
            obj[headerRow[i].toLowerCase()] = row[i];
        }
        data.push(obj);
    }

    return data;
}

// Remove past incentives from the object
function FilterCurrentIncentives(values) {
    // values.sort((a, b) => a[2] - b[2]);
    return values.filter(arr => arr.active === true);
}

// Convert string values to proper types
function ProcessValues(input) {

    let incentives = [];

    for (let i = 0; i < input.length; i++) {
        let obj = input[i];

        obj.combinedname = obj.game + " - " + obj.description;

        let type = obj.type.toLowerCase();

        if (type == "bid war") {
            const warExists = el => el.combinedname === obj.combinedname;
            let index = incentives.findIndex(warExists);

            // Create object if not exists
            if (index === -1) {
                let warObj = obj;
                warObj.choices = {};
                index = incentives.length;
                incentives.push(warObj);
            }

            incentives[index].choices[obj.choice] = obj.total;

        } else if (type == "goal") {
            incentives.push(obj);
        }
    }

    return incentives;
}

function CalculateBidWarTotals(arr) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].hasOwnProperty("choices")) {
            let sumValues = Object.values(arr[i].choices).reduce((a, b) => a + b);
            arr[i].sum = sumValues;
        }
    }

    return arr;
}

/* =================== SLIDESHOW =================== */

// using above code we can get Transition end event name
const transitionEndEventName = GetTransitionEndEventName();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function GetTransitionEndEventName() {
    var transitions = {
        "transition": "transitionend",
        "OTransition": "oTransitionEnd",
        "MozTransition": "transitionend",
        "WebkitTransition": "webkitTransitionEnd"
    }
    let bodyStyle = document.body.style;
    for (let transition in transitions) {
        if (bodyStyle[transition] != undefined) {
            return transitions[transition];
        }
    }
}

async function BuildSlide(title, arr) {
    // Create the overall bar
    let progress = document.createElement('div');
    progress.classList.add('bro-progress');

    let counters = [];
    let remainderText = "";

    // Create counters
    for (const el of arr) {
        let left = document.createElement('div');
        left.classList.add('bro-bar', 'bro-counter', 'bro-left');
        left.innerHTML = el.name;
        left.setAttribute("data-width", el.percent * 100);
        left.style.backgroundColor = (el.hasOwnProperty('complete') && el.complete == true) ? "#4CBB17" : el.color;
        counters.push(left);

        // Hack for goals. Not very clean but it works.
        if(el.percent < 0.15 && el.type == "goal") {
            left.innerHTML = "";
            remainderText = el.name;
        }
    }

    // Add counters to DOM
    for (const counter of counters) {
        progress.appendChild(counter);
    }

    // Create the rest of the remaining bar
    let right = document.createElement('div');
    right.classList.add('bro-bar', 'bro-remainder');
    right.innerHTML = remainderText;
    progress.appendChild(right);

    // Create the title
    let descriptor = document.createElement('div');
    descriptor.innerHTML = title;
    descriptor.classList.add('descriptor');

    // Create the container
    let slide = document.createElement('div');
    slide.classList.add('slide');
    slide.appendChild(descriptor);
    slide.appendChild(progress);

    return slide;
}

async function PlaySlide(title, arr) {
    let slide = await BuildSlide(title, arr);

    // Add the bar to the page
    let main = document.getElementsByTagName('main')[0];
    main.appendChild(slide);

    // Animate the values
    await sleep(100);
    slide.style.opacity = 1;

    // Set width
    var els = document.getElementsByClassName("bro-counter");
    Array.from(els).forEach((el) => {
        el.style.width = el.getAttribute('data-width') + '%';
    });

    await sleep(slideTimer);
    slide.style.opacity = 0;

    await new Promise((resolve) => {
        slide.addEventListener(transitionEndEventName, resolve, { once: true });
    });

    slide.remove();

    return Promise.resolve();
}

/* =================== PUT IT ALL TOGETHER =================== */

async function Main(predata = null) {
    let data;
    const colors = [
        "#CC3F61",
        "#52C6DC",
        "#EB75A6",
        "#BA7A39",
        "#92E3F2",
        "#46220F",
        "#D59D88",
        "#F3EAF9",
        "#EAB8D5" // !This color is too light
    ];

    if (predata == null) {
        console.log('Live data');
        let raw = await GetData();

        let filtered = FilterCurrentIncentives(raw);
        let parsed = ProcessValues(filtered);
        data = CalculateBidWarTotals(parsed);
    } else {
        console.log('Cached data');
        data = predata;
    }

    for (const incentive of data) {
        let title = incentive.combinedname;
        let type = incentive.type.toLowerCase();
        let arr = [];
        let i = 0;
        if (type == "bid war") {
            let choices = incentive.choices;
            let totalChoices = Object.keys(choices).length;
            let minWidth = 0.1;

            for (const property in choices) {
                let obj = {
                    name: `${property} $${choices[property]}`,
                    percent: (incentive.sum == 0) ? (1 / totalChoices) : (choices[property] / incentive.sum),
                    color: colors[i],
                    type: "war"
                }
                arr.push(obj);
                i++;
            }

            // Fix for having only one non-zero entity in a bidwar
            let zero = arr.filter(x => x.percent == 0).length;
            let nonzero = arr.filter(x => x.percent > 0).length;
            
            for (var j = 0; j < arr.length; j++) { 
                if (arr[j].percent == 0) {
                    arr[j].percent = minWidth;
                } else if (zero > 0) {
                    arr[j].percent = arr[j].percent - (minWidth / nonzero);
                }
            }
        } else if (type == "goal") {
            arr = [{
                name: `$${incentive.total} / $${incentive.goal}`,
                percent: incentive.total / incentive.goal,
                complete: (incentive.total / incentive.goal) >= 1,
                color: colors[0],
                type: "goal"
            }];
        }

        await PlaySlide(title, arr);
    }

    return Promise.resolve(data);
}

async function LetsGo() {
    let i = 3;
    let cache;
    while (true) {
        if(i >= 3) {
            cache = await Main();
            i = 0;
        } else {
            await Main(cache);
        }
        i++;
    }
}

LetsGo();