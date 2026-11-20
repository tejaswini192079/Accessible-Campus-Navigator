"use strict";

/* PATHABLE - Accessible Campus Navigator
   Demonstration prototype using sample campus data.
*/

const $ = (id) => document.getElementById(id);

const locations = {
  gate: { name: "Main Gate", x: 70, y: 365 },
  reception: { name: "Reception", x: 300, y: 380 },
  library: { name: "Library", x: 525, y: 350 },
  cafeteria: { name: "Cafeteria", x: 90, y: 90 },
  blockA: { name: "Academic Block A", x: 300, y: 90 },
  blockB: { name: "Academic Block B", x: 525, y: 90 },
  classroom: { name: "Classroom 204", x: 390, y: 210 }
};

// Each connection has a distance in estimated prototype minutes.
// accessible:false means the connection is not available in step-free mode.
const connections = [
  { from: "gate", to: "reception", minutes: 3, accessible: true },
  { from: "reception", to: "library", minutes: 4, accessible: true },
  { from: "gate", to: "cafeteria", minutes: 5, accessible: true },
  { from: "cafeteria", to: "blockA", minutes: 4, accessible: true },
  { from: "blockA", to: "blockB", minutes: 3, accessible: true },
  { from: "blockB", to: "library", minutes: 4, accessible: true },
  { from: "reception", to: "blockA", minutes: 3, accessible: true },
  { from: "blockA", to: "classroom", minutes: 2, accessible: false, lift: true },
  { from: "blockB", to: "classroom", minutes: 4, accessible: true },
  { from: "cafeteria", to: "reception", minutes: 5, accessible: true },
  { from: "reception", to: "classroom", minutes: 6, accessible: true }
];

let currentRoute = null;
let currentDirections = [];
let toastTimer = null;

// ---------- General helpers ----------

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

function setFeedback(id, message) {
  const element = $(id);
  if (element) element.textContent = message;
}

function getSelectedMode() {
  return document.querySelector('input[name="routeMode"]:checked')?.value || "fastest";
}

// ---------- Mobile navigation ----------

$("menuToggle").addEventListener("click", () => {
  const nav = $("navLinks");
  const isOpen = nav.classList.toggle("open");

  $("menuToggle").setAttribute("aria-expanded", String(isOpen));
  $("menuToggle").textContent = isOpen ? "✕" : "☰";
  $("menuToggle").setAttribute(
    "aria-label",
    isOpen ? "Close navigation menu" : "Open navigation menu"
  );
});

document.querySelectorAll("#navLinks a").forEach((link) => {
  link.addEventListener("click", () => {
    $("navLinks").classList.remove("open");
    $("menuToggle").setAttribute("aria-expanded", "false");
    $("menuToggle").textContent = "☰";
    $("menuToggle").setAttribute("aria-label", "Open navigation menu");
  });
});

// ---------- Route calculation: Dijkstra's algorithm ----------

function getNeighbours(locationId, stepFreeOnly) {
  return connections.filter((edge) => {
    const connected =
      edge.from === locationId || edge.to === locationId;

    if (!connected) return false;

    if (stepFreeOnly && !edge.accessible) return false;

    // A reported broken lift blocks the sample lift connection.
    if (edge.lift && getLiftStatus() !== "working") return false;

    return true;
  });
}

function calculateRoute(start, destination, stepFreeOnly) {
  const distances = {};
  const previous = {};
  const unvisited = new Set(Object.keys(locations));

  Object.keys(locations).forEach((id) => {
    distances[id] = Infinity;
    previous[id] = null;
  });

  distances[start] = 0;

  while (unvisited.size > 0) {
    let current = null;
    let smallestDistance = Infinity;

    for (const id of unvisited) {
      if (distances[id] < smallestDistance) {
        smallestDistance = distances[id];
        current = id;
      }
    }

    if (current === null || smallestDistance === Infinity) break;
    if (current === destination) break;

    unvisited.delete(current);

    const neighbours = getNeighbours(current, stepFreeOnly);

    neighbours.forEach((edge) => {
      const next = edge.from === current ? edge.to : edge.from;

      if (!unvisited.has(next)) return;

      const newDistance = distances[current] + edge.minutes;

      if (newDistance < distances[next]) {
        distances[next] = newDistance;
        previous[next] = current;
      }
    });
  }

  if (distances[destination] === Infinity) return null;

  const path = [];
  let current = destination;

  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  return {
    path,
    minutes: distances[destination],
    stepFree: stepFreeOnly
  };
}

function getRouteInstructions(path) {
  return path.map((locationId, index) => {
    if (index === 0) {
      return `Start at ${locations[locationId].name}.`;
    }

    if (index === path.length - 1) {
      return `You have reached ${locations[locationId].name}.`;
    }

    return `Continue towards ${locations[locationId].name}.`;
  });
}

// ---------- Display route ----------

function renderRoute(route) {
  const result = $("result");
  const instructions = getRouteInstructions(route.path);

  currentDirections = instructions;

  const listItems = instructions
    .map((instruction) => `<li>${instruction}</li>`)
    .join("");

  const modeText = route.stepFree
    ? "♿ Step-free route"
    : "⚡ Fastest available route";

  result.innerHTML = `
    <div class="route-summary">
      <strong>✓ Route found successfully</strong>
      <p>${modeText} · Estimated ${route.minutes} minutes</p>
      <p>${locations[route.path[0]].name} → ${locations[route.path[route.path.length - 1]].name}</p>
      <ol>${listItems}</ol>
    </div>
  `;

  drawRoute(route.path);
  updateMapSelection(route.path[0], route.path[route.path.length - 1]);

  setFeedback("voiceStatus", "Your directions are ready. Press Read directions to hear them.");
}

function drawRoute(path) {
  const svg = $("routeLines");
  svg.innerHTML = "";

  if (!path || path.length < 2) return;

  const points = path
    .map((id) => `${locations[id].x},${locations[id].y}`)
    .join(" ");

  const namespace = "http://www.w3.org/2000/svg";

  const line = document.createElementNS(namespace, "polyline");
  line.setAttribute("points", points);
  svg.appendChild(line);

  [path[0], path[path.length - 1]].forEach((id, index) => {
    const circle = document.createElementNS(namespace, "circle");
    circle.setAttribute("cx", locations[id].x);
    circle.setAttribute("cy", locations[id].y);
    circle.setAttribute("r", "9");
    circle.setAttribute("fill", index === 0 ? "#f2a36f" : "#188567");
    svg.appendChild(circle);
  });
}

function updateMapSelection(start, destination) {
  document.querySelectorAll(".map-building").forEach((building) => {
    building.classList.remove("selected-start", "selected-end");
  });

  const mapClasses = {
    gate: ".building-gate",
    reception: ".building-reception",
    library: ".building-library",
    cafeteria: ".building-cafe",
    blockA: ".building-a",
    blockB: ".building-b",
    classroom: ".building-class"
  };

  $( "campusMap" ).querySelector(mapClasses[start])?.classList.add("selected-start");
  $("campusMap").querySelector(mapClasses[destination])?.classList.add("selected-end");
}

// ---------- Route form ----------

$("routeForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const start = $("from").value;
  const destination = $("to").value;
  const stepFree = getSelectedMode() === "stepfree";

  if (start === destination) {
    $("result").innerHTML =
      '<div class="route-error">Please select two different locations.</div>';
    showToast("Choose a different destination.");
    return;
  }

  const route = calculateRoute(start, destination, stepFree);

  if (!route) {
    currentRoute = null;
    currentDirections = [];
    $("result").innerHTML =
      '<div class="route-error">No suitable route was found with these sample campus connections. Try another destination or check the lift status.</div>';
    $("routeLines").innerHTML = "";
    showToast("No route found. Try another destination.");
    setFeedback("voiceStatus", "There are no directions available.");
    return;
  }

  currentRoute = route;
  renderRoute(route);
  showToast("Your sample campus route is ready.");
});

$("swapBtn").addEventListener("click", () => {
  const from = $("from");
  const to = $("to");

  const oldFrom = from.value;
  from.value = to.value;
  to.value = oldFrom;

  showToast("Starting point and destination swapped.");
});

$("resetMapBtn").addEventListener("click", () => {
  $("routeLines").innerHTML = "";
  $("result").innerHTML = `
    <div class="result-empty">
      <span>🧭</span>
      <div>
        <strong>Your route will appear here</strong>
        <small>Select two locations and press Find my route.</small>
      </div>
    </div>
  `;

  document.querySelectorAll(".map-building").forEach((building) => {
    building.classList.remove("selected-start", "selected-end");
  });

  currentRoute = null;
  currentDirections = [];
  stopVoice();
  setFeedback("voiceStatus", "Map reset. Select a new route.");
  showToast("Map has been reset.");
});

// ---------- Voice guidance ----------

function stopVoice() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

$("speakBtn").addEventListener("click", () => {
  if (!currentDirections.length) {
    showToast("Find a route before starting voice guidance.");
    setFeedback("voiceStatus", "No route selected yet.");
    return;
  }

  if (!("speechSynthesis" in window)) {
    setFeedback("voiceStatus", "Your browser does not support voice guidance.");
    showToast("Voice guidance is not supported in this browser.");
    return;
  }

  stopVoice();

  const speech = new SpeechSynthesisUtterance(
    "PathAble navigation. " + currentDirections.join(" ")
  );

  speech.lang = "en-IN";
  speech.rate = 0.9;
  speech.pitch = 1;

  speech.onstart = () => {
    setFeedback("voiceStatus", "Voice guidance is playing.");
  };

  speech.onend = () => {
    setFeedback("voiceStatus", "Voice guidance completed.");
  };

  speech.onerror = () => {
    setFeedback("voiceStatus", "Voice guidance could not be played.");
  };

  window.speechSynthesis.speak(speech);
});

$("stopBtn").addEventListener("click", () => {
  stopVoice();
  setFeedback("voiceStatus", "Voice guidance stopped.");
  showToast("Voice guidance stopped.");
});

// ---------- Accessibility controls ----------

$("contrastBtn").addEventListener("click", () => {
  const enabled = document.body.classList.toggle("high-contrast");
  $("contrastBtn").classList.toggle("active", enabled);

  setFeedback(
    "accessFeedback",
    enabled ? "High contrast is enabled." : "High contrast is disabled."
  );

  showToast(enabled ? "High contrast enabled." : "High contrast disabled.");
});

$("fontBtn").addEventListener("click", () => {
  const enabled = document.body.classList.toggle("large-text");
  $("fontBtn").classList.toggle("active", enabled);

  setFeedback(
    "accessFeedback",
    enabled ? "Larger text is enabled." : "Default text size restored."
  );

  showToast(enabled ? "Text size increased." : "Text size restored.");
});

$("resetAccessBtn").addEventListener("click", () => {
  document.body.classList.remove("high-contrast", "large-text");
  $("contrastBtn").classList.remove("active");
  $("fontBtn").classList.remove("active");

  setFeedback("accessFeedback", "All accessibility settings have been reset.");
  showToast("Accessibility settings reset.");
});

// ---------- Lift status and issue reporting ----------

const LIFT_STORAGE_KEY = "pathable-lift-status";

function getLiftStatus() {
  try {
    return localStorage.getItem(LIFT_STORAGE_KEY) || "working";
  } catch {
    return "working";
  }
}

function saveLiftStatus(status) {
  try {
    localStorage.setItem(LIFT_STORAGE_KEY, status);
  } catch {
    setFeedback("updateFeedback", "Browser storage is unavailable. This update may not remain after refreshing.");
  }
}

function updateLiftDisplay() {
  const status = getLiftStatus();
  const pill = $("liftStatus");
  const description = $("liftDescription");

  pill.className = "status-pill";

  if (status === "working") {
    pill.textContent = "Working";
    description.textContent = "The sample lift is marked as working.";
  } else if (status === "pending") {
    pill.textContent = "Pending";
    pill.classList.add("pending");
    description.textContent = "An issue has been reported and awaits verification.";
  } else {
    pill.textContent = "Needs attention";
    pill.classList.add("broken");
    description.textContent = "The sample lift is marked as unavailable.";
  }
}

$("reportBtn").addEventListener("click", () => {
  const confirmed = window.confirm(
    "Report an issue with the Academic Block A lift in this demonstration?"
  );

  if (!confirmed) return;

  saveLiftStatus("pending");
  updateLiftDisplay();

  setFeedback(
    "updateFeedback",
    "Issue report submitted. Use Verify report to demonstrate the next step."
  );

  showToast("Demo issue report submitted.");
});

$("verifyBtn").addEventListener("click", () => {
  const status = getLiftStatus();

  if (status !== "pending") {
    setFeedback(
      "updateFeedback",
      "There is no pending issue report to verify. Submit a report first."
    );
    showToast("No pending report to verify.");
    return;
  }

  const confirmed = window.confirm(
    "Confirm that the reported lift issue has been checked in this demonstration?"
  );

  if (!confirmed) return;

  saveLiftStatus("broken");
  updateLiftDisplay();

  setFeedback(
    "updateFeedback",
    "Demo report verified. The lift is now marked as needing attention."
  );

  showToast("Demo report verified.");
});

$("fixBtn").addEventListener("click", () => {
  const confirmed = window.confirm(
    "Mark the Academic Block A lift as working in this demonstration?"
  );

  if (!confirmed) return;

  saveLiftStatus("working");
  updateLiftDisplay();

  setFeedback(
    "updateFeedback",
    "The sample lift has been marked as working."
  );

  showToast("Lift status updated to working.");

  // If the current route depended on this lift, refresh the route.
  if (currentRoute) {
    const refreshedRoute = calculateRoute(
      currentRoute.path[0],
      currentRoute.path[currentRoute.path.length - 1],
      currentRoute.stepFree
    );

    if (refreshedRoute) {
      currentRoute = refreshedRoute;
      renderRoute(refreshedRoute);
    }
  }
});

// ---------- Initial page setup ----------

updateLiftDisplay();

// Keep route controls ready and show a welcome message.
setFeedback(
  "voiceStatus",
  "Choose your locations to create a sample route."
);
