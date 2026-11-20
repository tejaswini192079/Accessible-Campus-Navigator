// PATHABLE - ACCESSIBLE CAMPUS NAVIGATOR

// 1. CAMPUS LOCATIONS

const places = {
  gate: "Main Gate",
  reception: "Reception",
  library: "Library",
  cafeteria: "Cafeteria",
  blockA: "Block A",
  blockB: "Block B",
  classroom: "Classroom 204"
};

// 2. SAMPLE CAMPUS PATHS

const edges = [
  { from: "gate", to: "reception", time: 3, accessible: true, text: "Walk towards the reception." },
  { from: "reception", to: "library", time: 4, accessible: true, text: "Continue along the accessible pathway to the library." },
  { from: "reception", to: "cafeteria", time: 3, accessible: true, text: "Follow the pathway towards the cafeteria." },
  { from: "reception", to: "blockA", time: 5, accessible: true, text: "Move towards Block A using the accessible path." },
  { from: "gate", to: "cafeteria", time: 5, accessible: false, text: "Take the shorter general pathway." },
  { from: "cafeteria", to: "blockB", time: 4, accessible: true, text: "Continue towards Block B." },
  { from: "blockA", to: "blockB", time: 3, accessible: true, text: "Use the connecting accessible pathway." },
  { from: "blockA", to: "classroom", time: 2, accessible: true, liftId: "blockA", text: "Use the Block A lift to reach Classroom 204." },
  { from: "blockB", to: "classroom", time: 6, accessible: false, text: "Use the stairs towards Classroom 204." },
  { from: "library", to: "blockA", time: 5, accessible: true, text: "Follow the path from the library to Block A." }
];

// 3. LIFT STATUS

const STORAGE_KEY = "pathable-lift";
let liftStatus = localStorage.getItem(STORAGE_KEY) || "working";

const liftStatusElement = document.getElementById("liftStatus");
const liftMessage = document.getElementById("liftMessage");

function saveLiftStatus() {
  localStorage.setItem(STORAGE_KEY, liftStatus);
}

function renderLiftStatus() {
  liftStatusElement.className = "";

  if (liftStatus === "working") {
    liftStatusElement.textContent = "● Working";
    liftStatusElement.classList.add("status-working");
    liftMessage.textContent = "The lift is currently marked as working in this demo.";
  } else if (liftStatus === "pending") {
    liftStatusElement.textContent = "● Report Pending";
    liftStatusElement.classList.add("status-pending");
    liftMessage.textContent = "A lift issue has been reported. It is waiting for demo verification.";
  } else {
    liftStatusElement.textContent = "● Not Working";
    liftStatusElement.classList.add("status-broken");
    liftMessage.textContent = "The lift is marked as unavailable. The route finder will avoid it.";
  }
}

document.getElementById("reportBtn").addEventListener("click", () => {
  liftStatus = "pending";
  saveLiftStatus();
  renderLiftStatus();
});

document.getElementById("verifyBtn").addEventListener("click", () => {
  if (liftStatus === "pending") {
    liftStatus = "broken";
    saveLiftStatus();
    renderLiftStatus();
  } else {
    liftMessage.textContent = "There is no pending report to verify.";
  }
});

document.getElementById("fixBtn").addEventListener("click", () => {
  liftStatus = "working";
  saveLiftStatus();
  renderLiftStatus();
});

renderLiftStatus();

// 4. ROUTE FINDING USING DIJKSTRA'S ALGORITHM

function getNeighbours(current, mode) {
  return edges.filter(edge => {
    const connected = edge.from === current || edge.to === current;

    if (!connected) return false;

    if (mode === "stepfree" && !edge.accessible) return false;

    if (edge.liftId && liftStatus === "broken") return false;

    return true;
  });
}

function findRoute(start, destination, mode) {
  const distances = {};
  const previous = {};
  const visited = new Set();

  Object.keys(places).forEach(place => {
    distances[place] = Infinity;
  });

  distances[start] = 0;

  while (true) {
    let current = null;
    let shortest = Infinity;

    for (const place of Object.keys(places)) {
      if (!visited.has(place) && distances[place] < shortest) {
        shortest = distances[place];
        current = place;
      }
    }

    if (current === null) break;
    if (current === destination) break;

    visited.add(current);

    const neighbours = getNeighbours(current, mode);

    for (const edge of neighbours) {
      const next = edge.from === current ? edge.to : edge.from;
      const newDistance = distances[current] + edge.time;

      if (newDistance < distances[next]) {
        distances[next] = newDistance;
        previous[next] = {
          place: current,
          edge: edge
        };
      }
    }
  }

  if (distances[destination] === Infinity) {
    return null;
  }

  const path = [];
  let current = destination;

  while (current !== start) {
    const step = previous[current];

    if (!step) return null;

    path.unshift({
      from: step.place,
      to: current,
      edge: step.edge
    });

    current = step.place;
  }

  return {
    path: path,
    totalTime: distances[destination]
  };
}

// 5. DISPLAY ROUTE

let currentDirections = "";

function renderRoute(route, start, destination, mode) {
  const result = document.getElementById("result");

  if (!route) {
    result.innerHTML = `
      <h4>⚠️ No route found</h4>
      <p>There is no available route for these selected options.
      Try another route or choose the fastest route.</p>
    `;
    currentDirections = "";
    return;
  }

  const modeText = mode === "stepfree" ? "Step-free route" : "Fastest route";

  let instructions = route.path.map((step, index) => {
    let text = step.edge.text;

    // Improve the direction for reverse travel.
    if (step.edge.to !== step.to) {
      text = `Continue from ${places[step.from]} towards ${places[step.to]}.`;
    }

    return `<li>${text}</li>`;
  }).join("");

  result.innerHTML = `
    <h4>✓ Route Found!</h4>
    <p class="route-summary">
      ${modeText} · Approximately ${route.totalTime} minutes
    </p>
    <p><strong>From:</strong> ${places[start]}</p>
    <p><strong>To:</strong> ${places[destination]}</p>
    <br>
    <strong>Directions:</strong>
    <ol>${instructions}</ol>
  `;

  currentDirections =
    `Your ${modeText} from ${places[start]} to ${places[destination]} takes approximately ${route.totalTime} minutes. ` +
    route.path.map(step => {
      return step.edge.text;
    }).join(" ");
}

// 6. ROUTE FORM

document.getElementById("routeForm").addEventListener("submit", function(event) {
  event.preventDefault();

  const start = document.getElementById("from").value;
  const destination = document.getElementById("to").value;
  const mode = document.querySelector('input[name="routeMode"]:checked').value;

  if (start === destination) {
    document.getElementById("result").innerHTML =
      "<h4>📍 You are already there!</h4><p>Please choose a different destination.</p>";
    currentDirections = "";
    return;
  }

  const route = findRoute(start, destination, mode);
  renderRoute(route, start, destination, mode);
});

// 7. VOICE NAVIGATION

document.getElementById("speakBtn").addEventListener("click", () => {
  if (!currentDirections) {
    alert("Please find a route first.");
    return;
  }

  if (!("speechSynthesis" in window)) {
    alert("Voice guidance is not supported by this browser.");
    return;
  }

  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(currentDirections);
  speech.lang = "en-IN";
  speech.rate = 0.9;

  window.speechSynthesis.speak(speech);
});

document.getElementById("stopBtn").addEventListener("click", () => {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
});

// 8. HIGH CONTRAST MODE

document.getElementById("contrastBtn").addEventListener("click", () => {
  document.body.classList.toggle("high-contrast");

  const active = document.body.classList.contains("high-contrast");

  document.getElementById("contrastBtn").textContent =
    active ? "◐ Normal Contrast" : "◐ High Contrast";
});

// 9. INCREASE TEXT SIZE

let fontSizeLevel = 0;

document.getElementById("fontBtn").addEventListener("click", () => {
  fontSizeLevel++;

  if (fontSizeLevel > 2) {
    fontSizeLevel = 0;
  }

  const sizes = ["", "1.08", "1.16"];

  document.documentElement.style.fontSize =
    fontSizeLevel === 0 ? "16px" : `${16 * Number(sizes[fontSizeLevel])}px`;

  document.getElementById("fontBtn").textContent =
    fontSizeLevel === 0 ? "A+ Increase Text" :
    fontSizeLevel === 1 ? "A++ Increase Text" : "A Reset Text";
});

// 10. MOBILE NAVIGATION

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
  navLinks.classList.toggle("open");
});

navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
  });
});

// 11. INITIAL WELCOME MESSAGE

console.log("PathAble Accessible Campus Navigator loaded successfully!");
