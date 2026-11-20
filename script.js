// PATHABLE - ACCESSIBLE CAMPUS NAVIGATOR

const $ = (id) => document.getElementById(id);

const locations = {
  gate: { name: "Main Gate", x: 9, y: 83 },
  reception: { name: "Reception", x: 43, y: 58 },
  library: { name: "Library", x: 51, y: 12 },
  cafeteria: { name: "Cafeteria", x: 87, y: 34 },
  blockA: { name: "Block A", x: 17, y: 40 },
  blockB: { name: "Block B", x: 64, y: 77 },
  classroom: { name: "Classroom", x: 86, y: 73 }
};

// Sample campus connections.
// "accessible: false" represents a sample route containing stairs.
const connections = [
  { from: "gate", to: "reception", distance: 120, accessible: true },
  { from: "gate", to: "blockA", distance: 180, accessible: true },
  { from: "reception", to: "library", distance: 160, accessible: true },
  { from: "reception", to: "blockA", distance: 100, accessible: true },
  { from: "reception", to: "cafeteria", distance: 190, accessible: true },
  { from: "blockA", to: "blockB", distance: 210, accessible: false },
  { from: "blockA", to: "classroom", distance: 270, accessible: true },
  { from: "library", to: "cafeteria", distance: 170, accessible: true },
  { from: "library", to: "blockB", distance: 200, accessible: true },
  { from: "cafeteria", to: "classroom", distance: 140, accessible: true },
  { from: "blockB", to: "classroom", distance: 110, accessible: true },
  { from: "reception", to: "blockB", distance: 230, accessible: true }
];

let currentRoute = [];
let currentRouteText = "";
let toastTimer;
let speech = null;

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

// MOBILE MENU

$("menuToggle").addEventListener("click", () => {
  const nav = $("navLinks");
  nav.classList.toggle("open");
  $("menuToggle").textContent = nav.classList.contains("open") ? "✕" : "☰";
});

document.querySelectorAll(".nav a").forEach(link => {
  link.addEventListener("click", () => {
    $("navLinks").classList.remove("open");
    $("menuToggle").textContent = "☰";
  });
});

// ROUTE CALCULATION - DIJKSTRA'S ALGORITHM

function calculateRoute(start, end, accessibleOnly) {
  const distances = {};
  const previous = {};
  const unvisited = new Set(Object.keys(locations));

  Object.keys(locations).forEach(location => {
    distances[location] = Infinity;
    previous[location] = null;
  });

  distances[start] = 0;

  while (unvisited.size > 0) {
    let current = null;

    for (const node of unvisited) {
      if (current === null || distances[node] < distances[current]) {
        current = node;
      }
    }

    if (current === null || distances[current] === Infinity) break;
    if (current === end) break;

    unvisited.delete(current);

    connections.forEach(edge => {
      if (accessibleOnly && !edge.accessible) return;

      let neighbor = null;

      if (edge.from === current) neighbor = edge.to;
      if (edge.to === current) neighbor = edge.from;

      if (!neighbor || !unvisited.has(neighbor)) return;

      const newDistance = distances[current] + edge.distance;

      if (newDistance < distances[neighbor]) {
        distances[neighbor] = newDistance;
        previous[neighbor] = current;
      }
    });
  }

  if (distances[end] === Infinity) return null;

  const path = [];
  let current = end;

  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  return {
    path,
    distance: distances[end]
  };
}

// ROUTE FORM

$("routeForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const start = $("from").value;
  const end = $("to").value;
  const preference = document.querySelector('input[name="preference"]:checked').value;

  if (start === end) {
    showToast("Please select two different locations.");
    return;
  }

  const accessibleOnly = preference === "accessible";
  const result = calculateRoute(start, end, accessibleOnly);

  if (!result) {
    showToast("No route found for this selection. Try the fastest option.");
    return;
  }

  currentRoute = result.path;

  const minutes = Math.max(1, Math.ceil(result.distance / 75));
  const distance = result.distance;

  $("routeTime").textContent = minutes + " min";
  $("routeDistance").textContent = distance + " m";
  $("routeKind").textContent = accessibleOnly ? "Step-free route" : "Fastest available route";

  $("routeSteps").innerHTML = result.path.map((id, index) => {
    const arrow = index < result.path.length - 1 ? " → " : "";
    return `<span>${escapeHTML(locations[id].name)}${arrow}</span>`;
  }).join("");

  currentRouteText = "PathAble sample route: " +
    result.path.map(id => locations[id].name).join(" to ") +
    ". Estimated distance " + distance + " metres. Estimated walking time " +
    minutes + " minutes. " +
    (accessibleOnly ? "Step-free route preference selected." : "Fastest route preference selected.");

  $("routeResult").classList.add("show");
  $("mapRouteLine").classList.add("visible");

  document.querySelectorAll(".map-pin").forEach(pin => {
    pin.classList.toggle("selected", result.path.includes(pin.dataset.location));
  });

  $("mapInfo").textContent = "Selected route: " +
    locations[start].name + " to " + locations[end].name +
    ". " + distance + " metres (illustrative).";

  $("routeResult").scrollIntoView({ behavior: "smooth", block: "nearest" });
  showToast("Your sample route is ready!");
});

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// SWAP LOCATIONS

$("swapBtn").addEventListener("click", () => {
  const from = $("from");
  const to = $("to");
  const previous = from.value;
  from.value = to.value;
  to.value = previous;
  showToast("Starting point and destination swapped.");
});

// MAP MARKERS

document.querySelectorAll(".map-pin").forEach(pin => {
  pin.addEventListener("click", () => {
    const id = pin.dataset.location;
    const location = locations[id];

    document.querySelectorAll(".map-pin").forEach(item => {
      item.classList.remove("selected");
    });

    pin.classList.add("selected");
    $("to").value = id;
    $("mapInfo").textContent = location.name +
      " selected as destination. Choose a starting point and find your route.";

    showToast(location.name + " selected as destination.");
  });
});

// RESET MAP

$("resetMapBtn").addEventListener("click", () => {
  document.querySelectorAll(".map-pin").forEach(pin => {
    pin.classList.remove("selected");
  });

  $("mapRouteLine").classList.remove("visible");
  $("mapInfo").textContent = "Select any map location to use it as your destination.";
  $("routeResult").classList.remove("show");
  currentRoute = [];
  currentRouteText = "";
  showToast("Map has been reset.");
});

// CLEAR ROUTE

$("clearRouteBtn").addEventListener("click", () => {
  $("routeResult").classList.remove("show");
  $("mapRouteLine").classList.remove("visible");
  $("mapInfo").textContent = "Route cleared. Choose new locations to plan another journey.";
  document.querySelectorAll(".map-pin").forEach(pin => pin.classList.remove("selected"));
  currentRoute = [];
  currentRouteText = "";
  stopSpeech();
  showToast("Route cleared.");
});

// VOICE GUIDANCE

function stopSpeech() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

$("speakBtn").addEventListener("click", () => {
  if (!currentRouteText) {
    showToast("Find a route first.");
    return;
  }

  if (!("speechSynthesis" in window)) {
    showToast("Voice guidance is not supported in this browser.");
    return;
  }

  stopSpeech();
  speech = new SpeechSynthesisUtterance(currentRouteText);
  speech.lang = "en-IN";
  speech.rate = 0.9;
  speech.pitch = 1;
  window.speechSynthesis.speak(speech);
  showToast("Voice directions started.");
});

// COPY ROUTE

$("copyBtn").addEventListener("click", async () => {
  if (!currentRouteText) {
    showToast("Find a route first.");
    return;
  }

  try {
    await navigator.clipboard.writeText(currentRouteText);
    showToast("Route copied to clipboard!");
  } catch (error) {
    const textArea = document.createElement("textarea");
    textArea.value = currentRouteText;
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand("copy");
      showToast("Route copied!");
    } catch {
      showToast("Clipboard access is unavailable.");
    }

    textArea.remove();
  }
});

// ACCESSIBILITY SETTINGS

function setToggle(buttonId, enabled) {
  const button = $(buttonId);
  button.classList.toggle("active", enabled);
  button.textContent = enabled ? "ON" : "OFF";
  button.setAttribute("aria-pressed", String(enabled));
}

$("contrastBtn").addEventListener("click", () => {
  const enabled = !document.body.classList.contains("high-contrast");
  document.body.classList.toggle("high-contrast", enabled);
  setToggle("contrastBtn", enabled);
  $("accessFeedback").textContent = enabled
    ? "High contrast mode is enabled."
    : "High contrast mode is disabled.";
});

$("fontBtn").addEventListener("click", () => {
  const enabled = !document.body.classList.contains("large-text");
  document.body.classList.toggle("large-text", enabled);
  setToggle("fontBtn", enabled);
  $("accessFeedback").textContent = enabled
    ? "Larger text is enabled."
    : "Normal text size is restored.";
});

$("voiceBtn").addEventListener("click", () => {
  if (!("speechSynthesis" in window)) {
    showToast("Voice assistance is not supported in this browser.");
    return;
  }

  stopSpeech();

  const message = new SpeechSynthesisUtterance(
    "Welcome to PathAble. Every path should be accessible. Use the route planner to explore your campus."
  );

  message.lang = "en-IN";
  message.rate = 0.9;
  window.speechSynthesis.speak(message);
  showToast("Welcome message is playing.");
});

$("resetAccessBtn").addEventListener("click", () => {
  document.body.classList.remove("high-contrast", "large-text");
  setToggle("contrastBtn", false);
  setToggle("fontBtn", false);
  $("accessFeedback").textContent = "All accessibility settings have been reset.";
  stopSpeech();
  showToast("Accessibility settings reset.");
});

// LIFT STATUS DEMO

const liftStorageKey = "pathable-lift-status";

function updateLift(status, message) {
  localStorage.setItem(liftStorageKey, status);

  const label = $("liftStatus");
  const pill = $("statusIndicator");

  pill.className = "status-pill";

  if (status === "working") {
    label.textContent = "Demo status: Working";
    pill.textContent = "WORKING";
  } else if (status === "checking") {
    label.textContent = "Demo status: Needs checking";
    pill.textContent = "CHECKING";
    pill.classList.add("checking");
  } else {
    label.textContent = "Demo status: Issue reported";
    pill.textContent = "REPORTED";
    pill.classList.add("issue");
  }

  $("updateFeedback").textContent = message;
  showToast(message);
}

const savedLiftStatus = localStorage.getItem(liftStorageKey);
if (["working", "checking", "issue"].includes(savedLiftStatus)) {
  updateLift(savedLiftStatus, "Saved demo lift status loaded.");
}

$("reportBtn").addEventListener("click", () => {
  updateLift("issue", "Demo issue report recorded in this browser.");
});

$("verifyBtn").addEventListener("click", () => {
  updateLift("checking", "Lift marked as needing a check in this demo.");
});

$("fixBtn").addEventListener("click", () => {
  updateLift("working", "Lift marked as working in this demo.");
});

// CLOSE MOBILE MENU ON OUTSIDE CLICK

document.addEventListener("click", (event) => {
  const nav = $("navLinks");
  const menu = $("menuToggle");

  if (!nav.contains(event.target) && !menu.contains(event.target)) {
    nav.classList.remove("open");
    menu.textContent = "☰";
  }
});

// KEYBOARD SUPPORT FOR MAP MARKERS

document.querySelectorAll(".map-pin").forEach(pin => {
  pin.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      pin.click();
    }
  });
});

// INITIAL MESSAGE

console.log("PathAble loaded successfully!");
console.log("This is a student demonstration prototype with sample campus data.");
