const emotionInput = document.getElementById("emotionInput");
const analyzeButton = document.getElementById("analyzeButton");
const demoFillButton = document.getElementById("demoFillButton");
const startCameraButton = document.getElementById("startCameraButton");
const stopCameraButton = document.getElementById("stopCameraButton");
const captureButton = document.getElementById("captureButton");
const toggleCameraButton = document.getElementById("toggleCameraButton");
const webcamVideo = document.getElementById("webcamVideo");
const cameraStatus = document.getElementById("cameraStatus");
const cameraMessage = document.getElementById("cameraMessage");
const breathingExerciseButton = document.getElementById("breathingExerciseButton");
const breathingPanel = document.getElementById("breathingPanel");
const closeBreathingButton = document.getElementById("closeBreathingButton");
const breathingText = document.getElementById("breathingText");


const dominantEmotion = document.getElementById("dominantEmotion");
const sentimentScore = document.getElementById("sentimentScore");
const stressIndex = document.getElementById("stressIndex");
const supportMode = document.getElementById("supportMode");
const recommendationGrid = document.getElementById("recommendationGrid");
const supportResponse = document.getElementById("supportResponse");
const moodBars = document.getElementById("moodBars");
const expressionOutput = document.getElementById("expressionOutput");
const expressionHint = document.getElementById("expressionHint");

const heroMoodLabel = document.getElementById("heroMoodLabel");
const heroStressScore = document.getElementById("heroStressScore");
const heroSummary = document.getElementById("heroSummary");
const metricSentiment = document.getElementById("metricSentiment");
const metricRisk = document.getElementById("metricRisk");

const chips = [...document.querySelectorAll(".chip")];

let cameraStream = null;
let faceApiReady = false;
const historyStorageKey = "calmdown-ai-mood-history";


const defaultMoodHistory = [
  { day: "Mon", value: 44 },
  { day: "Tue", value: 58 },
  { day: "Wed", value: 52 },
  { day: "Thu", value: 48 },
  { day: "Fri", value: 60 },
  { day: "Sat", value: 42 },
  { day: "Sun", value: 36 },
];
const moodHistory = loadMoodHistory();

const recommendationLibrary = {
  high: [
    {
      tag: "Breathing",
      title: "4-6 calming breath cycle",
      text: "Inhale for 4 seconds, exhale for 6 seconds, and repeat for 3 minutes to lower physical tension.",
    },
    {
      tag: "Music",
      title: "Lo-fi or soft piano focus mix",
      text: "Choose slow instrumental music with low intensity to reduce overstimulation during anxious moments.",
    },
    {
      tag: "Reading",
      title: "Gentle reflective book",
      text: "Try a comforting, low-pressure read such as short essays or reflective fiction that does not demand heavy focus.",
    },
    {
      tag: "Reset",
      title: "Screen-off recovery routine",
      text: "Step away for 10 minutes, hydrate, stretch your shoulders, and look away from your devices before returning to work.",
    },
  ],
  medium: [
    {
      tag: "Routine",
      title: "Structured micro-break plan",
      text: "Use a 25-minute focus block followed by a 5-minute reset with breathing or a short walk.",
    },
    {
      tag: "Audio",
      title: "Nature or ambient playlist",
      text: "Rain sounds, ocean ambience, or acoustic playlists can make concentration feel less strained.",
    },
    {
      tag: "Movies",
      title: "Lighthearted comfort watch",
      text: "Pick a familiar feel-good movie or series episode that feels emotionally safe and relaxing.",
    },
    {
      tag: "Mindset",
      title: "Thought download journal",
      text: "Write down worries in short bullet points, then circle only the ones that need action today.",
    },
  ],
  low: [
    {
      tag: "Balance",
      title: "Mood maintenance walk",
      text: "A short outdoor walk with no notifications can help preserve calm and prevent stress build-up.",
    },
    {
      tag: "Focus",
      title: "Positive playlist rotation",
      text: "Keep a small personal playlist of grounding songs ready for transitions between work and rest.",
    },
    {
      tag: "Reading",
      title: "Inspirational short read",
      text: "Choose uplifting articles or a few pages of a meaningful book to maintain emotional steadiness.",
    },
    {
      tag: "Care",
      title: "Daily gratitude prompt",
      text: "Write one thing that felt difficult and one thing that still went well today to keep perspective balanced.",
    },
  ],
};

const distressLexicon = {
  high: [
    "anxious",
    "panic",
    "worthless",
    "hopeless",
    "alone",
    "depressed",
    "overwhelmed",
    "exhausted",
    "burnout",
    "crying",
    "can't cope",
    "cannot cope",
    "stressed",
    "helpless",
  ],
  medium: [
    "tired",
    "worried",
    "pressure",
    "upset",
    "restless",
    "nervous",
    "drained",
    "confused",
    "frustrated",
    "sad",
  ],
  positive: [
    "hopeful",
    "calm",
    "grateful",
    "better",
    "relieved",
    "focused",
    "supported",
    "okay",
  ],
};

function renderMoodHistory() {
  moodBars.innerHTML = moodHistory
    .map(
      (entry) => `
        <div class="mood-bar">
          <div class="mood-bar-fill" style="height: ${Math.max(entry.value, 18)}%;"></div>
          <label>${entry.day}</label>
        </div>
      `
    )
    .join("");
}

function loadMoodHistory() {
  try {
    const saved = localStorage.getItem(historyStorageKey);
    const parsed = saved ? JSON.parse(saved) : null;

    if (Array.isArray(parsed) && parsed.length) {
      return parsed.slice(-7);
    }
  } catch (error) {
    console.error("Mood history could not be restored:", error);
  }

  return [...defaultMoodHistory];
}

function saveMoodHistory() {
  try {
    localStorage.setItem(historyStorageKey, JSON.stringify(moodHistory));
  } catch (error) {
    console.error("Mood history could not be saved:", error);
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function titleCase(value) {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function analyzeText(text) {
  const normalized = text.trim().toLowerCase();

  if (!normalized) {
    return {
      emotion: "Neutral",
      sentiment: 50,
      stress: 18,
      risk: "Low",
      support: "Gentle check-in",
      response: "A quick emotional check-in will help the assistant tailor calming suggestions.",
      recommendations: recommendationLibrary.low,
    };
  }

  let sentiment = 50;
  let stress = 25;
  let highHits = 0;
  let mediumHits = 0;
  let positiveHits = 0;

  distressLexicon.high.forEach((term) => {
    if (normalized.includes(term)) {
      highHits += 1;
    }
  });

  distressLexicon.medium.forEach((term) => {
    if (normalized.includes(term)) {
      mediumHits += 1;
    }
  });

  distressLexicon.positive.forEach((term) => {
    if (normalized.includes(term)) {
      positiveHits += 1;
    }
  });

  sentiment = clamp(50 - highHits * 16 - mediumHits * 8 + positiveHits * 10, 0, 100);
  stress = clamp(25 + highHits * 18 + mediumHits * 9 - positiveHits * 6 + normalized.length / 18, 0, 100);

  let emotion = "Reflective";
  let risk = "Low";
  let support = "Gentle check-in";
  let response =
    "You sound fairly steady overall. A small recovery activity can help preserve that sense of calm.";
  let recommendations = recommendationLibrary.low;

  if (stress >= 70 || sentiment <= 20) {
    emotion = "High Distress";
    risk = "High";
    support = "Immediate calming support";
    response =
      "Your check-in suggests elevated stress and emotional overload. The interface should respond with grounding exercises, low-pressure support, and clear pathways to human help if things feel unsafe.";
    recommendations = recommendationLibrary.high;
  } else if (stress >= 45 || sentiment <= 45) {
    emotion = "Strained";
    risk = "Moderate";
    support = "Structured support";
    response =
      "Your words suggest that tension is building. The assistant should acknowledge that clearly, offer practical coping options, and keep the next step simple rather than overwhelming.";
    recommendations = recommendationLibrary.medium;
  } else if (positiveHits > 0) {
    emotion = "Stable";
    risk = "Low";
    support = "Mood maintenance";
    response =
      "You appear relatively balanced right now. The best support is to reinforce routines that keep your energy and focus steady.";
    recommendations = recommendationLibrary.low;
  }

  return { emotion, sentiment, stress, risk, support, response, recommendations };
}

function renderRecommendations(cards) {
  recommendationGrid.innerHTML = cards
    .map(
      (item) => `
        <article class="recommendation-card">
          <span class="tag">${item.tag}</span>
          <strong>${item.title}</strong>
          <p>${item.text}</p>
        </article>
      `
    )
    .join("");
}

function updateHero(result, expressionLabel) {
  heroMoodLabel.textContent = result.emotion;
  heroStressScore.textContent = `${Math.round(result.stress)}%`;
  heroSummary.textContent = `${result.response} Facial cue: ${expressionLabel}.`;
  metricSentiment.textContent =
    result.sentiment >= 60 ? "Positive" : result.sentiment >= 35 ? "Mixed" : "Negative";
  metricRisk.textContent = result.risk;
}

function getTodayLabel() {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date());
}

function applyAnalysis(expressionLabel = "Not captured yet", shouldTrack = false) {
  const result = analyzeText(emotionInput.value);

  dominantEmotion.textContent = result.emotion;
  sentimentScore.textContent = `${Math.round(result.sentiment)} / 100`;
  stressIndex.textContent = `${Math.round(result.stress)} / 100`;
  supportMode.textContent = result.support;
  supportResponse.textContent = result.response;

  if (shouldTrack) {
    moodHistory.push({
      day: getTodayLabel(),
      value: Math.round(result.stress),
    });
    while (moodHistory.length > 7) {
      moodHistory.shift();
    }
    saveMoodHistory();
  }

  renderMoodHistory();
  renderRecommendations(result.recommendations);
  updateHero(result, expressionLabel);
}

async function loadFaceApiModels() {
  if (!window.faceapi) {
    expressionHint.textContent =
      "Face expression library not loaded. The UI still supports webcam capture and backend integration.";
    return false;
  }

  try {
    const modelBase = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";
    await Promise.all([
      window.faceapi.nets.tinyFaceDetector.loadFromUri(modelBase),
      window.faceapi.nets.faceExpressionNet.loadFromUri(modelBase),
    ]);
    faceApiReady = true;
    expressionHint.textContent =
      "Expression model loaded. Capture a frame to estimate calm, happy, neutral, sad, or fearful cues.";
    return true;
  } catch (error) {
    console.error("Face model failed to load:", error);
    expressionHint.textContent =
      "Webcam works, but the face emotion model could not load. Hook this UI to your preferred browser model or API.";
    return false;
  }
}

async function startCamera() {
  if (cameraStream) {
    return;
  }

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    webcamVideo.srcObject = cameraStream;
    cameraStatus.textContent = "Camera on";
    cameraMessage.textContent = "Camera is live. Capture a frame to estimate facial emotion cues.";
    await loadFaceApiModels();
  } catch (error) {
    console.error("Camera access failed:", error);
    cameraStatus.textContent = "Camera blocked";
    cameraMessage.textContent =
      "Camera permission was denied or is unavailable. The rest of the emotional support flow still works without it.";
  }
}

function stopCamera() {
  if (!cameraStream) {
    return;
  }

  cameraStream.getTracks().forEach((track) => track.stop());
  webcamVideo.srcObject = null;
  cameraStream = null;
  cameraStatus.textContent = "Camera off";
  cameraMessage.textContent = "Turn on the camera so the frontend can estimate facial emotion cues.";
}

async function detectExpression() {
  if (!cameraStream) {
    expressionOutput.textContent = "Start camera first";
    return;
  }

  if (faceApiReady && window.faceapi) {
    try {
      const detection = await window.faceapi
        .detectSingleFace(webcamVideo, new window.faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detection?.expressions) {
        const sorted = Object.entries(detection.expressions).sort((a, b) => b[1] - a[1]);
        const [label, confidence] = sorted[0];
        const prettyLabel = `${titleCase(label)} (${Math.round(confidence * 100)}%)`;
        expressionOutput.textContent = prettyLabel;
        applyAnalysis(prettyLabel, true);
        return;
      }
    } catch (error) {
      console.error("Expression detection failed:", error);
    }
  }

  const fallbackExpressions = ["Neutral", "Slightly tense", "Calm", "Low energy", "Focused"];
  const picked = fallbackExpressions[Math.floor(Math.random() * fallbackExpressions.length)];
  expressionOutput.textContent = `${picked} (demo estimate)`;
  expressionHint.textContent =
    "Showing a demo estimate because no live face expression result was returned. Replace this with your production facial model.";
  applyAnalysis(`${picked} (demo estimate)`, true);
}

demoFillButton.addEventListener("click", () => {
  emotionInput.value =
    "I have been feeling overwhelmed with classes and deadlines. I am tired, anxious, and finding it hard to switch off my thoughts at night.";
  applyAnalysis(expressionOutput.textContent, true);
});

analyzeButton.addEventListener("click", () => {
  applyAnalysis(expressionOutput.textContent, true);
});

startCameraButton.addEventListener("click", startCamera);
toggleCameraButton.addEventListener("click", startCamera);
stopCameraButton.addEventListener("click", stopCamera);
captureButton.addEventListener("click", detectExpression);
breathingExerciseButton.addEventListener("click", startBreathingExercise);
closeBreathingButton.addEventListener("click", closeBreathingExercise);

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    emotionInput.value = chip.dataset.text || "";
    applyAnalysis(expressionOutput.textContent, true);
  });
});
let breathingInterval = null;

function startBreathingExercise() {
  breathingPanel.classList.remove("hidden");
  let inhale = true;
  breathingText.textContent = "Breathe In";

  breathingInterval = setInterval(() => {
    inhale = !inhale;
    breathingText.textContent = inhale ? "Breathe In" : "Breathe Out";
  }, 4000);
}

function closeBreathingExercise() {
  breathingPanel.classList.add("hidden");
  clearInterval(breathingInterval);
}

renderMoodHistory();
renderRecommendations(recommendationLibrary.low);
applyAnalysis();
