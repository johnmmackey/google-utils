'use strict';

const axios = require('axios');
const jwt = require('jsonwebtoken');
const debug = require('debug')('52west:GCal');

const { GoogleAccessTokenProvider } = require('./GoogleAccessTokenProvider');

const gCalScope = 'https://www.googleapis.com/auth/calendar';
const gCalEndpoint = 'https://www.googleapis.com/calendar/v3/calendars/';

class GoogleCalendar {

	constructor({ clientEmail, privateKey }) {
		debug('Creating new GoogleCalendar instance...')
		this.accessTokenProvider = new GoogleAccessTokenProvider({
			clientEmail,
			privateKey,
			scope: gCalScope
		});
	}

	// helper function.  Returns a promise of calendar data with metadata injected.  If eventId speced it gets instances (assumed recurring)
	async #readEvents(access_token, startDate, endDate, calId, eventId) {
		debug(`Reading google calendar ${calId}`);
		const config = {
			url: gCalEndpoint + calId + '/events' + (eventId ? '/' + eventId + '/instances' : ''),
			params: { timeMin: startDate, timeMax: endDate },
			headers: {
				'Authorization': 'Bearer ' + access_token
			}
		}
		const response = await axios(config);
		if (response.data.items.length)
			debug(`${response.data.items.length} calendar event(s) found. First: ${JSON.stringify(response.data.items[0], null, 2)}`);
		else
			debug(`No calendar events found`);
		return response.data.items;
	}

	async getEvents(calId, startDate, endDate) {
		if (!endDate) {
			endDate = (new Date(startDate))
			endDate.setFullYear(startDate.getFullYear() + 1);
		}

		debug(`Reading google calendar ${calId}`);
		debug(`...from ${startDate} - ${endDate}`);

		const access_token = await this.accessTokenProvider.get();

		let result = (await Promise.all(
			(await this.#readEvents(access_token, startDate, endDate, calId))
				.filter(e => !e.recurringEventId)												// take out any instances of recurrenence at top level - will get them again in next step.
				.filter(e => e.start.dateTime && e.end.dateTime)								// remove any "full day" items - hard to get TZ right
				.map(async event => event.recurrence											// for those that are recurring events, get the ind events.
					? await this.#readEvents(access_token, startDate, endDate, calId, event.id)	// map (await..) returns an array of Promises - need Promise.all above to resolve
					: event
				)
		))
			.reduce((a, b) => a.concat(b), [])										// flatten array to [event, event, event...] again in case some were recurring (event would be replaced by [events])
			.filter(e => e.status == "confirmed")								// and only take confirmed
			.map(e => ({														// map into a more digestable format
				id: e.id,
				title: e.summary,
				description: e.description,
				start: new Date(e.start.dateTime),
				end: new Date(e.end.dateTime),
				location: e.location
			}));

		debug(`getCal read ${result.length} events (after recurring flattening)`);
		if (result.length)
			debug(`First: ${JSON.stringify(result[0], null, 2)}`);

		return result;
	}

	async createEvent(calId, event) {
		debug(`Creating event ${JSON.stringify(event, null, 2)} on calendar ${calId}`);
		const access_token = await this.accessTokenProvider.get();

		const config = {
			method: 'POST',
			url: gCalEndpoint + calId + '/events',
			headers: {
				'Authorization': 'Bearer ' + access_token
			},
			data: {
				...(event.title && {summary: event.title}),
				...(event.description && {description: event.description}),
				...(event.location && {location: event.location}),
				...(event.colorId && {colorId: event.colorId}),
				start: {
					dateTime: event.start
				},
				end: {
					dateTime: event.end
				}
			}
		}
		let result = await axios(config);
		debug(`Created event ${result.data.id}`);
		return result;
	}

	async deleteEvent(calId, eventId) {
		debug(`Deleting event ${eventId} on calendar ${calId}`);
		const access_token = await this.accessTokenProvider.get();

		const config = {
			method: 'DELETE',
			url: gCalEndpoint + calId + '/events/' + eventId,
			headers: {
				'Authorization': 'Bearer ' + access_token
			}
		}
		let result = await axios(config);
		debug(`Deleted event ${eventId}`);
		return result;
	}
}

module.exports = { GoogleCalendar }