# CalmDown AI Frontend

This is a self-contained frontend prototype for a mental well-being support app.

## Included in the UI

- Emotion check-in textarea
- Webcam section with facial expression capture flow
- Sentiment and stress scoring dashboard
- Weekly mood tracking view
- Personalized recommendations for breathing, music, reading, movies, and reset routines
- Support response panel with responsible-AI messaging

## Files

- `index.html` - structure and content
- `styles.css` - responsive visual design
- `app.js` - frontend behavior, scoring logic, mood history, webcam flow

## AI Integration Notes

- Text analysis is currently frontend heuristic logic inside `app.js`
- Webcam uses browser `getUserMedia`
- Facial expression detection is wired for `face-api` through CDN and includes a fallback demo estimate
- Mood history is stored in browser `localStorage`

## How to Run

Open `index.html` in a browser, or serve the folder with any static server.

## Good Backend Upgrade Points

- Replace heuristic sentiment scoring with your trained NLP model or API
- Replace demo facial fallback with a production emotion-detection model
- Save check-ins, recommendations, and risk flags in a secure backend
- Add crisis escalation rules and clinician-approved guidance
