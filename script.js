
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const startSelect = $("startLocation");
  const endSelect = $("endLocation");
  const wheelchairMode = $("wheelchairMode");
  const voiceMode = $("voiceMode");
  const routeResult = $("routeResult");
  const routeLine = $("activeRouteLine");
  const toast = $("toast");

  const synth = "speechSynthesis" in window
    ? window.speechSynthesis
    : null;

  let currentRoute = null;
  let toastTimer = null;
  let liftWorking = true;
  let corridorOpen = true;
  let recognition = null;

  // CAMPUS LOCATIONS

  const locations = {
    entrance: {
      name: "Main Entrance",
      x: 60, y: 235, floor: 0
    },

    groundHall: {
      name: "Ground Hall",
      x: 420, y: 410, floor: 0
    },

    ramp: {
      name: "Ramp Junction",
      x: 250, y: 235, floor: 0
    },

    liftLobby: {
      name: "Lift Lobby",
      x: 420, y: 145, floor: 0
    },

    firstFloor: {
      name: "First Floor",
      x: 600, y: 235, floor: 1
    },

    secondHall: {
      name: "Second Floor Hall",
      x: 690, y: 125, floor: 2
    },

    room204: {
      name: "Room 204",
      x: 820, y: 235, floor: 2
    },

    library: {
      name: "Library",
      x: 760, y: 385, floor: 0
    },

    office: {
      name: "Office",
      x: 105, y: 385, floor: 0
    }
  };

  // CAMPUS CONNECTIONS
  // Each connection can be available or unavailable.

  const connections = [
    {
      a: "entrance",
      b: "groundHall",
      type: "corridor",
      cost: 3,
      label: "Follow the main entrance corridor"
    },

    {
      a: "groundHall",
      b: "ramp",
      type: "corridor",
      cost: 2,
      label: "Continue to the ramp junction"
    },

    {
      a: "groundHall",
      b: "liftLobby",
      type: "corridor",
      cost: 2,
      label: "Continue along the ground-floor corridor to the lift lobby"
    },

    {
      a: "liftLobby",
      b: "firstFloor",
      type: "lift",
      cost: 2,
      label: "Take the lift to the first floor"
    },

    {
      a: "firstFloor",
      b: "secondHall",
      type: "stairs",
      cost: 2,
      label: "Use the stairs to reach the second-floor hall"
    },

    {
      a: "ramp",
      b: "firstFloor",
      type: "ramp",
      cost: 7,
      label: "Follow the accessible ramp to the first floor"
    },

    {
      a: "firstFloor",
      b: "library",
      type: "corridor",
      cost: 3,
      label: "Continue along the side corridor beside the library"
    },

    {
      a: "library",
      b: "secondHall",
      type: "ramp",
      cost: 5,
      label: "Follow the sloped accessible passage to the second-floor hall"
    },

    {
      a: "secondHall",
      b: "room204",
      type: "corridor",
      cost: 2,
      label: "Follow the second-floor corridor to Room 204"
    },

    {
      a: "groundHall",
      b: "office",
      type: "corridor",
      cost: 3,
      label: "Walk towards the campus office"
    },

    {
      a: "office",
      b: "library",
      type: "corridor",
      cost: 4,
      label: "Continue along the office-side corridor"
    },

    {
      a: "ramp",
      b: "library",
      type: "corridor",
      cost: 5,
      label: "Follow the lower campus walkway to the library"
    }
  ];

  // NOTIFICATION

  function notify(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
  }

  // CHECK AVAILABLE PATHS

  function availableEdges() {
    return connections.filter(edge => {

      if (edge.type === "lift" && !liftWorking) {
        return false;
      }

      if (
        edge.a === "groundHall" &&
        edge.b === "liftLobby" &&
        !corridorOpen
      ) {
        return false;
      }

      if (edge.type === "stairs" && wheelchairMode.checked) {
        return false;
      }

      return true;
    });
  }

  // DIJKSTRA SHORTEST PATH ALGORITHM

  function shortestPath(start, end) {
    const edges = availableEdges();

    const dist = {};
    const previous = {};

    const unvisited = new Set(Object.keys(locations));

    Object.keys(locations).forEach(node => {
      dist[node] = Infinity;
    });

    dist[start] = 0;

    while (unvisited.size) {
      let current = null;

      for (const node of unvisited) {
        if (
          current === null ||
          dist[node] < dist[current]
        ) {
          current = node;
        }
      }

      if (current === null || dist[current] === Infinity) {
        break;
      }

      unvisited.delete(current);

      if (current === end) {
        break;
      }

      for (const edge of edges) {
        let next = null;

        if (edge.a === current) {
          next = edge.b;
        } else if (edge.b === current) {
          next = edge.a;
        }

        if (!next || !unvisited.has(next)) {
          continue;
        }

        const alternative = dist[current] + edge.cost;

        if (alternative < dist[next]) {
          dist[next] = alternative;

          previous[next] = {
            node: current,
            edge: edge
          };
        }
      }
    }

    if (dist[end] === Infinity) {
      return null;
    }

    const nodes = [end];
    const usedEdges = [];

    let cursor = end;

    while (cursor !== start) {
      const step = previous[cursor];

      if (!step) {
        return null;
      }

      usedEdges.unshift(step.edge);
      cursor = step.node;
      nodes.unshift(cursor);
    }

    return {
      nodes: nodes,
      edges: usedEdges,
      cost: dist[end]
    };
  }

  // GENERATE DIRECTIONS

  function routeInstructions(route) {
    return route.edges.map(edge => {
      if (edge.type === "lift") {
        return "Use the working lift to travel between floors.";
      }

      if (edge.type === "ramp") {
        return "Use the step-free ramp. Keep to the accessible sloped path.";
      }

      return edge.label + ".";
    });
  }

  // DRAW SELECTED ROUTE ON MAP

  function drawRoute(route) {
    if (!route || !routeLine) return;

    const points = route.nodes
      .map(node => `${locations[node].x},${locations[node].y}`)
      .join(" ");

    routeLine.setAttribute(
      "d",
      `M ${points.replaceAll(" ", " L ")}`
    );

    document.querySelectorAll(".map-marker").forEach(marker => {
      marker.classList.toggle(
        "route-stop",
        route.nodes.includes(marker.dataset.node)
      );

      marker.classList.toggle(
        "selected",
        marker.dataset.node === startSelect.value ||
        marker.dataset.node === endSelect.value
      );
    });
  }

  function clearMapRoute() {
    if (routeLine) {
      routeLine.setAttribute("d", "");
      routeLine.removeAttribute("points");
    }

    document.querySelectorAll(".map-marker").forEach(marker => {
      marker.classList.remove("route-stop", "selected");
    });
  }

  // DISPLAY ROUTE RESULT

  function renderRoute(route, start, end, wasRecalculated = false) {
    const steps = routeInstructions(route);

    const hasRamp = route.edges.some(
      edge => edge.type === "ramp"
    );

    const distance = Math.max(1, Math.round(route.cost * 55));
    const minutes = Math.max(1, Math.ceil(route.cost * 0.8));

    let alertText;

    if (wasRecalculated) {
      alertText =
        `An obstacle changed the route. PathAble recalculated and found an alternative ${hasRamp ? "step-free " : ""}path.`;
    } else if (hasRamp && !liftWorking) {
      alertText =
        "The lift is unavailable. This alternative uses the accessible ramp instead.";
    } else {
      alertText =
        "Route checked against your selected accessibility preferences.";
    }

    routeResult.innerHTML = `
      <div class="route-summary">
        <h4>${locations[start].name} → ${locations[end].name}</h4>

        <div class="route-metrics">
          <span class="metric">≈ ${minutes} min</span>
          <span class="metric">≈ ${distance} m</span>
          <span class="metric">${wheelchairMode.checked ? "Step-free" : "Standard"}</span>
        </div>
      </div>

      <div class="route-alert ${wasRecalculated || hasRamp ? "" : "good"}">
        ${alertText}
      </div>

      <ol class="route-steps">
        ${steps.map((step, index) => `
          <li>
            <span>${index + 1}</span>
            <div>${step}</div>
          </li>
        `).join("")}

        <li>
          <span>✓</span>
          <div>You have reached ${locations[end].name}.</div>
        </li>
      </ol>

      <div class="route-controls">
        <button type="button" id="repeatRouteButton">🔊 Read directions</button>
        <button type="button" id="copyRouteButton">Copy route text</button>
      </div>
    `;

    $("repeatRouteButton").addEventListener("click", () => {
      speakText([
        `Starting at ${locations[start].name}.`,
        ...steps,
        `You have reached ${locations[end].name}.`
      ].join(" "));
    });

    $("copyRouteButton").addEventListener("click", () => {
      copyRoute([
        `${locations[start].name} to ${locations[end].name}`,
        ...steps
      ].join("\n"));
    });

    drawRoute(route);

    currentRoute = {
      ...route,
      start,
      end,
      text: [
        `Starting at ${locations[start].name}.`,
        ...steps,
        `You have reached ${locations[end].name}.`
      ].join(" ")
    };

    if (voiceMode.checked) {
      speakText(currentRoute.text);
    }
  }

  // FIND ROUTE

  function findRoute(recalculated = false) {
    const start = startSelect.value;
    const end = endSelect.value;

    if (start === end) {
      notify("Choose two different locations.");
      return;
    }

    const route = shortestPath(start, end);

    if (!route) {
      currentRoute = null;
      clearMapRoute();

      routeResult.innerHTML = `
        <div class="route-alert">
          No accessible route is available with the current settings.
          Please choose another destination or check facility status.
        </div>
      `;

      notify("No suitable route found. Try another destination.");
      return;
    }

    renderRoute(route, start, end, recalculated);

    if (recalculated) {
      notify("Obstacle detected. Your route has been recalculated.");
    } else {
      notify("Accessible route found.");
    }
  }

  // VOICE OUTPUT

  function speakText(text) {
    if (!synth) {
      notify("Speech playback is not supported by this browser.");
      return;
    }

    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "en-IN";
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onerror = () => {
      notify("Speech could not start. Check your device audio and browser settings.");
    };

    synth.speak(utterance);
  }

  function stopSpeech() {
    if (synth) {
      synth.cancel();
    }
  }

  // COPY ROUTE

  async function copyRoute(text) {
    try {
      await navigator.clipboard.writeText(text);
      notify("Route instructions copied.");
    } catch (error) {
      notify("Copy is unavailable here. You can select and copy the route text.");
    }
  }

  // RECALCULATE AFTER OBSTACLE CHANGE

  function refreshIfRouteExists() {
    if (!currentRoute) return;

    const start = currentRoute.start;
    const end = currentRoute.end;

    const newRoute = shortestPath(start, end);

    if (newRoute) {
      renderRoute(newRoute, start, end, true);
    } else {
      currentRoute = null;
      clearMapRoute();

      routeResult.innerHTML = `
        <div class="route-alert">
          The current route is no longer available.
          No accessible alternative was found. Choose another destination.
        </div>
      `;

      notify("No accessible alternative is available.");
    }
  }

  // FACILITY STATUS

  function updateFacilityUI() {
    const liftStatus = $("liftStatus");
    const corridorStatus = $("corridorStatus");

    liftStatus.classList.toggle("unavailable", !liftWorking);

    liftStatus.innerHTML = `
      <i></i> ${liftWorking ? "Operational" : "Out of service"}
    `;

    $("liftDescription").textContent = liftWorking
      ? "Lift is operational in this demonstration."
      : "Lift is unavailable. Accessible ramp routes will be checked.";

    $("toggleLiftButton").textContent = liftWorking
      ? "Simulate breakdown"
      : "Restore lift";

    corridorStatus.classList.toggle("unavailable", !corridorOpen);

    corridorStatus.innerHTML = `
      <i></i> ${corridorOpen ? "Open" : "Blocked"}
    `;

    $("corridorDescription").textContent = corridorOpen
      ? "Main corridor is open in this demonstration."
      : "Main corridor is blocked. The route finder will avoid it.";

    $("toggleCorridorButton").textContent = corridorOpen
      ? "Block corridor"
      : "Reopen corridor";
  }

  // MICROPHONE INPUT

  function initVoiceRecognition() {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    const mic = $("micButton");
    const status = $("micStatus");

    if (!mic || !status) return;

    if (!SpeechRecognition) {
      mic.disabled = true;
      mic.textContent = "🎙 Voice input unavailable";
      status.textContent = "Try Chrome or use the destination list.";
      return;
    }

    recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      mic.textContent = "Listening… tap to stop";
      status.textContent = "Listening for a campus location";
    };

    recognition.onend = () => {
      mic.textContent = "🎙 Speak a destination";

      if (status.textContent === "Listening for a campus location") {
        status.textContent = "Microphone is off";
      }
    };

    recognition.onerror = (event) => {
      status.textContent =
        event.error === "not-allowed"
          ? "Microphone permission was denied."
          : "Voice input could not start.";

      notify(status.textContent);
    };

    recognition.onresult = (event) => {
      const heard = event.results[0][0].transcript.toLowerCase();

      const match = Object.entries(locations).find(
        ([key, location]) =>
          heard.includes(location.name.toLowerCase()) ||
          heard.includes(key.toLowerCase())
      );

      if (match) {
        endSelect.value = match[0];

        status.textContent =
          `Destination set to ${match[1].name}`;

        notify(`Destination set to ${match[1].name}`);

        findRoute();
      } else {
        status.textContent =
          `Heard: "${heard}". Please choose from the list.`;

        notify("Location not recognised. Please use the destination list.");
      }
    };

    mic.addEventListener("click", () => {
      if (mic.textContent.includes("Listening")) {
        recognition.stop();
      } else {
        try {
          recognition.start();
        } catch (error) {
          notify("Voice input is already active.");
        }
      }
    });
  }

  // BUTTON EVENTS

  $("findRouteButton").addEventListener("click", () => {
    findRoute(false);
  });

  $("swapButton").addEventListener("click", () => {
    const oldStart = startSelect.value;

    startSelect.value = endSelect.value;
    endSelect.value = oldStart;

    notify("Start and destination swapped.");
  });

  $("resetButton").addEventListener("click", () => {
    startSelect.value = "entrance";
    endSelect.value = "room204";

    wheelchairMode.checked = true;
    voiceMode.checked = false;

    stopSpeech();

    currentRoute = null;
    clearMapRoute();

    routeResult.innerHTML = `
      <div class="empty-route">
        <span>🧭</span>
        <div>
          <b>Your route will appear here</b>
          <small>Choose your start and destination, then find an accessible route.</small>
        </div>
      </div>
    `;

    notify("Planner has been reset.");
  });

  $("toggleLiftButton").addEventListener("click", () => {
    liftWorking = !liftWorking;

    updateFacilityUI();

    notify(
      liftWorking
        ? "Lift restored in the demo."
        : "Lift marked out of service."
    );

    refreshIfRouteExists();
  });

  $("toggleCorridorButton").addEventListener("click", () => {
    corridorOpen = !corridorOpen;

    updateFacilityUI();

    notify(
      corridorOpen
        ? "Corridor reopened in the demo."
        : "Corridor marked as blocked."
    );

    refreshIfRouteExists();
  });

  $("playVoiceButton").addEventListener("click", () => {
    speakText(
      currentRoute
        ? currentRoute.text
        : $("voiceSampleText").textContent
    );
  });

  $("stopVoiceButton").addEventListener("click", () => {
    stopSpeech();
    notify("Voice playback stopped.");
  });

  // UPDATE ROUTE WHEN ACCESSIBILITY SETTING CHANGES

  $("wheelchairMode").addEventListener("change", () => {
    if (currentRoute) {
      refreshIfRouteExists();
    }
  });

  // MAP MARKERS

  document.querySelectorAll(".map-marker").forEach(marker => {
    marker.addEventListener("click", () => {
      startSelect.value = marker.dataset.node;

      document.querySelectorAll(".map-marker").forEach(item => {
        item.classList.toggle("selected", item === marker);
      });

      notify(
        `${locations[marker.dataset.node].name} selected as starting point.`
      );
    });
  });

  // HIGH CONTRAST

  $("contrastButton").addEventListener("click", () => {
    const active = document.body.classList.toggle("high-contrast");

    $("contrastButton").setAttribute("aria-pressed", String(active));

    notify(
      active
        ? "High contrast enabled."
        : "High contrast disabled."
    );
  });

  // LARGER TEXT

  $("textSizeButton").addEventListener("click", () => {
    const active = document.body.classList.toggle("large-text");

    $("textSizeButton").setAttribute("aria-pressed", String(active));

    notify(
      active
        ? "Larger text enabled."
        : "Normal text size restored."
    );
  });

  // MOBILE MENU

  $("menuToggle").addEventListener("click", () => {
    const open = $("navLinks").classList.toggle("open");

    $("menuToggle").setAttribute("aria-expanded", String(open));
    $("menuToggle").textContent = open ? "✕" : "☰";
  });

  document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
      $("navLinks").classList.remove("open");

      $("menuToggle").setAttribute("aria-expanded", "false");
      $("menuToggle").textContent = "☰";
    });
  });

  // INITIALIZE

  initVoiceRecognition();
  updateFacilityUI();

})();
