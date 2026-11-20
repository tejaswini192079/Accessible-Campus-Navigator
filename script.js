
// ==========================================
// PATHABLE - ACCESSIBLE CAMPUS NAVIGATOR
// Interactive route planner and demo features
// ==========================================

const startSelect = document.getElementById("startLocation");
const endSelect = document.getElementById("endLocation");
const wheelchairMode = document.getElementById("wheelchairMode");
const voiceMode = document.getElementById("voiceMode");

const findRouteButton = document.getElementById("findRouteButton");
const swapButton = document.getElementById("swapButton");
const resetButton = document.getElementById("resetButton");

const routeResult = document.getElementById("routeResult");
const activeRouteLine = document.getElementById("activeRouteLine");

const liftStatus = document.getElementById("liftStatus");
const liftDescription = document.getElementById("liftDescription");
const toggleLiftButton = document.getElementById("toggleLiftButton");

const toast = document.getElementById("toast");

let liftWorking = true;
let currentRoute = null;
let lastToastTimer = null;

// ------------------------------------------
// CAMPUS LOCATIONS
// ------------------------------------------

const locations = {
  entrance: {
    name: "Main Entrance",
    x: 70,
    y: 180,
    description: "Main entrance of the college building."
  },
  rampJunction: {
    name: "Ramp Junction",
    x: 170,
    y: 180,
    description: "Accessible ramp connecting the entrance to the main corridor."
  },
  groundHall: {
    name: "Ground Floor Corridor",
    x: 270,
    y: 180,
    description: "Main ground floor corridor."
  },
  liftLobby: {
    name: "Lift Lobby",
    x: 270,
    y: 90,
    description: "Central lift lobby of the main building."
  },
  firstLanding: {
    name: "First Floor Landing",
    x: 390,
    y: 180,
    description: "Accessible landing on the first floor."
  },
  secondHall: {
    name: "Second Floor Corridor",
    x: 470,
    y: 90,
    description: "Corridor connecting classrooms on the second floor."
  },
  room204: {
    name: "Room 204 – Second Floor",
    x: 530,
    y: 180,
    description: "Classroom 204 on the second floor."
  },
  library: {
    name: "Library – Ground Floor",
    x: 530,
    y: 285,
    description: "College library on the ground floor."
  },
  office: {
    name: "Student Office – First Floor",
    x: 70,
    y: 285,
    description: "Student services office on the first floor."
  }
};

// ------------------------------------------
// CAMPUS ROUTE NETWORK
// ------------------------------------------
// Each connection has a distance and a type.
// wheelchair users cannot use stair connections.
// A lift connection is available only when
// the lift is marked as working.
// The ramp route provides an alternative.

const connections = [
  {
    from: "entrance",
    to: "rampJunction",
    distance: 3,
    type: "ramp",
    instruction: "Move forward from the main entrance towards the accessible ramp."
  },
  {
    from: "rampJunction",
    to: "groundHall",
    distance: 2,
    type: "corridor",
    instruction: "Continue along the accessible path into the ground floor corridor."
  },
  {
    from: "groundHall",
    to: "liftLobby",
    distance: 1,
    type: "corridor",
    instruction: "Follow the corridor towards the central lift lobby."
  },
  {
    from: "liftLobby",
    to: "firstLanding",
    distance: 1,
    type: "lift",
    instruction: "Enter the working lift and travel to the first floor."
  },
  {
    from: "firstLanding",
    to: "secondHall",
    distance: 1,
    type: "lift",
    instruction: "Use the lift to reach the second floor."
  },
  {
    from: "secondHall",
    to: "room204",
    distance: 1,
    type: "corridor",
    instruction: "Exit into the second floor corridor and continue to Room 204."
  },

  // Alternative step-free ramp connection.
  {
    from: "rampJunction",
    to: "firstLanding",
    distance: 6,
    type: "ramp",
    instruction: "Follow the accessible ramp route to the first floor landing."
  },
  {
    from: "firstLanding",
    to: "secondHall",
    distance: 6,
    type: "ramp",
    instruction: "Continue along the accessible ramp to the second floor corridor."
  },

  // Stairs are included to demonstrate why
  // the shortest route may not be accessible.
  {
    from: "groundHall",
    to: "firstLanding",
    distance: 1,
    type: "stairs",
    instruction: "Use the stairs to reach the first floor."
  },
  {
    from: "firstLanding",
    to: "secondHall",
    distance: 1,
    type: "stairs",
    instruction: "Use the stairs to reach the second floor."
  },

  // Other destinations.
  {
    from: "groundHall",
    to: "library",
    distance: 2,
    type: "corridor",
    instruction: "Continue along the ground floor corridor towards the library."
  },
  {
    from: "firstLanding",
    to: "office",
    distance: 3,
    type: "corridor",
    instruction: "Follow the first floor corridor towards the student office."
  }
];

// ------------------------------------------
// CREATE THE ROUTE GRAPH
// ------------------------------------------

function getAvailableConnections(wheelchairRequired) {
  return connections.filter(connection => {
    if (connection.type === "lift" && !liftWorking) {
      return false;
    }

    if (wheelchairRequired && connection.type === "stairs") {
      return false;
    }

    return true;
  });
}

// ------------------------------------------
// DIJKSTRA SHORTEST PATH ALGORITHM
// ------------------------------------------

function calculateRoute(start, destination, wheelchairRequired) {
  if (!locations[start] || !locations[destination]) {
    return null;
  }

  if (start === destination) {
    return {
      path: [start],
      steps: [],
      distance: 0
    };
  }

  const availableConnections = getAvailableConnections(wheelchairRequired);

  const distances = {};
  const previous = {};
  const previousConnection = {};
  const unvisited = new Set(Object.keys(locations));

  Object.keys(locations).forEach(location => {
    distances[location] = Infinity;
    previous[location] = null;
  });

  distances[start] = 0;

  while (unvisited.size > 0) {
    let current = null;
    let smallestDistance = Infinity;

    for (const location of unvisited) {
      if (distances[location] < smallestDistance) {
        smallestDistance = distances[location];
        current = location;
      }
    }

    if (current === null || smallestDistance === Infinity) {
      break;
    }

    if (current === destination) {
      break;
    }

    unvisited.delete(current);

    availableConnections.forEach(connection => {
      let neighbour = null;

      if (connection.from === current) {
        neighbour = connection.to;
      } else if (connection.to === current) {
        neighbour = connection.from;
      }

      if (!neighbour || !unvisited.has(neighbour)) {
        return;
      }

      const newDistance = distances[current] + connection.distance;

      if (newDistance < distances[neighbour]) {
        distances[neighbour] = newDistance;
        previous[neighbour] = current;
        previousConnection[neighbour] = connection;
      }
    });
  }

  if (distances[destination] === Infinity) {
    return null;
  }

  const path = [];
  const steps = [];

  let current = destination;

  while (current !== null) {
    path.unshift(current);

    if (previousConnection[current]) {
      steps.unshift(previousConnection[current]);
    }

    current = previous[current];
  }

  if (path[0] !== start) {
    return null;
  }

  return {
    path,
    steps,
    distance: distances[destination]
  };
}

// ------------------------------------------
// ROUTE DESCRIPTION
// ------------------------------------------

function getRouteType(route) {
  if (!route || route.steps.length === 0) {
    return "No travel needed";
  }

  const types = route.steps.map(step => step.type);

  if (types.includes("ramp")) {
    return "Ramp-accessible route";
  }

  if (types.includes("lift")) {
    return "Lift-accessible route";
  }

  if (types.includes("stairs")) {
    return "Route with stairs";
  }

  return "Corridor route";
}

function getStepInstruction(step, index, route) {
  const instruction = step.instruction;

  if (step.type === "lift" && !liftWorking) {
    return "The lift is unavailable. This connection cannot be used.";
  }

  return instruction;
}

function getRouteWarnings(route, wheelchairRequired) {
  const warnings = [];

  if (!liftWorking) {
    warnings.push(
      "The central lift is marked out of service in this demo. PathAble has checked for another available route."
    );
  }

  if (!wheelchairRequired && route.steps.some(step => step.type === "stairs")) {
    warnings.push(
      "This route includes stairs. It is not suitable for a step-free journey."
    );
  }

  if (route.steps.some(step => step.type === "ramp")) {
    warnings.push(
      "This route uses the accessible ramp network instead of the unavailable lift."
    );
  }

  return warnings;
}

// ------------------------------------------
// DISPLAY ROUTE RESULTS
// ------------------------------------------

function displayRoute(route, start, destination, wheelchairRequired) {
  currentRoute = {
    route,
    start,
    destination,
    wheelchairRequired
  };

  const routeType = getRouteType(route);
  const warnings = getRouteWarnings(route, wheelchairRequired);

  const stepsHTML = route.steps.map((step, index) => {
    const fromName = locations[route.path[index]].name;
    const toName = locations[route.path[index + 1]].name;

    return `
      <li>
        <span class="step-number">${index + 1}</span>
        <div>
          <strong>${escapeHTML(fromName)} → ${escapeHTML(toName)}</strong>
          <p>${escapeHTML(getStepInstruction(step, index, route))}</p>
        </div>
      </li>
    `;
  }).join("");

  const warningHTML = warnings.map(warning => `
    <div class="route-warning">ⓘ ${escapeHTML(warning)}</div>
  `).join("");

  const distanceText = route.distance === 0
    ? "Already here"
    : `${route.distance} demo units`;

  routeResult.innerHTML = `
    <div class="result-top">
      <div>
        <span class="mini-label">YOUR ROUTE IS READY</span>
        <h3>${escapeHTML(locations[start].name)} → ${escapeHTML(locations[destination].name)}</h3>
      </div>
      <div class="result-metrics">
        <span class="metric">↗ ${distanceText}</span>
        <span class="metric">♿ ${escapeHTML(routeType)}</span>
      </div>
    </div>

    ${warningHTML}

    <ol class="route-steps">
      ${
        route.steps.length
          ? stepsHTML
          : "<li>You are already at your selected destination.</li>"
      }
    </ol>

    <div class="result-actions">
      <button class="button button-primary button-small" id="speakRouteButton" type="button">🔊 Read directions</button>
      <button class="button button-light button-small" id="copyRouteButton" type="button">▣ Copy directions</button>
      <button class="button button-light button-small" id="recalculateButton" type="button">↻ Recalculate</button>
    </div>
  `;

  drawRoute(route.path);
  updateMapMarkers(route.path, start, destination);

  if (voiceMode.checked) {
    speakRoute();
  }

  showToast("Accessible route calculated successfully.");
}

// ------------------------------------------
// SAFE HTML TEXT DISPLAY
// ------------------------------------------

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return replacements[character];
  });
}

// ------------------------------------------
// DRAW THE SELECTED ROUTE ON THE MAP
// ------------------------------------------

function drawRoute(path) {
  const coordinates = path.map(location => {
    const point = locations[location];
    return `${point.x} ${point.y}`;
  });

  activeRouteLine.setAttribute("d", `M ${coordinates.join(" L ")}`);
}

function clearRouteMap() {
  activeRouteLine.setAttribute("d", "");

  document.querySelectorAll(".map-point").forEach(marker => {
    marker.classList.remove("selected", "route-active", "route-start", "route-end");
  });
}

function updateMapMarkers(path, start, destination) {
  clearRouteMap();

  path.forEach(location => {
    const marker = document.querySelector(
      `.map-point[data-location="${location}"]`
    );

    if (marker) {
      marker.classList.add("route-active");
    }
  });

  const startMarker = document.querySelector(
    `.map-point[data-location="${start}"]`
  );

  const endMarker = document.querySelector(
    `.map-point[data-location="${destination}"]`
  );

  if (startMarker) startMarker.classList.add("route-start");
  if (endMarker) endMarker.classList.add("route-end");
}

// ------------------------------------------
// FIND ROUTE BUTTON
// ------------------------------------------

function findRoute() {
  const start = startSelect.value;
  const destination = endSelect.value;
  const wheelchairRequired = wheelchairMode.checked;

  if (!start || !destination) {
    showToast("Please select both locations.");
    return;
  }

  const route = calculateRoute(
    start,
    destination,
    wheelchairRequired
  );

  if (!route) {
    currentRoute = null;
    clearRouteMap();

    routeResult.innerHTML = `
      <div class="no-route">
        <strong>⚠ No accessible route found.</strong>
        <p>There is no available route between these locations with the current accessibility settings. Please choose another destination or check the facility status.</p>
      </div>
    `;

    showToast("No route is available with these settings.");
    return;
  }

  displayRoute(route, start, destination, wheelchairRequired);
}

findRouteButton.addEventListener("click", findRoute);

// ------------------------------------------
// SWAP START AND DESTINATION
// ------------------------------------------

swapButton.addEventListener("click", () => {
  const oldStart = startSelect.value;
  startSelect.value = endSelect.value;
  endSelect.value = oldStart;

  showToast("Starting point and destination swapped.");
  findRoute();
});

// ------------------------------------------
// RESET PLANNER
// ------------------------------------------

resetButton.addEventListener("click", () => {
  startSelect.value = "entrance";
  endSelect.value = "room204";
  wheelchairMode.checked = true;
  voiceMode.checked = false;

  currentRoute = null;

  routeResult.innerHTML = `
    <div class="result-placeholder">
      <span class="placeholder-icon">🧭</span>
      <div>
        <strong>Your route will appear here</strong>
        <p>Select your starting point and destination, then press Find My Route.</p>
      </div>
    </div>
  `;

  clearRouteMap();
  stopVoice();

  showToast("Route planner has been reset.");
});

// ------------------------------------------
// MAP MARKER SELECTION
// ------------------------------------------

document.querySelectorAll(".map-point").forEach(marker => {
  marker.addEventListener("click", () => {
    const location = marker.dataset.location;

    if (!locations[location]) {
      return;
    }

    startSelect.value = location;

    document.querySelectorAll(".map-point").forEach(point => {
      point.classList.remove("selected");
    });

    marker.classList.add("selected");

    showToast(`${locations[location].name} selected as your starting point.`);
  });
});

// ------------------------------------------
// ROUTE RESULT BUTTONS
// ------------------------------------------

routeResult.addEventListener("click", event => {
  const button = event.target.closest("button");

  if (!button) return;

  if (button.id === "speakRouteButton") {
    speakRoute();
  }

  if (button.id === "copyRouteButton") {
    copyRoute();
  }

  if (button.id === "recalculateButton") {
    findRoute();
  }
});

// ------------------------------------------
// VOICE NAVIGATION
// ------------------------------------------

function getVoiceText() {
  if (!currentRoute) {
    return "Please find a route first to hear your directions.";
  }

  const route = currentRoute.route;

  if (route.steps.length === 0) {
    return "You are already at your selected destination.";
  }

  let text = `Your route starts at ${locations[currentRoute.start].name}. `;

  route.steps.forEach((step, index) => {
    const from = locations[route.path[index]].name;
    const to = locations[route.path[index + 1]].name;

    text += `Step ${index + 1}. From ${from} to ${to}. `;
    text += step.instruction + " ";
  });

  text += `You have reached ${locations[currentRoute.destination].name}.`;

  return text;
}

function speakText(text) {
  if (!("speechSynthesis" in window)) {
    showToast("Voice guidance is not supported by this browser.");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-IN";
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(utterance);
}

function speakRoute() {
  speakText(getVoiceText());
}

function stopVoice() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

document.getElementById("playVoiceButton").addEventListener("click", () => {
  speakText(
    "Continue through the ground floor corridor towards the lift lobby. " +
    "Use the working lift to reach the first floor. " +
    "Continue to the second floor corridor and follow the directions to your classroom."
  );
});

document.getElementById("stopVoiceButton").addEventListener("click", () => {
  stopVoice();
  showToast("Voice guidance stopped.");
});

// ------------------------------------------
// COPY ROUTE DIRECTIONS
// ------------------------------------------

async function copyRoute() {
  if (!currentRoute) return;

  const text = getVoiceText();

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const temporaryInput = document.createElement("textarea");
      temporaryInput.value = text;
      temporaryInput.style.position = "fixed";
      temporaryInput.style.opacity = "0";
      document.body.appendChild(temporaryInput);
      temporaryInput.select();

      const copied = document.execCommand("copy");
      temporaryInput.remove();

      if (!copied) {
        throw new Error("Copy was not successful");
      }
    }

    showToast("Route directions copied.");
  } catch (error) {
    showToast("Copy is unavailable in this browser. You can read the directions on screen.");
  }
}

// ------------------------------------------
// LIFT STATUS SIMULATION
// ------------------------------------------

function updateLiftDisplay() {
  if (liftWorking) {
    liftStatus.textContent = "● Working";
    liftStatus.className = "status-pill status-working";

    liftDescription.textContent =
      "The lift is currently marked as operational in this demonstration.";

    toggleLiftButton.textContent = "Simulate breakdown";
  } else {
    liftStatus.textContent = "● Out of service";
    liftStatus.className = "status-pill status-broken";

    liftDescription.textContent =
      "The lift is marked unavailable. New route calculations will avoid this lift.";

    toggleLiftButton.textContent = "Restore lift";
  }
}

toggleLiftButton.addEventListener("click", () => {
  liftWorking = !liftWorking;

  updateLiftDisplay();

  if (liftWorking) {
    showToast("Demo lift restored. You can calculate routes using the lift again.");
  } else {
    showToast("Lift marked out of service. Recalculate your route.");
  }

  // Automatically update the current journey if one exists.
  if (currentRoute) {
    findRoute();
  }
});

// ------------------------------------------
// ACCESSIBILITY: HIGH CONTRAST
// ------------------------------------------

const contrastButton = document.getElementById("contrastButton");

contrastButton.addEventListener("click", () => {
  document.body.classList.toggle("high-contrast");

  const enabled = document.body.classList.contains("high-contrast");

  contrastButton.setAttribute("aria-pressed", String(enabled));

  showToast(
    enabled
      ? "High contrast mode enabled."
      : "High contrast mode disabled."
  );
});

// ------------------------------------------
// ACCESSIBILITY: LARGER TEXT
// ------------------------------------------

const textSizeButton = document.getElementById("textSizeButton");

textSizeButton.addEventListener("click", () => {
  document.body.classList.toggle("large-text");

  const enabled = document.body.classList.contains("large-text");

  textSizeButton.setAttribute("aria-pressed", String(enabled));

  showToast(
    enabled
      ? "Larger text enabled."
      : "Normal text size restored."
  );
});

// ------------------------------------------
// MOBILE NAVIGATION
// ------------------------------------------

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");

  menuToggle.textContent = isOpen ? "✕" : "☰";
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.textContent = "☰";
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

// ------------------------------------------
// TOAST NOTIFICATIONS
// ------------------------------------------

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  if (lastToastTimer) {
    clearTimeout(lastToastTimer);
  }

  lastToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

// ------------------------------------------
// INITIAL PAGE SETUP
// ------------------------------------------

updateLiftDisplay();
clearRouteMap();

console.log("PathAble Accessible Campus Navigator loaded successfully.");
