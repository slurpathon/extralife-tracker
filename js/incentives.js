const sheetId = "1TfXc0pIIUl0W5HcKnWHPRx4TlbHueX2DWg8yvtjAEeY";
const apiKey = "";
const range = "DB!A:G";
const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?dateTimeRenderOption=FORMATTED_STRING&majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE&key=${apiKey}`;

const incentivesToShow = 3;

(async () => {
    let json = await GetData();
    let values = json.values;
    let parsed = ParseSheet(values);
    let filtered = FilterCurrentIncentives(parsed);
    //console.log(filtered);
    GroupIncentives(values);
})();

// Grab data from Google Sheets API
async function GetData() {
    const res = await fetch(sheetUrl, {
        cache: "no-store"
    });

    let json = await res.json();

    return json;
}

// Convert string values to proper types
function ParseSheet(input) {
    // Get headers, remove spaces, set lower case
    let headers = input.splice(0, 1)[0].map(el => el.replace(/\s/g, '').toLowerCase());

    let incentives = [];

    for(let i=0; i<input.length; i++) {
        let row = input[i];

        let obj = {
            game: row[0],
            type: row[1],
            cutoff: Date.parse(row[2]) || null,
            goal: row[3] == "" ? 0 : row[3],
            total: row[4] == "" ? 0 : row[4],
            choice: row[5],
            description: row[6]
        }
        
        incentives[i].combinedname = incentives[i].game + " - " + incentives[i].description;
    }

    return incentives;
}

// Remove past incentives from the object
function FilterCurrentIncentives(values) {
    let now = Date.now();
    // values.sort((a, b) => a[2] - b[2]);
    return values.filter(arr => arr.cutofftime > now);
}

function GroupIncentives(values) {
    let wars = GroupBidWars(values);
    let goals = GroupGoals(values);

    let incentives = Object.assign(wars, goals);
}

// Pulls the bid wars
function GroupBidWars(input) {
    let rawbidwars = input.filter(arr => arr[1].toLowerCase() === "bid war");
    let bidwars = {};
    rawbidwars.forEach(row => {
        let game = row[0];
        let cutoff = row[2];
        let total = row[4];
        let choice = row[5];
        let description = row[6];

        let name = game + " - " + description;
        
        bidwars[name] = bidwars[name] || {};

        bidwars[name].bids[choice] = total;
        bidwars[name].cutoff = cutoff;
        bidwars[name].type = 'war';
    });
}

// Pulls the rote goals
function GroupGoals(input) {
    let rawgoals = input.filter(arr => arr[1].toLowerCase() === "goal");
    let goals = {};

    rawgoals.forEach(row => {
        let game = row[0];
        let cutoff = row[2];
        let goal = row[3];
        let total = row[4];
        let description = row[6];

        let name = game + " - " + description;
        
        goals[name] = goals[name] || {};

        goals[name].goal = goal;
        goals[name].total = total;
        goals[name].cutoff = cutoff;
        goals[name].type = 'goal';
    });
}