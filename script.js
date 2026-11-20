// PATHABLE - ACCESSIBLE CAMPUS NAVIGATOR

const $ = (id) => document.getElementById(id);

// ------------------------------
// 1. NOTIFICATION
// ------------------------------

let toastTimer;

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

// ------------------------------
// 2. MOBILE NAVIGATION
// ------------------------------

$("menuToggle").addEventListener("click", () => {
  const nav = $("navLinks");
  const isOpen = nav.classList.toggle("open");

  $("menuToggle").setAttribute("aria-expanded", String(isOpen));
  $("menuToggle").textContent = isOpen ? "✕" : "☰";
});

document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    $("navLinks").classList.remove("open");
    $("menuToggle").setAttribute("aria-expanded", "false");
    $("menuToggle").textContent = "☰";
  });
});

// ------------------------------
// 3. CAMPUS LOCATION DATA
// ------------------------------

const locations = {
  gate: {
    name: "Main Gate",
    icon: "🚪",
    description: "The main entrance to the demonstration campus.",
    tags: ["Campus entrance", "Starting point"],
    x: 70,
    y: 340
  },

  reception: {
    name: "Reception",
    icon: "ℹ️",
    description: "The reception area for general campus information.",
    tags: ["Information desk", "Visitor support"],
    x: 180,
    y: 280
  },

  library: {
    name: "Library",
    icon: "📚",
    description: "A sample library location for study and reading.",
    tags: ["Study area", "Learning"],
    x: 520,
    y: 70
  },

  cafeteria: {
    name: "Cafeteria",
    icon: "☕",
    description: "The sample campus food and refreshment area.",
    tags: ["Food area", "Student space"],
    x: 480,
    y: 290
  },

  blockA: {
    name: "Block A",
    icon: "🏢",
    description: "An academic building in the sample campus layout.",
    tags: ["Academic block", "Lift demo"],
    x: 390,
    y: 150
  },

  blockB: {
    name: "Block B",
    icon: "🏫",
    description: "Another academic building in the sample campus layout.",
    tags: ["Academic block", "Campus building"],
    x: 210,
    y: 110
  },

  classroom: {
    name: "Classroom",
    icon: "🎓",
    description: "A sample classroom destination for students.",
    tags: ["Learning space", "Academic area"],
    x: 300,
    y: 350
  }
};

// ------------------------------
// 4. CAMPUS CONNECTIONS
// ------------------------------

// Each connection has a distance, estimated time and
// whether it is step-free in this demonstration.

const connections = [
  { from: "gate", to: "reception", distance: 100, time: 2, accessible: true },
  { from: "reception", to: "blockA", distance: 120, time: 3, accessible: true },
  { from: "blockA", to: "library", distance: 140, time: 3, accessible: true },
  { from: "reception", to: "blockB", distance: 110, time: 2, accessible: false },
  { from: "blockB", to: "library", distance: 170, time: 3, accessible: true },
  { from: "blockA", to: "cafeteria", distance: 130, time: 3, accessible: true },
  { from: "cafeteria", to: "classroom", distance: 100, time: 2, accessible: true },
  { from: "reception", to: "classroom", distance: 180, time: 4, accessible: true },
  { from: "blockB", to: "classroom", distance: 150, time: 3, accessible: false },
  { from: "gate", to: "cafeteria", distance: 250, time: 5, accessible: false }
];

let currentRoute = null;
let selectedMapLocation = "gate";

// ------------------------------
// 5. ROUTE FINDING ALGORITHM
// ------------------------------

function findRoute(start, destination, routeType) {
  const distances = {};
  const previous = {};
  const unvisited = new Set(Object.keys(locations));

  Object.keys(locations).forEach(id => {
    distances[id] = Infinity;
    previous[id] = null;
  });

  distances[start] = 0;

  while (unvisited.size > 0) {
    let current = null;

    for (const node of unvisited) {
      if (current === null || distances[node] < distances[current]) {
        current = node;
      }
    }

    if (current === null || distances[current] === Infinity) {
      break;
    }

    if (current === destination) {
      break;
    }

    unvisited.delete(current);

    connections.forEach(edge => {
      let neighbour = null;

      if (edge.from === current) neighbour = edge.to;
      if (edge.to === current) neighbour = edge.from;

      if (!neighbour || !unvisited.has(neighbour)) return;

      // Step-free mode skips connections that are not step-free.
      if (routeType === "accessible" && !edge.accessible) return;

      const cost = routeType === "fastest" ? edge.time : edge.distance;
      const newDistance = distances[current] + cost;

      if (newDistance < distances[neighbour]) {
        distances[neighbour] = newDistance;
        previous[neighbour] = current;
      }
    });
  }

  if (distances[destination] === Infinity) {
    return null;
  }

  const path = [];
  let current = destination;

  while (current !== null) {
    path.unshift(current);
    current = previous[current];
  }

  let totalDistance = 0;
  let totalTime = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const edge = connections.find(connection =>
      (connection.from === path[i] && connection.to === path[i + 1]) ||
      (connection.to === path[i] && connection.from === path[i + 1])
    );

    if (edge) {
      totalDistance += edge.distance;
      totalTime += edge.time;
    }
  }

  return {
    path,
    distance: totalDistance,
    time: totalTime
  };
}

// ------------------------------
// 6. DISPLAY ROUTE
// ------------------------------

function displayRoute(route, routeType) {
  const steps = $("routeSteps");
  steps.innerHTML = "";

  route.path.forEach((locationId, index) => {
    const item = document.createElement("li");

    let message = locations[locationId].name;

    if (index === 0) {
      message = "Start at " + message;
    } else if (index === route.path.length - 1) {
      message = "You have reached " + message;
    } else {
      message = "Continue towards " + message;
    }

    item.textContent = message;
    steps.appendChild(item);
  });

  $("routeTime").textContent = route.time + " min";
  $("routeDistance").textContent = route.distance + " m";
  $("routeKind").textContent =
    routeType === "accessible" ? "Step-free" : "Fastest";

  $("resultEmpty").hidden = true;
  $("resultContent").hidden = false;
  $("routeStatus").textContent = "ROUTE FOUND";

  currentRoute = {
    ...route,
    routeType
  };

  $("voiceStatus").textContent =
    "Your route is ready. You can listen to the directions or copy them.";

  drawRouteOnMap(route.path);
}

// ------------------------------
// 7. ROUTE FORM
// ------------------------------

$("routeForm").addEventListener("submit", event => {
  event.preventDefault();

  const start = $("from").value;
  const destination = $("to").value;

  const routeType = document.querySelector(
    'input[name="routeType"]:checked'
  ).value;

  if (start === destination) {
    showToast("Choose two different locations.");
    return;
  }

  const route = findRoute(start, destination, routeType);

  if (!route) {
    showToast("No route found for this selection.");
    $("routeStatus").textContent = "NO ROUTE";
    return;
  }

  displayRoute(route, routeType);
  showToast("Your route has been found!");
});

// ------------------------------
// 8. SWAP LOCATIONS
// ------------------------------

$("swapBtn").addEventListener("click", () => {
  const start = $("from").value;
  $("from").value = $("to").value;
  $("to").value = start;

  showToast("Starting point and destination swapped.");
});

// ------------------------------
// 9. CLEAR ROUTE
// ------------------------------

function clearRoute() {
  currentRoute = null;

  $("resultContent").hidden = true;
  $("resultEmpty").hidden = false;
  $("routeStatus").textContent = "READY";
  $("routeLines").classList.remove("active");

  stopVoice();
  $("voiceStatus").textContent =
    "Voice guidance is ready when you find a route.";
}

$("clearRouteBtn").addEventListener("click", () => {
  clearRoute();
  showToast("Route cleared.");
});

// ------------------------------
// 10. DRAW ROUTE ON SAMPLE MAP
// ------------------------------

function drawRouteOnMap(path) {
  const line = $("routeLines");

  const points = path.map(id => {
    return locations[id].x + "," + locations[id].y;
  }).join(" ");

  line.setAttribute("d", "M" + points.replaceAll(" ", " L"));
  line.classList.add("active");

  document.querySelectorAll(".map-pin").forEach(pin => {
    pin.classList.toggle(
      "selected",
      path.includes(pin.dataset.location)
    );
  });
}

// ------------------------------
// 11. VOICE GUIDANCE
// ------------------------------

function stopVoice() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

$("speakBtn").addEventListener("click", () => {
  if (!currentRoute) {
    showToast("Find a route first.");
    return;
  }

  if (!("speechSynthesis" in window)) {
    showToast("Voice guidance is not supported in this browser.");
    return;
  }

  stopVoice();

  const routeNames = currentRoute.path.map(id => locations[id].name);

  const speechText =
    "Your " +
    (currentRoute.routeType === "accessible" ? "step-free" : "fastest") +
    " route is ready. " +
    routeNames.map((name, index) => {
      if (index === 0) return "Start at " + name + ".";
      if (index === routeNames.length - 1) return "You have reached " + name + ".";
      return "Continue towards " + name + ".";
    }).join(" ");

  const speech = new SpeechSynthesisUtterance(speechText);
  speech.rate = 0.9;
  speech.pitch = 1;
  speech.lang = "en-IN";

  speech.onstart = () => {
    $("voiceStatus").textContent = "🔊 Playing voice directions...";
  };

  speech.onend = () => {
    $("voiceStatus").textContent = "Voice directions completed.";
  };

  speech.onerror = () => {
    $("voiceStatus").textContent = "Voice playback could not start.";
  };

  window.speechSynthesis.speak(speech);
});

$("stopBtn")?.addEventListener("click", stopVoice);

// ------------------------------
// 12. COPY DIRECTIONS
// ------------------------------

$("copyBtn").addEventListener("click", async () => {
  if (!currentRoute) {
    showToast("Find a route first.");
    return;
  }

  const directions = currentRoute.path
    .map((id, index) => {
      return (index + 1) + ". " + locations[id].name;
    })
    .join("\n");

  const fullText =
    "PathAble Campus Directions\n" +
    "Route type: " + currentRoute.routeType + "\n" +
    "Estimated time: " + currentRoute.time + " minutes\n" +
    "Distance: " + currentRoute.distance + " metres\n\n" +
    directions;

  try {
    await navigator.clipboard.writeText(fullText);
    showToast("Directions copied successfully!");
  } catch (error) {
    const temporary = document.createElement("textarea");
    temporary.value = fullText;
    document.body.appendChild(temporary);
    temporary.select();

    try {
      document.execCommand("copy");
      showToast("Directions copied!");
    } catch {
      showToast("Copy is not available in this browser.");
    }

    temporary.remove();
  }
});

// ------------------------------
// 13. INTERACTIVE MAP MARKERS
// ------------------------------

function showLocation(locationId) {
  const location = locations[locationId];

  if (!location) return;

  selectedMapLocation = locationId;

  $("locationIcon").textContent = location.icon;
  $("locationName").textContent = location.name;
  $("locationDescription").textContent = location.description;

  const tags = $("locationTags");
  tags.innerHTML = "";

  location.tags.forEach(tag => {
    const span = document.createElement("span");
    span.textContent = tag;
    tags.appendChild(span);
  });

  document.querySelectorAll(".map-pin").forEach(pin => {
    pin.classList.toggle(
      "selected",
      pin.dataset.location === locationId
    );
  });
}

document.querySelectorAll(".map-pin").forEach(pin => {
  pin.addEventListener("click", () => {
    showLocation(pin.dataset.location);
  });
});

$("useLocationBtn").addEventListener("click", () => {
  $("to").value = selectedMapLocation;

  $("navigator").scrollIntoView({ behavior: "smooth" });

  showToast(
    locations[selectedMapLocation].name +
    " selected as your destination."
  );
});

// ------------------------------
// 14. RESET MAP
// ------------------------------

$("resetMapBtn").addEventListener("click", () => {
  $("routeLines").classList.remove("active");

  document.querySelectorAll(".map-pin").forEach(pin => {
    pin.classList.remove("selected");
  });

  showLocation("gate");
  showToast("Map has been reset.");
});

// ------------------------------
// 15. ACCESSIBILITY SETTINGS
// ------------------------------

function setToggle(button, enabled) {
  button.classList.toggle("active", enabled);
  button.setAttribute("aria-pressed", String(enabled));
}

$("contrastBtn").addEventListener("click", () => {
  const enabled = !document.body.classList.contains("high-contrast");

  document.body.classList.toggle("high-contrast", enabled);
  setToggle($("contrastBtn"), enabled);

  $("accessFeedback").textContent = enabled
    ? "High contrast mode is enabled."
    : "High contrast mode is disabled.";
});

$("fontBtn").addEventListener("click", () => {
  const enabled = !document.body.classList.contains("large-text");

  document.body.classList.toggle("large-text", enabled);
  setToggle($("fontBtn"), enabled);

  $("accessFeedback").textContent = enabled
    ? "Larger text mode is enabled."
    : "Larger text mode is disabled.";
});

$("resetAccessBtn").addEventListener("click", () => {
  document.body.classList.remove("high-contrast", "large-text");

  setToggle($("contrastBtn"), false);
  setToggle($("fontBtn"), false);

  $("accessFeedback").textContent =
    "All accessibility settings have been reset.";

  showToast("Accessibility settings reset.");
});

// Voice button in accessibility section
$("accessVoiceBtn").addEventListener("click", () => {
  if (!("speechSynthesis" in window)) {
    showToast("Voice is not supported in this browser.");
    return;
  }

  stopVoice();

  const speech = new SpeechSynthesisUtterance(
    "Welcome to PathAble. Every path should be accessible. Use the route planner to find a campus route."
  );

  speech.lang = "en-IN";
  speech.rate = 0.9;

  speech.onstart = () => {
    $("accessFeedback").textContent = "Playing the PathAble welcome message.";
  };

  speech.onend = () => {
    $("accessFeedback").textContent = "Welcome message completed.";
  };

  window.speechSynthesis.speak(speech);
});

// ------------------------------
// 16. LIFT STATUS DEMONSTRATION
// ------------------------------

const LIFT_STORAGE_KEY = "pathable-lift-status";

function getLiftStatus() {
  return localStorage.getItem(LIFT_STORAGE_KEY) || "working";
}

function updateLiftDisplay(status, message) {
  const statusText = $("liftStatus");
  const indicator = $("statusIndicator");

  statusText.textContent =
    status === "working"
      ? "Working"
      : status === "checking"
        ? "Needs checking"
        : "Issue reported";

  indicator.className = "status-indicator";

  if (status === "checking") {
    indicator.classList.add("warning");
  }

  if (status === "reported") {
    indicator.classList.add("danger");
  }

  $("updateFeedback").textContent = message;
}

function saveLiftStatus(status, message) {
  localStorage.setItem(LIFT_STORAGE_KEY, status);
  updateLiftDisplay(status, message);
}

$("reportBtn").addEventListener("click", () => {
  const confirmed = window.confirm(
    "Submit a demonstration report that the Block A lift needs attention?"
  );

  if (!confirmed) return;

  saveLiftStatus(
    "reported",
    "Demo issue report submitted. In a real system, campus staff would need to receive and verify this report."
  );

  showToast("Demonstration issue report submitted.");
});

$("verifyBtn").addEventListener("click", () => {
  saveLiftStatus(
    "checking",
    "The demonstration lift status is marked as needing a check. This is not a real staff verification."
  );

  showToast("Lift marked as needing a check.");
});

$("fixBtn").addEventListener("click", () => {
  saveLiftStatus(
    "working",
    "The demonstration lift status has been set to working. This does not confirm the real lift condition."
  );

  showToast("Demo lift status updated.");
});

// Load saved demo status when page opens
updateLiftDisplay(
  getLiftStatus(),
  "Demo status loaded. Real facility status is not connected."
);

// ------------------------------
// 17. INITIAL MAP STATE
// ------------------------------

showLocation("gate");

// ------------------------------
// 18. FOOTER YEAR
// ------------------------------

console.log("PathAble website loaded successfully.");
console.log("All demonstration interactions are ready.");
