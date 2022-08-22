const sheetId = "1TfXc0pIIUl0W5HcKnWHPRx4TlbHueX2DWg8yvtjAEeY";
const apiKey = "";
const range = "DB!A:G";
const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?dateTimeRenderOption=FORMATTED_STRING&majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE&key=${apiKey}`;

const incentivesToShow = 3;

(async () => {
    let json = await GetData();
    let values = json.values;

    // remove headers
    values.splice(0, 1);

    let filtered = FilterCurrentIncentives(values);
    let parsed = ParseSheet(filtered);

    SetDiv(parsed);
    console.log(parsed);
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

    let incentives = {};

    for (let i = 0; i < input.length; i++) {
        let row = input[i];

        let obj = {
            game: row[0],
            type: row[1],
            visible: row[2] || false,
            goal: row[3] == "" ? 0 : row[3],
            total: row[4] == "" ? 0 : row[4],
            choice: row[5],
            description: row[6]
        }

        obj.combinedname = obj.game + " - " + obj.description;

        if (obj.type.toLowerCase() == "bid war") {
            // Create object if not exists
            if (!incentives.hasOwnProperty(obj.combinedname))
                incentives[obj.combinedname] = {
                    type: "war",
                    choices: {}
                };

            incentives[obj.combinedname].choices[obj.choice] = obj.total;

        } else if (obj.type.toLowerCase() == "goal") {
            incentives[obj.combinedname] = {
                type: "goal",
                goal: obj.goal,
                total: obj.total
            };
        }
    }

    return incentives;
}

// Remove past incentives from the object
function FilterCurrentIncentives(values) {
    // values.sort((a, b) => a[2] - b[2]);
    return values.filter(arr => arr[2] === true);
}

function SetDiv(values) {
    let div = document.getElementById("incentive-bar");
    if (div.firstChild) {
        // It has at least one child
    } else {
        for (const property in values) {
            //console.log(`${property}: ${values[property]}`);
            let child = BuildDiv(property, values[property]);
            div.appendChild(child);
        }
    }
}

// https://thomaswilburn.github.io/viz-book/css-flex.html
function BuildDiv(property, values) {
    const colors = [
        "#EAB8D5",
        "#CC3F61",
        "#52C6DC",
        "#EB75A6",
        "#BA7A39",
        "#92E3F2",
        "#46220F",
        "#D59D88",
        "#F3EAF9"
    ]
    let child = document.createElement("div");
    if (values.type == "war") {
        child.className = "bar-container";

        let sumValues = Object.values(values.choices).reduce((a, b) => a + b);

        let i = 0;
        for (const option in values.choices) {
            let choice = document.createElement("div");
            choice.className = "bar";
            choice.style = `flex-basis: ${(values.choices[option] / sumValues) * 100}%; background-color: ${colors[i]}`;
            choice.innerHTML = option + ": " + values.choices[option];
            child.appendChild(choice);
            i++;
        }

        console.log("");
    } else if (values.type == "goal") {
        child.className = "bar-container";
        
        let choice = document.createElement("div");
        let remainder = document.createElement("div");

        choice.className = "bar";
        let percentage = (values.total / values.goal) * 100
        choice.style = `flex-basis: ${percentage}%; background-color: salmon; justify-content: right;`;
        let text = property + ": " + values.total + " / " + values.goal;

        if(percentage < 40) {
            remainder.innerHTML = text;
        } else {
            choice.innerHTML = text;
        }

        // fill the rest of the bar with a transparent value
        remainder.className = "bar";
        remainder.style = `flex-basis: ${100 - percentage}%; justify-content: left;`;
        
        child.appendChild(choice);
        child.appendChild(remainder);

        console.log(percentage);
    }
    return child;
}