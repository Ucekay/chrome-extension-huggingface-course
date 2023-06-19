// This script handles interaction with the user interface, as well as handling
// the communication between the main thread (UI) and the background thread (processing).
const inputElement = document.getElementById("text");
const outputElement = document.getElementById("output");
const progressElement = document.getElementById("progress");
const responseElement = document.getElementById("response");

// Hide the progress bar and results when the page loads.
progressElement.style.display = "none";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("popup", request);
  const { action, data } = request;

  if (action === "model_progress") {
    progressElement.style.display = "block";
    inputElement.style.display = "none";
    outputElement.style.display = "none";

    if (data.status === "progress") {
      progressElement.value = data.loaded;
      progressElement.max = data.total;
      progressElement.textContent = data.progress;
    } else if (data.status === "done") {
      // progressElement.textContent = "Model loaded";
      progressElement.style.display = "none";
      inputElement.style.display = "block";
      outputElement.style.display = "block";
      inputElement.focus();
    }
  }
});

function handleResponse(response) {
  // [
  //   {
  //     entity: "B-PER",
  //     score: 0.9991012215614319,
  //     index: 1,
  //     word: "Jake",
  //     start: null,
  //     end: null,
  //   },
  //   {
  //     entity: "B-LOC",
  //     score: 0.9998325109481812,
  //     index: 4,
  //     word: "London",
  //     start: null,
  //     end: null,
  //   },
  // ];
  if (response.length > 0) {
    // Clear the results container
    responseElement.innerHTML = "";

    response.forEach((result) => {
      const resultDiv = document.createElement("div");
      resultDiv.className = "result";

      // Calculate the score percentage
      const scorePercentage = Math.round(result.score * 100);
      // Create the HTML for the result
      resultDiv.innerHTML = `
        <div class="result-text">
          ${result.word}
        </div>
        <div class="score-badge-container">
          <span class="score-badge ${result.entity.toLowerCase()}">${scorePercentage}%</span>
        </div>
      `;
      // Set ARIA attr for WCAG
      resultDiv.setAttribute("role", "button");
      resultDiv.setAttribute(
        "aria-label",
        `${result.word} is a ${result.entity}`
      );
      resultDiv.setAttribute("tabindex", "0");

      // Append to the results container
      responseElement.appendChild(resultDiv);
      // Click handler
      resultDiv.addEventListener("click", () => {
        handleResult();
      });
      // Keyboard events
      resultDiv.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          handleResult();
        }
      });
    });
    // responseElement.innerHTML = JSON.stringify(response, null, 2);
  } else {
    responseElement.innerText = "No entities found";
  }
}
// Handle click on result
function handleResult() {
  alert("Hello");
}

// Focus on input when pop loads
document.addEventListener("DOMContentLoaded", () => {
  inputElement.focus();
});

// 1. Send input data to the worker thread when it changes.
inputElement.addEventListener("input", (event) => {
  chrome.runtime.sendMessage(event.target.value, (response) => {
    // 2. Handle results returned by the service worker (`background.js`) and update the UI.
    // outputElement.innerText = JSON.stringify(response, null, 2);
    handleResponse(response);
  });
});
