# Google Utilities
A small library of useful classes for interfacing with Google APIs.

# Install
```bash
$ npm install @johnmmackey/google-utils
```

# Usage


## Google Calendar Access

Before any operations can be performed, a calendar class must be instantiated:
```js
    const gc = new GoogleCalendar({
        clientEmail,
        privateKey,
    });
```
where:
* `clientEmail` is a string containing email address used for authentication - may be a service account address
* `privateKey` is a string containing the RSA private key associated with the account ('\n' line delimited)

The GoogleCalendar class manages the details of obtaining, caching, and refreshing the access token required by the Google API.

### Reading a Google Calendar: 
```
    const events = await gc.getEvents(calendarId, startDate, [endDate])
```
where:
* `calendarId` is a string representing the id of the google calendar
* `startDate` is a Javascript Date object representing the start of the search window
* `endDate` (optional) a Javascript Date object representing the end of the search window. If not specified, defaults to `startDate` + 1 year

`getEvents` is aynchronous and returns a Promise which resolves to an array of event objects with the following structure (all properties are strings):
* `id`: Google ID of the event
* `title`: The title of the event. Note that the Google API refers to this as the "summary"
* `description`: Notes associated with the event
* `start`: start time of the event encoded in ISO8601 format
* `end`: start time of the event encoded in ISO8601 format
* `location`: textual location of the event

See the note below regarding the supported event types.

### Write a new event to calendar
```
    let r = await gc.createEvent(
        calendarId,
        {
            title:'Test Event',
            description: 'This is a test event',
            start:  new Date(),
            end: new Date(),
            location: 'Test Location'
        }
    );
```
The property definitions are the same as the above. Note that the `start` and `end` values can be submitted as Javascript Date() objects as they are automatically serialized to ISO8601 format.

The `createEvent` method is asynchronous. The returned Promise resolves to an object with the notable property `data.id`, which is the `id` of the newly created event.

### Delete an event
```
    let r = await gc.deleteEvent(calendarId, eventId)
```
The parameter definitions are as above.

The `deleteEvent` method is asynchronous. The returned Promise resolves to an object with diagnostic information only.

### Recurring and Full Day Events
Recurring events can be read, but they are *flattened* into individual events (each with their own `id`). Recurring events cannot be created. Instances of recurring events can be deleted. Full Day events are not supported, as they involve timezone ambiguity issues.

### Error handling
The `getCal`, `createEvent`, and `deleteEvent` methods will throw an exception if an error is encountered. Potentially useful properties of the `Error` object:
* `response.status`: the HTTP error code
* `response.statusText`: the equivalent in textual form
* `response.data`: (if present): an object contain further diagnostic information

## Debugging
This package uses the [debug](https://github.com/debug-js/debug) package to allow consumers to get diagnostic information. Set the `DEBUG` environment variable to a comma-delimited set of keywords to get diagnostic data from various modules.
The current defined keywords are:
* `52west:GCal`: for diagnostics from the Google Calendar class and related API interface
* `52west:GAuth`: for the supporting authorization token mechanisms.

Full diagnostics example:
```bash
DEBUG=52west:GCal,52west:GAuth node my-consuming-app.js
```