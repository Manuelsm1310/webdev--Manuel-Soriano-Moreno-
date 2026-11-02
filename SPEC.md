# FIP Project


## Project option
Study groups

## Goals
- A member signs in, sees the upcoming activities, and can successfully join one that has free places.
- An organizer can create a new activity with a specific capacity limit and view the list of signed-up members.
## Non-goals
- No payments: the service is completely free.
- No email or push notifications: users must check the website manually.
- No mobile app: it is a responsive web application.
## Constraints
- Stack: Node.js backend with Express, SQLite/PostgreSQL database, and plain HTML/JavaScript for the UI.
- Passwords must be stored strictly as bcrypt hashes, never as readable plain text in the database.
## The model feature
- Model: Gemini 2.5 Flash, called from services.
- Input: text description of an event.
- Output: a suggested formal title and date.
- When it fails: if the API is slow, rate-limited, or fails, the form is left empty with a message asking the user to type the details manually.

## Auth
- Local: e-mail and password, stored as a bcrypt hash.
- Provider: Sign in with Google using OAuth.
- Linking: matched on Google's account ID. If signed in both ways, they are merged into one account.

## MCP tools
| Tool | What it does | Who may call it |
| --- | --- | --- |
| `upcoming_events` | Lists events in the future with the number of free places left in each. | anyone |
| `my_registrations` | Lists the events the signed-in member has signed up for. | the token's owner |
| `register` | Signs the member up for an event, refusing one that is already full. | the token's owner |

## UI
Stack: Node with plain HTML and CSS. Three screens: sign in, the list of upcoming events, one event with its sign-up button. The checklist is in `docs/UI.md`.

## Architecture


## Acceptance criteria

- [AC-1] A signed-in member who opens `/events` sees only events whose date is in the future.
- [AC-2] A member who signs up for an event with no free places sees the message "This event is full", and no new row appears in the registrations table.
- [AC-3] An organizer who opens an event sees the list of members signed up for it.
- [AC-4] A member who is already signed up and presses sign up again gets 409 and still has one row.
- [AC-5] Signing in with Google using an address that already has a password account signs into that account.
- [AC-6] With no model key set, the form fields are left empty and show a fallback note.
- [AC-7] The MCP tool register refuses a full event with the same message the API returns.
- [AC-8] Cancelling a registration frees the place immediately.

### Slice 1: sign-in and <list screen>
- [AC-9] A visitor who opens `/events` without signing in lands on `/login` instead.
- [AC-10] After signing in with a seeded account, `/events` shows the three seeded events.
- [AC-11] Deleting one event row in the database and reloading `/events` removes that event from the screen.
## Traceability


## Spec vs result
- Passed: sign-in, the redirect to `/login`, the list of events read from the table.
- Missed: the agent also showed past events.
- Changed: the first criterion now explicitly says "only events whose date is in the future".
