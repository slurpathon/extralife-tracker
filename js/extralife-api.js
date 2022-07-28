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
 * Format string as currency
 * 
 * @param {float} amount How much money has been raised
 */
function FormatCurrency(amount) {
    return amount.toLocaleString('en-CA', { style: 'currency', currency: settings.currencyType });
}
