# extralife-tracker

Work in progress.

This is a simple tracker for Extra Life donations for Slurpathon.

- [x] Web tracker - index.html
    - [x] Remove sample data
- [x] Stream overlay - counter.html  (or counter.html?dark for use on dark BGs)
    - [x] Remove sample data
- [x] Top/Recent tracker - ticker.html  (or ticker.html?dark for use on dark BGs)
- [ ] Incentive tracker
- [ ] Bid war tracker

## Endpoints

| Endpoint     | Description                      | Parameters                                                                           | Example                                      |
|--------------|----------------------------------|--------------------------------------------------------------------------------------|----------------------------------------------|
| index.html   | List of donations, progress bar. | `type` = participant \| team \| event<br />`id` = Extra Life ID            | https://slurpathon.github.io/extralife-tracker/index.html?type=team&id=61499                |
| counter.html | Counter of total sum raised.     | `type` = participant \| team \| event<br />`id` = Extra Life ID<br />`dark` = dark mode (light text) | Light BG: https://slurpathon.github.io/extralife-tracker/counter.html?type=participant&id=485795 <br /> Dark BG: https://slurpathon.github.io/extralife-tracker/counter.html?type=participant&id=485795&dark |
| ticker.html  | Top Donor / most recent donation. Taken from the EL overlay and for use as an isolated component. | `type` = participant \| team \| event<br />`id` = Extra Life ID<br />`dark` = dark mode (light text) | Light BG: https://slurpathon.github.io/extralife-tracker/ticker.html?type=team&id=61499 <br /> Dark BG: https://slurpathon.github.io/extralife-tracker/ticker.html?type=team&id=61499&dark |

All endpoints auto update every 30s.

## Credits

* Much learning was acquired from the [Extra Life Stream Overlay](https://www.extra-life.org/index.cfm?fuseaction=donorDrive.streamingOverlay&eventID=547&participantID=485795)