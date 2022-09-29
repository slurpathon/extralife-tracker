// For index.html


(async () => {
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