// For counter.html
// Depends on extralife-api.js

import { CountUp } from "./countup.min.js";
const options = {
    decimalPlaces: 2,
    prefix: '$',
}
let counter = new CountUp('counter', 0, options);

// Global variables
//let counter = document.getElementById('counter');
let raised = 0;


async function CheckTotals() {
    let team = await GetTeam(settings.entityID);
    let newRaised = team.sumDonations;
    if (newRaised > raised) {
        counter.update(newRaised);
        raised = newRaised;
    }
}

async function test(num) {
    await sleep(3000);
    counter.update(num);
}

// Our main function
async function main() {
    // Check for dark mode
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const dark = (urlParams.get('dark') != null);

    if (dark) {
        document.getElementById('counter').classList.add('dark');
    }

    counter.start();

    // Update counter
    //CheckTotals();

    // Check every 30 seconds.
    //setInterval(CheckTotals, 30000);

    //! TEST DATA
    await test(51);
    await test(61);
    await test(70.5);
    await test(70.98);
    await test(1000000);

}

main();

