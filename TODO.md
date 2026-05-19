# TODO - Backend (HabitForge)

- [ ] Understand backend entrypoint and route wiring (`server/server.js`, `server/routes/*`).
- [ ] Fix Express server syntax issues (route paths, PORT assignment, missing parentheses/quotes).
- [ ] Refactor `server/routes/habitroutes.js` from in-memory array to MongoDB using `server/models/habit.js`.
- [ ] Add remaining CRUD endpoints (GET list, GET by id, POST create, PATCH update, PATCH toggle/complete).
- [ ] Improve error handling consistency (404/500 JSON responses).
- [ ] Verify routes match frontend API calls (`/api/habits`, `/api/auth`).
- [ ] Run backend locally and test with simple HTTP calls / frontend.

