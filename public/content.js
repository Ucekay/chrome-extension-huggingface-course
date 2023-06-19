console.log("Hello world, from Nerding I/O", "stuff");

function showStickyHeader(data) {
  const header = document.createElement("div");
  // ID
  header.id = "stickyHeader";
  // Text
  header.textContent = `Model ${data.name} is ${data.status}!`;
  // Style
  header.style =
    "position: fixed; top: 0; left: 0; width: 100%; background: #000; color: #fff; text-align: center;";
  // Append
  document.body.appendChild(header);

  // Remove after 5 seconds
  setTimeout(function () {
    header.remove();
  }, 10000);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("content", request);
  const { action, data } = request;

  if (action === "model_progress" && data.status === "done") {
    showStickyHeader(data);
  }
});
