'use strict';

const axios = require('axios');
const debug = require('debug')('52west:GAuth');
const jwt = require('jsonwebtoken');
const { jSTrimMask } = require('@johnmmackey/general-utils');

const gTokenAud = 'https://www.googleapis.com/oauth2/v4/token';

class GoogleAccessTokenProvider {
	/*
	* config object:
	*  - clientEmail
	*  - privateKey
	*  - scope
	*/
	constructor(config) {
		debug('Creating new access token manager');
		if (!config || (typeof config !== 'object') || !config.clientEmail || !config.privateKey || !config.scope) {
			debug('Invalid construction: must pass config object with members clientEmail, privateKey and scope of type string.');
			throw new Error('Invalid construction: must pass config object with members clientEmail, privateKey and scope of type string. Throwing.');
		}
		this.clientEmail = config.clientEmail;
		this.privateKey = config.privateKey;
		this.scope = config.scope;
		this.gToken = '';
		this.gTokenExp = 0;
	}

	async get() {
		debug('Getting access token...')
		const now = Math.floor(Date.now() / 1000);		// current UNIX timestamp.

		// check if we already have a valid one (assume 5 min reasonable validity)
		if (this.gToken && this.gTokenExp > (now + 5 * 60)) {
			debug(`Using cached Google access token ${this.gToken}`);
			return Promise.resolve(this.gToken);
		}

		const payload = {
			iss: this.clientEmail,
			scope: this.scope,
			aud: gTokenAud,
			exp: now + 3600,
			iat: now
		}

		const reqtoken = jwt.sign(payload, this.privateKey.replace(/\\n/g, '\n'), { algorithm: 'RS256' });

		const options = {
			url: gTokenAud,
			method: 'POST',
			data: {
				grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
				assertion: reqtoken

			}
		}

		try {
			const response = await axios(options);
			debug(`axios status: ${JSON.stringify(response.status)}, response data: ${JSON.stringify(response.data, jSTrimMask({ trim: 60 }), 2)}`);
			this.gToken = response.data?.access_token;
			this.gTokenExp = response.data?.expires_in ? (now + response.data?.expires_in - 5 * 60) : 0;
		} catch (err) {
			debug(`Caught an axios error: ${err.message}`);
			if (err.response)
				debug(`Axios response status: ${err.response.status}`)
			if (err.response.data)
				debug(`Axios response data: ${JSON.stringify(err.response.data, null, 2)}`);
			throw err;
		}

		return this.gToken;
	};
}

module.exports = { GoogleAccessTokenProvider }