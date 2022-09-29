if (typeof DonorDrive == 'undefined') {
    var DonorDrive = {};
}
DonorDrive.API = {
    apiVersion: '1.3',
    basePath: '',
    bundle: {},
    globalHeaders: {},
    headers: {},
    method: '',
    refreshInterval: 30,
    savedEndpoints: {},
    buildEndpoint: function(endpoint, argument) {
        switch (endpoint) {
            case 'event':
                return 'events/' + argument;
                break;
            case 'eventActivity':
                return 'events/' + argument + '/activity';
                break;
            case 'eventDonations':
                return 'events/' + argument + '/donations';
                break;
            case 'eventDonors':
                return 'events/' + argument + '/donors';
                break;
            case 'eventGroupsEvents':
                return 'eventgroups/' + argument + '/events';
                break;
            case 'eventGroupsParticipants':
                return 'eventgroups/' + argument + '/participants';
                break;
            case 'eventGroupsTeams':
                return 'eventgroups/' + argument + '/teams';
                break;
            case 'eventParticipants':
                return 'events/' + argument + '/participants';
                break;
            case 'eventTeams':
                return 'events/' + argument + '/teams';
                break;
            case 'participant':
                return 'participants/' + argument;
                break;
            case 'participantActivity':
                return 'participants/' + argument + '/activity';
                break;
            case 'participantBadges':
                return 'participants/' + argument + '/badges';
                break;
            case 'participantDonations':
                return 'participants/' + argument + '/donations';
                break;
            case 'participantDonors':
                return 'participants/' + argument + '/donors';
                break;
            case 'participantImpact':
                return 'participants/' + argument + '/impact';
                break;
            case 'participantIncentives':
                return 'participants/' + argument + '/incentives';
                break;
            case 'participantMilestones':
                return 'participants/' + argument + '/milestones';
                break;
            case 'participants':
                return 'participants';
                break;
            case 'team':
                return 'teams/' + argument;
                break;
            case 'teamActivity':
                return 'teams/' + argument + '/activity';
                break;
            case 'teamBadges':
                return 'teams/' + argument + '/badges';
                break;
            case 'teamDonations':
                return 'teams/' + argument + '/donations';
                break;
            case 'teamDonors':
                return 'teams/' + argument + '/donors';
                break;
            case 'teamParticipants':
                return 'teams/' + argument + '/participants';
                break;
            case 'teams':
                return 'teams';
                break;
            default:
                return 'participants';
        }
    },
    checkForUpdates: function(key) {
        if (!DonorDrive.API.savedEndpoints[key].hasOwnProperty('url')) {
            console.warn('Invalid endpoint url for "' + key + '"');
            var deferred = $.Deferred();
            deferred.reject();
            return deferred;
        }
        return $.ajax({
            type: 'GET',
            url: DonorDrive.API.savedEndpoints[key].url,
            beforeSend: function(xhr) {
                xhr.setRequestHeader('If-None-Match', DonorDrive.API.savedEndpoints[key].etag);
            },
            complete: function(xhr) {
                if (xhr.status == 200) {
                    DonorDrive.API.savedEndpoints[key].etag = xhr.getResponseHeader('Etag');
                    if (DonorDrive.API.savedEndpoints[key].hasOwnProperty('promise') && xhr.getResponseHeader('Last-Modified') != DonorDrive.API.savedEndpoints[key].promise.getResponseHeader('Last-Modified')) {
                        DonorDrive.API.savedEndpoints[key].promise = xhr;
                        $('body').trigger(DonorDrive.API.savedEndpoints[key].updateEventName, DonorDrive.API.savedEndpoints[key].promise);
                    }
                } else if (xhr.status == 404) {
                    DonorDrive.API.unWatch();
                }
            }
        });
    },
    execute: function(options) {
        if (typeof options === 'undefined') {
            options = {};
        }
        var url = this.basePath + this.baseEndpoint,
            additionalClauses = this.limitClause + this.offsetClause + this.orderByClause + this.whereClause;
        if (additionalClauses.length > 0) {
            url = url + (url.indexOf('?') >= 0 ? additionalClauses : additionalClauses.replace("&", "?"));
        }
        var hashedEndpoint = this.hash(url);
        if (!this.savedEndpoints.hasOwnProperty(hashedEndpoint)) {
            this.savedEndpoints[hashedEndpoint] = {};
        }
        if (!this.savedEndpoints[hashedEndpoint].hasOwnProperty('promise') || url != this.savedEndpoints[hashedEndpoint].url || (typeof options.refreshEndpoint !== 'undefined' && options.refreshEndpoint)) {
            var promise = $.ajax({
                type: this.method,
                url: url,
                headers: $.extend({}, this.headers, this.globalHeaders),
                cache: false,
                complete: function(xhr) {
                    DonorDrive.API.savedEndpoints[hashedEndpoint].etag = xhr.getResponseHeader('Etag');
                }
            });
            if (typeof options.saveEndpoint !== 'undefined' && !options.saveEndpoint) {
                return promise;
            }
            $.extend(this.savedEndpoints[hashedEndpoint], {
                endpoint: this.baseEndpoint,
                promise: promise,
                url: url
            });
        }
        return this.savedEndpoints[hashedEndpoint].promise;
    },
    get: function(endpoint, argument) {
        this.validateConfig();
        this.baseEndpoint = this.apiVersion + '/' + this.buildEndpoint(endpoint, argument);
        this.method = 'get';
        this.limitClause = '';
        this.offsetClause = '';
        this.orderByClause = '';
        this.whereClause = '';
        return this;
    },
    hash: function(string) {
        return string.replace(/[^a-z0-9]/ig, '_');
    },
    limit: function(limit) {
        this.limitClause = '&limit=' + limit;
        return this;
    },
    offset: function(offset) {
        this.offsetClause = '&offset=' + offset;
        return this;
    },
    orderBy: function(statement) {
        this.orderByClause = '&orderBy=' + encodeURIComponent(statement);
        return this;
    },
    refreshData: function() {
        var key, prerequisiteHashedEndpoint, updateQueue = {};
        for (key in this.savedEndpoints) {
            if (this.savedEndpoints[key].autoRefresh) {
                if (DonorDrive.API.savedEndpoints[key].prerequisiteEndpoint) {
                    prerequisiteHashedEndpoint = this.hash(DonorDrive.API.savedEndpoints[key].prerequisiteEndpoint);
                    if (!updateQueue.hasOwnProperty(prerequisiteHashedEndpoint)) {
                        if (!DonorDrive.API.savedEndpoints.hasOwnProperty(prerequisiteHashedEndpoint)) {
                            DonorDrive.API.savedEndpoints[prerequisiteHashedEndpoint] = {
                                endpoint: DonorDrive.API.savedEndpoints[key].prerequisiteEndpoint,
                                promise: promise,
                                url: this.basePath + DonorDrive.API.savedEndpoints[key].prerequisiteEndpoint
                            };
                        }
                        if (!DonorDrive.API.savedEndpoints[prerequisiteHashedEndpoint].hasOwnProperty('autoRefresh')) {
                            DonorDrive.API.savedEndpoints[prerequisiteHashedEndpoint].autoRefresh = true;
                        }
                        updateQueue[prerequisiteHashedEndpoint] = [];
                    }
                    updateQueue[prerequisiteHashedEndpoint].push(key);
                } else {
                    if (!updateQueue.hasOwnProperty(key)) {
                        updateQueue[key] = [];
                    }
                }
            }
        }
        for (key in updateQueue) {
            DonorDrive.API.checkForUpdates(key).done(function(d, t, x) {
                if (x.status == 200) {
                    for (var i = 0; i < updateQueue[key].length; i++) {
                        DonorDrive.API.checkForUpdates(updateQueue[key][i]);
                    }
                }
            });
        }
    },
    unWatch: function() {
        var url = this.basePath + this.baseEndpoint,
            additionalClauses = this.limitClause + this.offsetClause + this.orderByClause + this.whereClause;
        if (additionalClauses.length > 0) {
            url = url + (url.indexOf('?') >= 0 ? additionalClauses : additionalClauses.replace("&", "?"));
        }
        var hashedEndpoint = this.hash(url);
        if (!this.savedEndpoints.hasOwnProperty(hashedEndpoint)) {
            this.savedEndpoints[hashedEndpoint] = {};
        }
        this.savedEndpoints[hashedEndpoint].autoRefresh = false;
        clearInterval(window.apiIntervalCheck);
        return this;
    },
    validateConfig: function() {
        if (!this.basePath) {
            throw new Error('API config invalid. Please define a basePath for the object.');
        }
        return this;
    },
    watch: function(eventName) {
        var url = this.basePath + this.baseEndpoint,
            additionalClauses = this.limitClause + this.offsetClause + this.orderByClause + this.whereClause;
        if (additionalClauses.length > 0) {
            url = url + (url.indexOf('?') >= 0 ? additionalClauses : additionalClauses.replace("&", "?"));
        }
        var hashedEndpoint = this.hash(url),
            prerequisiteEndpoint;
        if (!this.savedEndpoints.hasOwnProperty(hashedEndpoint)) {
            this.savedEndpoints[hashedEndpoint] = {};
        }
        if (url.match(/(.*\/(events|participants|teams)\/\d+(\/\w+.*)$)/ig)) {
            prerequisiteEndpoint = url.replace(/((.*\/(events|participants|teams)\/\d+)(\/\w+.*)$)/ig, '$2');
        }
        $.extend(this.savedEndpoints[hashedEndpoint], {
            autoRefresh: true,
            prerequisiteEndpoint: prerequisiteEndpoint,
            updateEventName: eventName
        });
        if (!window.apiIntervalCheck) {
            window.apiIntervalCheck = setInterval(function() {
                DonorDrive.API.refreshData();
            }, DonorDrive.API.refreshInterval * 1000);
        }
        return this;
    },
    where: function(statement) {
        this.whereClause = '&where=' + encodeURIComponent(statement);
        return this;
    }
}