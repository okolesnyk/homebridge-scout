const JWT = require('jsonwebtoken');
const Pusher = require('pusher-js');
const request = require('request-promise-native');

const BASE_URL = 'https://api.scoutalarm.com/';
const PUSHER_APP_KEY = 'baf06f5a867d462e09d4';
const PUSHER_AUTH_ENDPOINT = BASE_URL + 'auth/pusher';

function buildPath() {
    return Array.from(arguments).join('/');
}

function ScoutApi(logger, email, password) {
    this.logger = logger;
    this.email = email;
    this.password = password;
    this.request = request.defaults({
        baseUrl: BASE_URL,
        json: true,
    });
}

ScoutApi.prototype.auth = async function() {
    if (this.jwt) {
        let expires = new Date(JWT.decode(this.jwt).exp * 1000);
        let now = new Date();

        if (now.getTime() > expires.getTime()) {
            this.logger.info("Scout API JWT has expired.");

            this.jwt = null;
        }
    }

    if (!this.jwt) {
        this.logger.info("Requesting a Scout API auth token…");

        let result = (await this.request({
            uri: 'auth',
            method: 'POST',
            body: {
                email: this.email,
                password: this.password,
            },
        }));

        this.jwt = result.jwt;
    }

    return this.jwt;
};

ScoutApi.prototype.getMemberId = async function() {
    let jwt = await this.auth();

    return JWT.decode(jwt).id;
};

ScoutApi.prototype.getMemberLocations = async function() {
    let jwt = await this.auth();
    let memberId = await this.getMemberId();

    return await this.request({
        uri: buildPath('members', memberId, 'locations'),
        headers: {
            Authorization: jwt,
        },
    });
};

ScoutApi.prototype.getLocationHub = async function(locationId) {
    let jwt = await this.auth();

    return await this.request({
        uri: buildPath('locations', locationId, 'hub'),
        headers: {
            Authorization: jwt,
        },
    });
};

ScoutApi.prototype.getLocationDevices = async function(locationId) {
    let jwt = await this.auth();

    return await this.request({
        uri: buildPath('locations', locationId, 'devices'),
        headers: {
            Authorization: jwt,
        },
    });
};

ScoutApi.prototype.getLocationModes = async function(locationId) {
    let jwt = await this.auth();

    return await this.request({
        uri: buildPath('locations', locationId, 'modes'),
        headers: {
            Authorization: jwt,
        },
    });
};

ScoutApi.prototype.chirpHub = async function(hubId) {
    let jwt = await this.auth();

    return await this.request({
        uri: buildPath('hubs', hubId, 'chirp'),
        method: 'PUT',
        headers: {
            Authorization: jwt,
        },
        body: {
            type: 'single',
        },
    });
};

ScoutApi.prototype.setMode = async function(modeId, arm) {
    let jwt = await this.auth();

    return await this.request({
        uri: buildPath('modes', modeId),
        method: 'POST',
        headers: {
            Authorization: jwt,
        },
        body: {
            state: arm ? 'arming' : 'disarm',
        },
    });
};

ScoutApi.prototype.subscribe = async function(locationId) {
    if (!this.pusher) {
        let jwt = await this.auth();

        this.pusher = new Pusher(PUSHER_APP_KEY, {
            authEndpoint: PUSHER_AUTH_ENDPOINT,
            auth: {
                headers: {
                    Authorization: jwt,
                }
            }
        });
    }

    return this.pusher.subscribe('private-' + locationId);
};

module.exports = ScoutApi;