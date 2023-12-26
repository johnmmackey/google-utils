const assert = require('assert');

const { GoogleAccessTokenProvider, GoogleCalendar } = require('../index');

describe('Authorization Token', function () {

    describe('Check environment variables', function() {
        it('should be set', function() {
            envSet = process.env.GCAL_CLIENT_EMAIL && process.env.GCAL_PRIVATE_KEY && process.env.GCAL_OP_HOURS_CAL;
            assert.ok(envSet, "Required environment variables not set: see sample.env")
        })
    })

    describe('Bad parameters', function () {
        it('should throw an exception', async function () {
            assert.throws(() => new GoogleAccessTokenProvider(), Error, "Error thrown")
        });
    })

    describe('Valid parameters', function () {
        it('should return an access token', async function () {
            let accessTokenProvider = new GoogleAccessTokenProvider({
                clientEmail: process.env.GCAL_CLIENT_EMAIL,
                privateKey: process.env.GCAL_PRIVATE_KEY,
                scope: 'https://www.googleapis.com/auth/calendar'
            });
            const accessToken = await accessTokenProvider.get();
            assert.ok(accessToken, "Access token not obtained");
        });
    })
});

describe('Calendar Operations', function () {

    var eventId = null;
    
    describe('Create a calendar event', function() {
        it('should create a calendar event', async function () {
            const gc = new GoogleCalendar({
                clientEmail: process.env.GCAL_CLIENT_EMAIL,
                privateKey: process.env.GCAL_PRIVATE_KEY,
            });
            
            let r = await gc.createEvent(
                process.env.GCAL_OP_HOURS_CAL,
                {
                    title:'Test Event: ' + Date.now(),
                    description: 'This is a test event',
                    start:  new Date(),
                    end: new Date(),
                    location: 'Test Location'
                }
            );
            assert.ok(r.data.id, `no event appears to have been created`);
            eventId = r.data.id;
        })
    })

    
    describe('Read a calendar', function() {
        it('should read events from calendar', async function () {
            const gc = new GoogleCalendar({
                clientEmail: process.env.GCAL_CLIENT_EMAIL,
                privateKey: process.env.GCAL_PRIVATE_KEY,
            });

            let start = new Date();
            start.setSeconds(start.getSeconds() - 5);
            //console.log(new Date(), start)
        
            const events = await gc.getEvents(
                process.env.GCAL_OP_HOURS_CAL,
                start
            )

            assert.ok(events.length >= 1, `no events obtained`);
        })
    })

    describe('Delete a calendar event', function() {
        it('should delete a calendar event', async function () {
            const gc = new GoogleCalendar({
                clientEmail: process.env.GCAL_CLIENT_EMAIL,
                privateKey: process.env.GCAL_PRIVATE_KEY,
            });
            
            let r = await gc.deleteEvent(
                process.env.GCAL_OP_HOURS_CAL,
                eventId
            );
            assert.ok(true, `event deletion failed`);
        })
    })

    describe('Read an invalid calendar', function() {
        it('should return a 404 error', async function () {
            const gc = new GoogleCalendar({
                clientEmail: process.env.GCAL_CLIENT_EMAIL,
                privateKey: process.env.GCAL_PRIVATE_KEY,
            });

            let start = new Date();
            start.setSeconds(start.getSeconds() - 5);
            var errorCode = 0;
        
            try{
            const events = await gc.getEvents(
                process.env.GCAL_OP_HOURS_CAL+'1',
                start
            )
            } catch(err) {
                errorCode = err.response.status;
            }

            assert.ok(errorCode === 404, `Did not get expected 404 error`);
        })
    })
});

