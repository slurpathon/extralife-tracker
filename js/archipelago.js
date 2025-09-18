const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

// Get spreadsheet info
const sheetId = urlParams.get('sheetId');
const apiKey = urlParams.get('apiKey');
const range1 = "TeamRed!A:F";
const range2 = "TeamBlue!A:F";
const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchGet?ranges=${range1}&ranges=${range2}&dateTimeRenderOption=FORMATTED_STRING&majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE&key=${apiKey}`;
// // Get slide timer value
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

    //Pulling from two different sheet ranges so need to pull out the extra values
    let valueRanges = json.valueRanges;

    let data = [];
    for (const valueRange of valueRanges) {
        let values = valueRange.values;
        let sheetRange = valueRange.range
        let headerRow = values.splice(0, 1)[0];
        let team;
        headerRow.push("team");
        if (sheetRange.includes("Red")) {
            team = "red";
        } else {
            team = "blue";
        }

        for (const row of values) {
            let obj = {};
            for (let i = 0; i < headerRow.length; i++) {
                let headerCheck = headerRow[i].toLowerCase();
                if (headerCheck === 'team') {
                    obj[headerCheck] = team;
                } else {
                    obj[headerRow[i].toLowerCase()] = row[i];
                }
            }
            data.push(obj);
        }
    }

    return data;
}

// Remove past incentives from the object
function FilterCurrentHints(values) {
    // values.sort((a, b) => a[2] - b[2]);
    return values.filter(arr => arr.active === true);
}

// Convert string values to proper types
function ProcessValues(input) {

    let hints = [];

    for (let i = 0; i < input.length; i++) {
        let obj = input[i];
        hints.push(obj);
    }

    return hints;
}

async function getProcessedData() {
    return new Promise((resolve, reject) => {
        GetData().then(raw => {
            let filtered = FilterCurrentHints(raw);
            let parsed = ProcessValues(filtered);
            //data = CalculateBidWarTotals(parsed);
            resolve(parsed);
        });
    });
}

/* =================== Progress bars =================== */

// /**
// * Creates a parent div for a progress bar. 
// * @return {HTMLDivElement} The div containing the progress bar elements.
// */
function createHintDiv(title) {
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

// /**
// * Creates an inner div for a progress bar. Abstracted out because wars need multiple bars within one parent div.
// * @return {HTMLDivElement} The div containing the progress bar elements.
// */
function createIncentiveInnerDiv() {
    const incentiveInnerContainer = document.createElement('div');
    incentiveInnerContainer.classList.add("incentive-inner-container");
    return incentiveInnerContainer;
}


// /**
// * Creates a progress bar element
// * @param {String} title The text to appear above the progress bar
// * @param {String} id A unique ID to append to the divs that have ID attributes.
// * @return {HTMLDivElement} The div containing the progress bar elements.
// */
function createProgressBar(id, team) {

    const progressBarContainer = document.createElement('div');
    

    const progressBar = document.createElement('div');
    if (team === "blue") {
        progressBarContainer.classList.add("progress-bar-container-blue");
        progressBar.classList.add("progress-bar-blue");
    } else {
        progressBarContainer.classList.add("progress-bar-container-red");
        progressBar.classList.add("progress-bar-red");
    }

    progressBar.setAttribute('id', `progress-bar-${id}`);

    const progressLabel = document.createElement('span');
    progressLabel.classList.add("progress-label");
    progressLabel.setAttribute('id', `progress-label-${id}`);
    progressLabel.innerHTML = "$0";

    progressBar.appendChild(progressLabel);
    progressBarContainer.appendChild(progressBar);

    return progressBarContainer;
}

// /**
// * Updates a given progress bar element with incentive amounts (and goals)
// * @param {String} progressBarId The unique ID given to the progress bar when createProgressBar was called.
// * @param {Number} currentAmount The current amount raised (numerator)
// * @param {Number} goalAmount The goal amount (denominator)
// * @param {Boolean} hint The title of the hint
// */
async function updateProgressBar(progressBarId, currentAmount, goalAmount, hint) {
    // Wait for 1ms to trigger the initial animation.
    await new Promise(r => setTimeout(r, 1));

    const progressBar = document.getElementById(`progress-bar-${progressBarId}`);
    const progressLabel = document.getElementById(`progress-label-${progressBarId}`);

    let percent = (currentAmount / goalAmount) * 100;
    percent = isNaN(percent) ? 0 : percent;

    progressBar.style.width = percent + "%";

    progressLabel.innerText = `${hint} - ${currencySymbol}${currentAmount} / ${currencySymbol}${goalAmount}`;

}

/* =================== Slides =================== */

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


function CreateHintSlide (game, hint, team) {
    let slideName = game + "-" + hint + "-" + team; 
    let slideTitle;    
    slideTitle = `Team ${team.toUpperCase()} Needs a Hint for ${game}!!`
    let slide = createHintDiv(slideTitle);
    let slideId = btoa(slideName);
    let bar = createProgressBar(slideId, team);
    slide.appendChild(bar);
    return slide;
}

function UpdateHintSlide(slideName, incentiveObj) {
    let slideId = btoa(slideName);
    // Round the stuff
    let total = incentiveObj.total.toFixed(2);
    let goal = incentiveObj.goal.toFixed(2);
    let hint = incentiveObj.hint;
    // PULL THE LEVER, KRONK
    updateProgressBar(slideId, total, goal, hint);
}

/**
* Creates, animates, and removes a slide for a goal incentive
* @param {String} game name of the game
* @param {Array} hintObj of incentive objects (needs at least a property for total and a property for goal)
* @param {Number} goalAmount The goal amount (denominator)
* @param {String} hint hint for game
* @param {String} team the team 
*/
async function PlaySlide(game, hint, team, hintObj) {
    let slide;
    let slideId = game + "-" + hint + "-" + team;
    slide = CreateHintSlide (game, hint, team);
    // }

    // Add the bar to the page
    let main = document.getElementsByTagName('main')[0];
    main.appendChild(slide);

    // Fade in
    await sleep(100);
    slide.style.opacity = 1;

    // // PULL THE LEVER, KRONK

    UpdateHintSlide(slideId, hintObj);

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

/* =================== Main Thread =================== */

async function PlaySlideshow(cacheData = null) {
    let data = cacheData;

    // Get live data if there's no cached data
    if (cacheData == null) data = await getProcessedData();

    // Parse through the data to determine goals vs bid wars
    for (const incentive of data) {
        let game = incentive.game;
        let team = incentive.team.toLowerCase();
        let hint = incentive.hint;

        await PlaySlide(game, hint, team, incentive);
        
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