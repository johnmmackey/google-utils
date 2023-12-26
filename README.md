# Google Utilities
A small library of useful classes for interfacing with Google APIs.

## Reading a Google Calendar
```
            const gc = new GoogleCalendar({
                clientEmail: ACCOUNT_EMAIL,
                privateKey: PRIVATE_KEY,
            });

   
            const events = await gc.getCal(
                CALENDAR_ID,
                START_DATE,
                [END_DATE]  // Defaults to START_DATE plus 1 year
            )
```

## Write a new event to calendar
```
            const gc = new GoogleCalendar({
                clientEmail: ACCOUNT_EMAIL,
                privateKey: PRIVATE_KEY,
            });
            
            let r = await gc.createEvent(
                CALENDAR_ID,
                {
                    title:'Test Event',
                    description: 'This is a test event',
                    start:  new Date(),
                    end: new Date(),
                    location: 'Test Location'
                }
            );
```

##
```
            const gc = new GoogleCalendar({
                clientEmail: ACCOUNT_EMAIL,
                privateKey: PRIVATE_KEY,
            });
            
            let r = await gc.deleteEvent(
                CALENDAR_ID,
                EVENT_ID
            );
```