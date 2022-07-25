const settings = {
    rowLimit: '5',
    entityID: '60297',
    entityType: 'team',
    basePath: 'https://www.extra-life.org',
    currencySymbol: '$',
    currencyType: 'USD',
    allowTeamDonations: false,
    participantQuery: '?limit=7',
    teamQuery: '?limit=7'
}

let cacheMaxDate;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Recent Activity associated with a Participant or Team.
 *
 * @param {string} type The kind of data we want (activity, donations, donors, )
 * @param {string} entityType The entity type (events, participants, teams)
 * @param {number} id The entity's identifier
 * @return {object} json result.
 */
async function GetData(type, entityType, id, limit = 50) {
    const endpoint = `/api/${entityType}/${id}/${type}?limit=${limit}`;
    let result = await CallApi(endpoint);
    return result;
}

/**
 * Get team information
 *
 * @param {number} id The team's identifier
 * @return {object} json result.
 */
async function GetTeam(id) {
    const endpoint = `/api/teams/${id}`;
    let result = await CallApi(endpoint);
    return result;
}

/**
 * Generic API fetcher
 *
 * @param {string} endpoint The endpoint to fetch
 * @return {object} json result.
 */
async function CallApi(endpoint) {
    let response = await fetch(settings.basePath + endpoint);
    let json = await response.json();

    return json;
}

/**
 * Update the donation button's text
 */
function UpdateDonationLink() {
    let donateButton = document.getElementById('donate-button');
    donateButton.textContent = 'Donate';
    let donateURL = `${settings.basePath}/index.cfm?fuseaction=donorDrive.${settings.entityType}&${settings.entityType}ID=${settings.entityID}`;
    donateButton.setAttribute('href', donateURL);
    donateButton.setAttribute('target', "_blank");
}

/**
 * Update the name of the team
 * 
 * @param {string} team Team object returned by DonorDrive API
 */
function UpdateDisplayName(team) {
    document.getElementById('display-name').textContent = team.name;
    CalcProgressBar(team.sumDonations, team.fundraisingGoal);
    document.getElementById('profile__progress-bar-raised').innerHTML = `Raised: ${this.FormatCurrency(team.sumDonations, 0, 0)}`;
    document.getElementById('profile__progress-bar-remaining').innerHTML = `${this.FormatCurrency(team.fundraisingGoal - team.sumDonations, 0, 0)} Remaining`;
    document.getElementById('profile__progress-bar-goal').innerHTML = 'Goal: ' + this.FormatCurrency(team.fundraisingGoal, 0, 0);
}

/**
 * Calculate the donation progress bar percentage
 * 
 * @param {float} progress How much money has been raised
 * @param {float} target The campaign's goal
 */
function CalcProgressBar(progress, target) {
    var element = document.getElementById("profile__progress-bar-progress");
    var width = Math.ceil(progress / target * 100);

    if (width >= 100) {
        element.style.width = '100%';
    } else {
        element.style.width = width + '%';
    }
}

/**
 * Format string as currency
 * 
 * @param {float} amount How much money has been raised
 */
function FormatCurrency(amount) {
    return amount.toLocaleString('en-CA', { style: 'currency', currency: settings.currencyType });
}

/**
 * Format string as currency
 * 
 * @param {object} donationArr The donations object returned from the DonorDrive API
 */
function UpdateLeaderboard(donationArr) {
    let newDonations
    if (cacheMaxDate) {
        newDonations = donationArr.filter(dono => new Date(dono.createdDateUTC) > cacheMaxDate);
    } else {
        // First pull, need to reverse array.
        newDonations = donationArr.reverse();
    }
    cacheMaxDate = GetMaxDate(donationArr);

    if (newDonations.length > 0) {
        newDonations.forEach(dono => AddRow(dono));
    }
}

async function AddRow(donation) {
    var table = document.getElementById('js-top-donors-list');
    var row = '';
    var donor = '';
    var amount = '';

    row = document.createElement('li');

    donor = document.createElement('span');
    donor.classList.add('charity-leaderboard__donor-name');
    donor.innerHTML = `${donation.displayName ? donation.displayName : 'N/A'} (${jQuery.timeago(donation.createdDateUTC)})`;

    amount = document.createElement('span');
    amount.classList.add('charity-leaderboard__donation-amount');
    amount.innerHTML = donation.amount ? this.FormatCurrency(donation.amount, 2, 2) : 'N/A';

    message = document.createElement('span');
    message.classList.add('charity-leaderboard__message');
    message.innerHTML = donation.message ? donation.message : '';

    row.appendChild(donor);
    row.appendChild(amount);
    row.appendChild(message);
    row.classList.add('new-box');
    table.insertBefore(row, table.firstChild);

    // Clean up rows if we have more than we need.
    while(table.children.length > settings.rowLimit) {
        table.removeChild(table.children[table.children.length - 1]);
    }
}

function GetMaxDate(arr) {
    const maxDate = new Date(
        Math.max(
            ...arr.map(element => {
                return new Date(element.createdDateUTC);
            }),
        ),
    );
    return maxDate;
}

(async () => {
    let team = await GetTeam(settings.entityID);
    let donos = await GetData('donations', 'teams', settings.entityID, 7);

    UpdateDonationLink();
    UpdateDisplayName(team);
    UpdateLeaderboard(donos);

    //! TEST DATA
    await sleep(5000);
    donos = await test(donos);
    await sleep(5000);
    donos = await test(donos);
    
})();
    
async function test(donoarr) {
    let newdono =
    {
        "displayName": "Name",
        "participantID": 4024,
        "amount": Math.floor(Math.random() * 100),
        "donorID": "EB8610A3FC435D58",
        "avatarImageURL": "https://static.donordrive.com/clients/try/img/avatar-constituent-default.gif",
        "createdDateUTC": new Date().toISOString(),
        "eventID": 581,
        "message": "something",
        "teamID": 5074,
        "donationID": "DF4E676D0828A8D5"
    };
    donoarr.unshift(newdono);
    UpdateLeaderboard(donoarr);
    return donoarr;
}