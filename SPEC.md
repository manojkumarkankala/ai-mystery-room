# AI Mystery Room — Project Specification

## 1. Overview
AI Mystery Room is an AI-powered detective game. A player enters a mystery premise, selects a difficulty, investigates suspects and evidence, requests limited hints, and accuses a suspect. Gemini generates the case; the backend validates it and keeps the culprit and explanation private until the accusation is submitted.

## 2. Target users and experience
- Mystery and detective-game fans
- Students learning full-stack and AI application development
- Casual players who want short, replayable cases

The experience should be responsive, clear, accessible, and playable on desktop and mobile.

## 3. Features
### Required
- Home page and create-mystery form
- Easy, Medium, Hard difficulty selection
- Gemini-generated title, story, suspects, clues, hints, culprit, and explanation
- Investigation screen with suspects and undiscovered evidence
- Discover clue action and hint action
- Final accusation screen
- Backend-calculated verdict and score
- Results screen and Play Again
- API and database error handling

### Optional future enhancements
- Player accounts and case history
- Leaderboards and achievements
- Timed investigations
- Sound effects and animations
- Admin moderation and AI generation analytics

## 4. Technology
- Frontend: React, Vite, Tailwind CSS, Axios
- Backend: Node.js, Express
- Database: MongoDB Atlas, Mongoose
- AI: Google Gemini through `@google/genai`
- Validation: Zod
- Hosting: Vercel (frontend), Render (backend), MongoDB Atlas (database)

## 5. User flow
1. Player opens Home.
2. Player selects Start Mystery.
3. Player enters a premise (10–500 characters) and difficulty.
4. Backend asks Gemini to generate structured JSON.
5. Backend validates counts, IDs, and culprit reference.
6. Backend saves the case; only public case data is returned.
7. Player reads the story and suspect profiles.
8. Player discovers clues; each clue can be discovered once.
9. Player can request hints in order, up to the difficulty limit.
10. Player selects one suspect and submits one final accusation.
11. Backend calculates verdict and score and completes the case.
12. Results reveal culprit, explanation, and score.
13. Player can create another case.

## 6. Difficulty and scoring
| Difficulty | Suspects | Clues | Hints | Correct base score |
|---|---:|---:|---:|---:|
| Easy | 3 | 5 | 2 | 100 |
| Medium | 4 | 7 | 3 | 150 |
| Hard | 5 | 9 | 3 | 200 |

Correct accusation score:
`max(0, base score + discovered clues * 5 - hints used * 10)`

Incorrect accusation score: `0`.

The score is calculated only by the backend. A clue contributes once. A completed case cannot be accused again.

## 7. UI / pages
### Home
- Brand and game introduction
- Start button
- Feature summary

### Create Mystery
- Premise textarea
- Difficulty selector
- Generate/loading state
- Validation and API error messages

### Investigation Room
- Case title and story
- Suspect cards
- Clue cards with locked/discovered state
- Hint action and remaining count
- Investigation progress

### Accusation
- Suspect selection
- Confirmation that accusation is final
- Submit/loading state

### Results
- Correct/incorrect verdict
- Culprit and explanation
- Score breakdown
- Play Again

All pages must work on narrow screens. Buttons must have disabled/loading states and errors must be understandable.

## 8. API
Base URL: `/api`

### `GET /health`
Response: `{ "status": "ok", "service": "AI Mystery Room API" }`

### `POST /cases`
Request:
```json
{
  "premise": "A valuable diamond disappears from a locked museum...",
  "difficulty": "easy"
}
```
Response `201`: `{ "message": "Mystery generated successfully", "game": { ...public case... } }`

### `GET /cases/:id`
Returns active public case data. Does not return culprit, solution, or the unused hint list.

### `POST /cases/:id/clues/:clueId/discover`
Discovers a clue once and returns its description. Repeated requests do not add another score bonus.

### `POST /cases/:id/hints`
Returns the next hint only. Each successful request consumes one hint.

### `POST /cases/:id/accuse`
Request: `{ "suspectId": "suspect_1" }`
Returns verdict, culprit, explanation, and backend score. One accusation completes the case.

### `GET /cases/:id/result`
Returns 403 until the case is completed; after completion, returns the final result.

## 9. Database model
A Case document stores:
- title, premise, story, difficulty
- suspects and clues
- private hints array
- private culprit ID and explanation
- discovered clue IDs and hints-used count
- accusation, verdict, score, status, timestamps

Private fields use Mongoose `select: false` and are explicitly selected only in server-side operations that need them. Public API serializers must never expose them.

## 10. AI output contract
Gemini must return JSON with:
- `title`, `story`
- `suspects`: `id`, `name`, `age`, `occupation`, `description`, `motive`
- `clues`: `id`, `title`, `description`, `location`
- `hints`: strings
- `culpritId`
- `explanation`

The server validates schema, exact difficulty counts, unique IDs, valid culprit reference, and bounded field lengths. Invalid output is rejected; it is not saved. Logical quality still requires human testing.

## 11. Security and limitations
- Gemini API key and MongoDB URI stay on the server.
- Culprit ID, explanation, and unused hints are never included in active-case responses.
- Server calculates score and validates actions.
- This starter is an educational MVP: it does not include accounts or case ownership. Anyone who obtains a case ID may be able to access that case. Add authentication, ownership checks, rate limiting, and request throttling before public production use.
- Do not commit `.env` files.
- Configure MongoDB Atlas network access securely for the deployed backend.

## 12. Acceptance criteria
- All difficulty levels generate exact suspect/clue/hint counts.
- Active-case responses do not expose the culprit, explanation, or unused hints.
- Clues are discoverable and count once.
- Hints are returned one at a time and cannot exceed the limit.
- Accusation is accepted once and only for a valid suspect.
- Backend calculates correct/incorrect score according to this specification.
- Results are blocked before accusation.
- UI handles loading, empty, and error states.
- Complete flow works on the deployed website.
