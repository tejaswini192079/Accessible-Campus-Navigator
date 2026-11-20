
// PATHABLE - ACCESSIBLE CAMPUS NAVIGATOR

// 1. SAMPLE CAMPUS LOCATIONS
const places = {
  gate: "Main Gate",
  reception: "Reception",
  library: "Library",
  cafeteria: "Cafeteria",
  blockA: "Block A - Classroom 101",
  classroom: "Block A - Classroom 204",
  blockB: "Block B"
};

// 2. SAMPLE CAMPUS PATHS
const edges = [
  {
    a: "gate", b: "reception", min: 2, sf: true,
    text: "Enter through the Main Gate and follow the ramp to Reception."
  },
  {
    a: "reception", b: "library", min: 3, sf: true,
    text: "Walk along the wide corridor to the Library entrance."
  },
  {
    a: "reception", b: "cafeteria", min: 2, sf: true,
    text: "Walk straight past the notice board to the Cafeteria."
  },
  {
    a: "reception", b: "blockA", min: 3, sf: true,
    text: "Follow the accessible pathway to Block A and Classroom 101."
  },
  {
    a: "blockA", b: "classroom", min: 1, sf: true,
    lift: "liftA",
    text: "Use the Block A lift to reach Classroom 204 on the first floor."
  },
  {
    a: "blockA", b: "classroom", min: 1, sf: false,
    text: "Use the staircase to reach the first floor."
  },
  {
    a: "cafeteria", b: "blockB", min: 4, sf: true,
    text: "Follow the covered accessible pathway to Block B."
  },
  {
    a: "blockB", b: "classroom", min: 2, sf: true,
    text: "Use the accessible first-floor connection to Block A."
  },
  {
    a: "library", b: "blockB", min: 2, sf: false,
    text: "Use the outdoor steps to reach Block B."
  }
];

// 3. HTML ELEMENTS
const $ = id => document.getElementById(id);

const fromSelect = $("from");
const toSelect = $("to");
const result = $("result");

let lastSpeech = "";

// 4. LIFT STATUS
let lift = { status: "working" };

try {
  const saved = JSON.parse(localStorage.getItem("pathable-lift"));
  if (saved && ["working", "pending", "broken"].includes(saved.status)) {
    lift = saved;
  }
} catch (error) {
  console.log("Could not load saved lift status.");
}

function saveLift() {
  try {
    localStorage.setItem("pathable-lift", JSON.stringify(lift));
  } catch (error) {
    console.log("Could not save lift status.");
  }
}

// 5. CREATE LOCATION DROPDOWNS
Object.entries(places).forEach(([key, name]) => {
  fromSelect.add(new Option(name, key));
  toSelect.add(new Option(name, key));
});

fromSelect.value = "gate";
toSelect.value = "classroom";

// 6. CHECK WHETHER A PATH CAN BE USED
function usable(edge, mode) {
  if (mode === "stepfree" && !edge.sf) {
    return false;
  }

  if (edge.lift && lift.status === "broken") {
    return false;
  }

  return true;
}

// 7. DIJKSTRA ROUTE FINDING ALGORITHM
function findRoute(from, to, mode) {
  const distances = {};
  const previous = {};
  const visited = new Set();

  Object.keys(places).forEach(key => {
    distances[key] = Infinity;
  });

  distances[from] = 0;

  while (true) {
    let current = null;

    for (const key of Object.keys(distances)) {
      if (
        !visited.has(key) &&
        (current === null || distances[key] < distances[current])
      ) {
        current = key;
      }
    }

    if (current === null || distances[current] === Infinity) {
      break;
    }

    if (current === to) {
      break;
    }

    visited.add(current);

    for (const edge of edges) {
      if (!usable(edge, mode)) continue;

      let next = null;

      if (edge.a === current) {
        next = edge.b;
      } else if (edge.b === current) {
        next = edge.a;
      }

      if (next === null) continue;

      const newDistance = distances[current] + edge.min;

      if (newDistance < distances[next]) {
        distances[next] = newDistance;

        previous[next] = {
          node: current,
          edge: edge
        };
      }
    }
  }

  if (distances[to] === Infinity) {
    return null;
  }

  const steps = [];
  let current = to;

  while (current !== from) {
    const previousStep = previous[current];

    if (!previousStep) return null;

    steps.unshift({
      from: previousStep.node,
      to: current,
      edge: previousStep.edge
    });

    current = previousStep.node;
  }

  return {
    minutes: distances[to],
    steps: steps
  };
}

// 8. CREATE DIRECTIONS
function describe(step) {
  const edge = step.edge;

  if (edge.a === step.from) {
    return edge.text;
  }

  if (edge.lift) {
    return "Use the Block A lift to go down to the ground floor.";
  }

  if (!edge.sf && edge.a === "blockA") {
    return "Take the staircase down to the ground floor.";
  }

  return `Walk from ${places[step.from]} to ${places[step.to]}.`;
}

// 9. DISPLAY ROUTE
function renderRoute() {
  const selectedMode =
    document.querySelector('input[name="mode"]:checked').value;

  const from = fromSelect.value;
  const to = toSelect.value;

  if (from === to) {
    result.innerHTML = `
      <div class="empty-result">
        <strong>You are already at your destination!</strong>
        <span>Please select another destination.</span>
      </div>
    `;

    lastSpeech = "You are already at your destination.";
    return;
  }

  const route = findRoute(from, to, selectedMode);

  if (!route) {
    result.innerHTML = `
      <div class="result-tags">
        <span class="result-tag warning">No route available</span>
      </div>
      <p>No suitable route is available in this sample campus.
      Please contact campus staff for assistance.</p>
    `;

    lastSpeech =
      "No suitable route is available. Please contact campus staff.";
    return;
  }

  const usesStairs = route.steps.some(step => !step.edge.sf);

  const routeName =
    selectedMode === "stepfree" ? "Step-free route" : "Fastest route";

  const directions = route.steps
    .map(step => `<li>${describe(step)}</li>`)
    .join("");

  const liftMessage =
    lift.status === "broken"
      ? `<p class="status-broken"><strong>⚠ Block A lift is out of service. The route has been updated.</strong></p>`
      : lift.status === "pending"
      ? `<p class="status-pending"><strong>Lift issue is awaiting verification. Routes have not changed yet.</strong></p>`
      : "";

  result.innerHTML = `
    <div class="result-tags">
      <span class="result-tag">${routeName}</span>
      <span class="result-tag ${usesStairs ? "warning" : ""}">
        ${usesStairs ? "Includes stairs" : "No stairs"}
      </span>
      <span class="result-tag">⏱ About ${route.minutes} min</span>
    </div>

    ${liftMessage}

    <h4>Follow these directions:</h4>
    <ol>${directions}</ol>

    <p><strong>🎉 You have arrived at ${places[to]}!</strong></p>
  `;

  lastSpeech =
    `${routeName}. About ${route.minutes} minutes. ` +
    route.steps.map((step, index) =>
      `Step ${index + 1}. ${describe(step)}`
    ).join(" ") +
    ` You have arrived at ${places[to]}.`;
}

// 10. DISPLAY LIFT STATUS
function renderLift() {
  const statusElement = $("liftStatus");

  const statusInfo = {
    working: {
      className: "status-working",
      text: "● Working normally"
    },
    pending: {
      className: "status-pending",
      text: "● Reported - waiting for verification"
    },
    broken: {
      className: "status-broken",
      text: "● Out of service - verified"
    }
  };

  const current = statusInfo[lift.status];

  statusElement.className = "lift-status " + current.className;
  statusElement.textContent = current.text;

  $("reportBtn").disabled = lift.status !== "working";
  $("verifyBtn").disabled = lift.status !== "pending";
  $("fixBtn").disabled = lift.status === "working";
}

// 11. VOICE NAVIGATION
function speakDirections() {
  if (!("speechSynthesis" in window)) {
    alert("Sorry! Voice navigation is not supported in this browser.");
    return;
  }

  // Refresh route before reading
  renderRoute();

  speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(lastSpeech);

  speech.lang = "en-IN";
  speech.rate = 0.9;
  speech.pitch = 1;

  speechSynthesis.speak(speech);
}

// 12. ROUTE FORM
$("routeForm").addEventListener("submit", function(event) {
  event.preventDefault();
  renderRoute();
});

// 13. VOICE BUTTON
$("speakBtn").addEventListener("click", speakDirections);

// 14. STOP VOICE
$("stopBtn").addEventListener("click", function() {
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }
});

// 15. REPORT LIFT PROBLEM
$("reportBtn").addEventListener("click", function() {
  lift.status = "pending";

  saveLift();
  renderLift();
  renderRoute();
});

// 16. VERIFY LIFT REPORT
$("verifyBtn").addEventListener("click", function() {
  lift.status = "broken";

  saveLift();
  renderLift();
  renderRoute();
});

// 17. MARK LIFT AS WORKING
$("fixBtn").addEventListener("click", function() {
  lift.status = "working";

  saveLift();
  renderLift();
  renderRoute();
});

// 18. HIGH CONTRAST MODE
$("contrastBtn").addEventListener("click", function() {
  const enabled = document.body.classList.toggle("hc");

  this.setAttribute("aria-pressed", String(enabled));
});

// 19. INCREASE TEXT SIZE
let fontSize = 100;

$("fontBtn").addEventListener("click", function() {
  fontSize = fontSize >= 130 ? 100 : fontSize + 10;

  document.documentElement.style.setProperty(
    "--fs",
    fontSize + "%"
  );
});

// 20. MOBILE NAVIGATION
$("menuToggle").addEventListener("click", function() {
  const nav = $("navLinks");
  const isOpen = nav.classList.toggle("open");

  this.setAttribute("aria-expanded", String(isOpen));
  this.setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Open navigation"
  );

  this.textContent = isOpen ? "✕" : "☰";
});

// Close mobile menu after selecting a link
document.querySelectorAll("#navLinks a").forEach(link => {
  link.addEventListener("click", function() {
    $("navLinks").classList.remove("open");
    $("menuToggle").setAttribute("aria-expanded", "false");
    $("menuToggle").setAttribute("aria-label", "Open navigation");
    $("menuToggle").textContent = "☰";
  });
});

// 21. INITIAL WEBSITE SETUP
renderLift();
renderRoute();

console.log("PathAble Accessible Campus Navigator loaded successfully!");
