/* ==========================================
   PATHABLE - REAL MICROPHONE VOICE RECORDER
   ========================================== */

(() => {
  const startButton = document.getElementById("recordStartButton");
  const pauseButton = document.getElementById("recordPauseButton");
  const stopButton = document.getElementById("recordStopButton");
  const downloadButton = document.getElementById("recordDownloadButton");
  const clearButton = document.getElementById("recordClearButton");

  const status = document.getElementById("recordingStatus");
  const help = document.getElementById("recorderHelp");
  const timer = document.getElementById("recordingTime");
  const playback = document.getElementById("recordingPlayback");
  const visual = document.getElementById("recorderVisual");

  if (!startButton) return;

  let recorder = null;
  let stream = null;
  let chunks = [];
  let recordingBlob = null;
  let recordingUrl = null;

  let elapsedBeforeStart = 0;
  let startedAt = 0;
  let timerInterval = null;

  // UPDATE RECORDING STATUS

  function setStatus(label, mode = "") {
    status.className = `recording-status ${mode}`.trim();
    status.innerHTML = `<i></i>${label}`;
  }

  // FORMAT TIMER

  function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);

    return (
      String(minutes).padStart(2, "0") +
      ":" +
      String(seconds % 60).padStart(2, "0")
    );
  }

  function updateTimer() {
    const current =
      recorder && recorder.state === "recording"
        ? elapsedBeforeStart + (Date.now() - startedAt)
        : elapsedBeforeStart;

    timer.textContent = formatTime(current);
  }

  // RELEASE MICROPHONE

  function releaseMicrophone() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
  }

  function clearTimer() {
    if (timerInterval) {
      window.clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function resetButtons() {
    clearTimer();

    visual.classList.remove("is-recording");

    pauseButton.disabled = true;
    stopButton.disabled = true;
    startButton.disabled = false;

    startButton.textContent = "● Record Again";
    pauseButton.textContent = "Ⅱ Pause";
  }

  // START RECORDING

  async function startRecording() {
    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      !window.MediaRecorder
    ) {
      help.textContent =
        "Your browser does not support microphone recording. Please use an updated Chrome or Edge browser.";

      setStatus("Not supported");
      return;
    }

    try {
      startButton.disabled = true;

      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
        recordingUrl = null;
      }

      playback.pause();
      playback.removeAttribute("src");
      playback.hidden = true;

      recordingBlob = null;
      chunks = [];

      downloadButton.disabled = true;
      clearButton.disabled = true;

      elapsedBeforeStart = 0;
      timer.textContent = "00:00";

      help.textContent = "Waiting for microphone permission...";

      // REQUEST MICROPHONE PERMISSION

      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // CHOOSE SUPPORTED AUDIO FORMAT

      const formats = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4"
      ];

      const supportedFormat = formats.find(format =>
        MediaRecorder.isTypeSupported(format)
      );

      recorder = supportedFormat
        ? new MediaRecorder(stream, { mimeType: supportedFormat })
        : new MediaRecorder(stream);

      // COLLECT AUDIO DATA

      recorder.addEventListener("dataavailable", event => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      });

      // WHEN RECORDING STOPS

      recorder.addEventListener("stop", () => {
        recordingBlob = new Blob(chunks, {
          type: recorder.mimeType || "audio/webm"
        });

        if (recordingBlob.size > 0) {
          recordingUrl = URL.createObjectURL(recordingBlob);

          playback.src = recordingUrl;
          playback.hidden = false;

          downloadButton.disabled = false;
          clearButton.disabled = false;

          help.textContent =
            "Your recording is ready! Play it back or download your voice note.";

          setStatus("Recording ready");
        } else {
          help.textContent =
            "No audio was captured. Please check your microphone and try again.";

          setStatus("No audio");
        }

        releaseMicrophone();
        resetButtons();
      });

      recorder.addEventListener("error", () => {
        help.textContent =
          "Recording error. Please check your microphone and try again.";

        setStatus("Recording error");

        releaseMicrophone();
        resetButtons();
      });

      // START

      recorder.start(250);

      startedAt = Date.now();

      timerInterval = window.setInterval(updateTimer, 250);

      visual.classList.add("is-recording");

      startButton.disabled = true;
      pauseButton.disabled = false;
      stopButton.disabled = false;

      setStatus("Recording", "is-recording");

      help.textContent =
        "Recording in progress. Speak clearly. Press Pause or Stop when finished.";

    } catch (error) {
      releaseMicrophone();
      resetButtons();

      setStatus("Microphone blocked");

      if (error.name === "NotAllowedError") {
        help.textContent =
          "Microphone permission denied. Allow microphone access in your browser settings and try again.";

      } else if (error.name === "NotFoundError") {
        help.textContent =
          "No microphone was detected. Connect or enable a microphone.";

      } else {
        help.textContent =
          "Could not start recording. Use HTTPS or localhost and check your microphone.";
      }
    }
  }

  // PAUSE AND RESUME

  function pauseRecording() {
    if (!recorder) return;

    if (recorder.state === "recording") {

      elapsedBeforeStart += Date.now() - startedAt;

      recorder.pause();

      clearTimer();
      updateTimer();

      visual.classList.remove("is-recording");

      pauseButton.textContent = "▶ Resume";

      setStatus("Paused", "is-paused");

      help.textContent =
        "Recording paused. Press Resume to continue.";

    } else if (recorder.state === "paused") {

      recorder.resume();

      startedAt = Date.now();

      timerInterval = window.setInterval(updateTimer, 250);

      visual.classList.add("is-recording");

      pauseButton.textContent = "Ⅱ Pause";

      setStatus("Recording", "is-recording");

      help.textContent =
        "Recording in progress. Speak clearly.";
    }
  }

  // STOP RECORDING

  function stopRecording() {
    if (!recorder || recorder.state === "inactive") return;

    if (recorder.state === "recording") {
      elapsedBeforeStart += Date.now() - startedAt;
    }

    clearTimer();

    recorder.stop();

    setStatus("Finalising...");

    help.textContent = "Preparing your voice recording...";
  }

  // DOWNLOAD AUDIO

  function downloadRecording() {
    if (!recordingBlob || !recordingUrl) return;

    const extension = recordingBlob.type.includes("mp4")
      ? "m4a"
      : "webm";

    const link = document.createElement("a");

    link.href = recordingUrl;

    link.download =
      `PathAble-Voice-Note-${new Date()
        .toISOString()
        .slice(0, 10)}.${extension}`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    help.textContent = "Your recording download has started.";
  }

  // CLEAR RECORDING

  function clearRecording() {
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }

    clearTimer();

    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
      recordingUrl = null;
    }

    recordingBlob = null;
    chunks = [];

    playback.pause();
    playback.removeAttribute("src");
    playback.hidden = true;

    timer.textContent = "00:00";

    downloadButton.disabled = true;
    clearButton.disabled = true;

    startButton.disabled = false;
    startButton.textContent = "● Start Recording";

    pauseButton.disabled = true;
    stopButton.disabled = true;

    pauseButton.textContent = "Ⅱ Pause";

    visual.classList.remove("is-recording");

    setStatus("Ready");

    help.textContent =
      "Allow microphone access when your browser asks. Then press Start Recording.";

    releaseMicrophone();
  }

  // BUTTON EVENTS

  startButton.addEventListener("click", startRecording);

  pauseButton.addEventListener("click", pauseRecording);

  stopButton.addEventListener("click", stopRecording);

  downloadButton.addEventListener("click", downloadRecording);

  clearButton.addEventListener("click", clearRecording);

  // CLEAN UP MICROPHONE WHEN LEAVING PAGE

  window.addEventListener("beforeunload", () => {
    releaseMicrophone();

    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
    }
  });

  console.log("PathAble microphone recorder initialized successfully.");

})();
