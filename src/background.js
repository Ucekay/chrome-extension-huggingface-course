// background.js - Handles requests from the frontend, runs the model, then sends back a response
// TODO - make persistent (i.e., do not close after inactivity)

if (
  typeof ServiceWorkerGlobalScope !== "undefined" &&
  self instanceof ServiceWorkerGlobalScope
) {
  // Load the library
  const { pipeline, env } = require("@xenova/transformers");

  // Set environment variables to only use local models.
  env.useBrowserCache = false;
  env.remoteModels = false;
  env.localModelPath = chrome.runtime.getURL("models/");
  env.backends.onnx.wasm.wasmPaths = chrome.runtime.getURL("wasm/");
  env.backends.onnx.wasm.numThreads = 1;

  // TODO: Replace this with your own task and model
  const task = "token-classification";
  //   const model = "distilbert-base-uncased-finetuned-sst-2-english";
  //   const model = "nlptown/bert-base-multilingual-uncased-sentiment";
  const model = undefined;

  // Load model, storing the promise that is returned from the pipeline function.
  // Doing it this way will load the model in the background as soon as the worker is created.
  // To actually use the model, you must call `await modelPromise` to get the actual classifier.
  const modelPromise = pipeline(task, model, {
    progress_callback: (data) => {
      // If you would like to add a progress bar for model loading,
      // you can send `data` back to the UI.

      (async () => {
        const sendData = {
          action: "model_progress",
          data,
        };
        // Tab
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tab) {
          // Message to content
          const content = await chrome.tabs.sendMessage(tab.id, sendData);
          // Message to popup
          const response = await chrome.runtime.sendMessage(sendData);
          console.log("BG response", response);
        }
      })();
    },
  });

  // Listen for messages from the UI, process it, and send the result back.
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Run model prediction asynchronously
    (async function () {
      let model = await modelPromise; // 1. Load model if not already loaded
      let result = await model(message); // 2. Run model prediction
      sendResponse(result); // 3. Send response back to UI
    })();

    // return true to indicate we will send a response asynchronously
    // see https://stackoverflow.com/a/46628145 for more information
    return true;
  });
}
