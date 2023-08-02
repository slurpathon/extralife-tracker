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

const currencySymbol = "$";

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

async function getProcessedData() {
    return new Promise((resolve, reject) => {
        GetData().then(raw => {
            let filtered = FilterCurrentIncentives(raw);
            let parsed = ProcessValues(filtered);
            data = CalculateBidWarTotals(parsed);
            resolve(data);
        });
    });
}

/* =================== SLIDESHOW =================== */
/*
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

        let name = document.createElement('div');
        name.innerHTML = el.name;

        if (el.hasOwnProperty('amount')) {
            let amt = document.createElement('span');
            amt.classList.add('bidwar-amount');
            amt.innerHTML = "<br />" + currencySymbol + el.amount;
            name.appendChild(amt);
        }

        left.appendChild(name);
        left.setAttribute("data-width", el.width * 100);
        //left.style.backgroundColor = (el.hasOwnProperty('complete') && el.complete == true) ? "#4CBB17" : el.color;
        counters.push(left);

        // Hack for goals. Not very clean but it works.
        if (el.width < 0.15 && el.type == "goal") {
            left.innerHTML = "";
            remainderText = el.name;
        }
    }

    // Add counters to DOM
    for (const counter of counters) {
        progress.appendChild(counter);
    }

    // Create the rest of the remaining bar


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
*/
/* =================== PUT IT ALL TOGETHER =================== */

/*
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

            for (const property in choices) {
                let obj = {
                    name: property,
                    amount: choices[property],
                    width: (1 / totalChoices),
                    percent: choices[property] / incentive.sum,
                    color: colors[i],
                    type: "war"
                }
                arr.push(obj);
                i++;
            }
        } else if (type == "goal") {
            arr = [{
                name: `$${incentive.total} / $${incentive.goal}`,
                percent: incentive.total / incentive.goal,
                width: incentive.total / incentive.goal,
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
        if (i >= 3) {
            cache = await Main();
            i = 0;
        } else {
            await Main(cache);
        }
        i++;
    }
}

//LetsGo();
*/


/* New Stuff */

/**
* Creates a parent div for a progress bar. Abstracted out because wars need multiple bars within one parent div.
* @return {HTMLDivElement} The div containing the progress bar elements.
*/
function createIncentiveDiv(title) {
    const incentiveContainer = document.createElement('div');
    incentiveContainer.classList.add("incentive-container");

    // Set initial opacity to 0 for entrance animation
    incentiveContainer.style.opacity = 0;

    const progressTitle = document.createElement('span');
    progressTitle.classList.add('progress-title');
    progressTitle.innerHTML = title;

    incentiveContainer.appendChild(progressTitle);
    
    return incentiveContainer;
}

/**
* Creates a progress bar element
* @param {String} title The text to appear above the progress bar
* @param {String} id A unique ID to append to the divs that have ID attributes.
* @return {HTMLDivElement} The div containing the progress bar elements.
*/
function createProgressBar(id) {


    const progressBarContainer = document.createElement('div');
    progressBarContainer.classList.add("progress-bar-container");

    const progressBar = document.createElement('div');
    progressBar.classList.add("progress-bar");
    progressBar.setAttribute('id', `progress-bar-${id}`);

    const progressLabel = document.createElement('span');
    progressLabel.classList.add("progress-label");
    progressLabel.setAttribute('id', `progress-label-${id}`);
    progressLabel.innerHTML = "$0";

    progressBar.appendChild(progressLabel);
    progressBarContainer.appendChild(progressBar);

    return progressBarContainer;
}

/**
* Updates a given progress bar element with incentive amounts (and goals)
* @param {String} progressBarId The unique ID given to the progress bar when createProgressBar was called.
* @param {Number} currentAmount The current amount raised (numerator)
* @param {Number} goalAmount The goal amount (denominator)
*/
async function updateGoalProgressBar(progressBarId, currentAmount, goalAmount) {
    // Wait for 1ms to trigger the initial animation.
    await new Promise(r => setTimeout(r, 1));

    const progressBar = document.getElementById(`progress-bar-${progressBarId}`);
    const progressLabel = document.getElementById(`progress-label-${progressBarId}`);

    const percent = (currentAmount / goalAmount) * 100;

    progressBar.style.width = percent + "%";
    progressLabel.innerText = `$${currentAmount} / $${goalAmount}`;
}

/**
* Updates a given progress bar element with incentive amounts (and goals)
* @param {String} progressBarId The unique ID given to the progress bar when createProgressBar was called.
* @param {Number} currentAmount The current amount raised (numerator)
* @param {Number} goalAmount The goal amount (denominator)
* @param {Boolean} title The title of the choice
*/
async function updateWarProgressBar(progressBarId, currentAmount, goalAmount, title) {
    // Wait for 1ms to trigger the initial animation.
    await new Promise(r => setTimeout(r, 1));

    const progressBar = document.getElementById(`progress-bar-${progressBarId}`);
    const progressLabel = document.getElementById(`progress-label-${progressBarId}`);

    const percent = (currentAmount / goalAmount) * 100;

    progressBar.style.width = percent + "%";
    progressLabel.innerText = `${title} $${currentAmount} (${percent.toFixed(0)}%)`;
}

/* Slides */
const transitionEndEventName = GetTransitionEndEventName();

/**
* Makes the thread sleep for a specified time.
* @param {Number} ms How many milliseconds to sleep
*/
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

const sumValues = obj => Object.values(obj).reduce((a, b) => a + b, 0);


// TODO: refactor PlayGoalSlide and PlayWarSlide into 1 function with an enum param (war vs goal)

/**
* Creates, animates, and removes a slide for a goal incentive
* @param {String} title The name of the incentive
* @param {Object} incentiveObj The incentive object (needs at least a property for total and a property for goal)
* @param {Number} goalAmount The goal amount (denominator)
*/
async function PlayGoalSlide(title, incentiveObj) {
    let slideId = btoa(title);
    
    let slide = createIncentiveDiv(title);
    let bar = createProgressBar(slideId);
    slide.appendChild(bar);

    // Add the bar to the page
    let main = document.getElementsByTagName('main')[0];
    main.appendChild(slide);

    // Fade in
    await sleep(100);
    slide.style.opacity = 1;

    // Round the stuff
    let total = incentiveObj.total.toFixed(2);
    let goal = incentiveObj.goal.toFixed(2);

    // PULL THE LEVER, KRONK
    updateGoalProgressBar(slideId, total, goal);

    // Fade out
    await sleep(slideTimer);
    slide.style.opacity = 0;

    // When the transition is complete, we delete the DOM object.
    await new Promise((resolve) => {
        slide.addEventListener(transitionEndEventName, resolve, { once: true });
    });

    slide.remove();

    return Promise.resolve();
}

/**
* Creates, animates, and removes a slide for a goal incentive
* @param {String} title The name of the incentive
* @param {Array} arr Array of incentive objects (needs at least a property for total and a property for goal)
* @param {Number} goalAmount The goal amount (denominator)
*/
async function PlayWarSlide(title, choices) {
    let slide = createIncentiveDiv(title);

    let progressBarArr = []

    const sumChoices = sumValues(choices).toFixed(2);;

    for (const choice in choices) {
        let slideId = btoa(choice);
        slide.appendChild(createProgressBar(slideId));
    }
    
    // Add the bar to the page
    let main = document.getElementsByTagName('main')[0];
    main.appendChild(slide);

    // Fade in
    await sleep(100);
    slide.style.opacity = 1;

    // PULL THE LEVER, KRONK
    for (const choice in choices) {
        let slideId = btoa(choice);
        let currAmount = choices[choice].toFixed(2);
        updateWarProgressBar(slideId, currAmount, sumChoices, choice);
    }

    // Fade out
    await sleep(slideTimer);
    slide.style.opacity = 0;

    // When the transition is complete, we delete the DOM object.
    await new Promise((resolve) => {
        slide.addEventListener(transitionEndEventName, resolve, { once: true });
    });

    slide.remove();

    return Promise.resolve();
}

/* Main Thread */

async function PlaySlideshow(cacheData = null) {
    let data = cacheData;

    // Get live data if there's no cached data
    if (cacheData == null) data = await getProcessedData();

    // Parse through the data to determine goals vs bid wars
    for (const incentive of data) {
        let title = incentive.combinedname;
        let type = incentive.type.toLowerCase();

        if (type == "bid war") {
            let choices = incentive.choices;
            await PlayWarSlide(title, choices);
        } else if (type == "goal") {
            await PlayGoalSlide(title, incentive);
        }
    }
}

async function Main() {
    // How many times to cycle before we fetch new data
    let cacheMax = 3;
    let i = cacheMax;

    // Cash variable
    let cache;

    while (true) {
        if (i >= cacheMax) {
            cache = await PlaySlideshow();
            i = 0;
        } else {
            await PlaySlideshow(cache);
        }
        i++;
    }
}


Main();