// CodeMirror
const editor = CodeMirror.fromTextArea(code, {
  mode: "javascript",
  lineNumbers: true,
  theme: "eclipse",
});


// Restore
editor.setValue(localStorage.getItem("code") || "");
notes.value = localStorage.getItem("notes") || "";

// Save
editor.on("change", () => localStorage.setItem("code", editor.getValue()));
notes.oninput = (e) => localStorage.setItem("notes", e.target.value);

// Theme
themeBtn.onclick = () => {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");

  editor.setOption("theme", isDark ? "dracula" : "eclipse");
  themeBtn.innerText = isDark ? "☀️" : "🌙";
};


// Timer
let sec = 0,
  i = null;
function start() {
  if (!i)
    i = setInterval(() => {
      sec++;
      timer.innerText = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
    }, 1000);
}
function stop() {
  clearInterval(i);
  i = null;
}

// save button
function saveFile() {
  const isDark = document.body.classList.contains("dark");

  // Highlight code
  let highlightedCode = "";
  CodeMirror.runMode(editor.getValue(), "javascript", (text, style) => {
    if (style) {
      highlightedCode += `<span class="cm-${style}">${text}</span>`;
    } else {
      highlightedCode += text;
    }
  });

  // Theme class
  const themeClass = isDark ? "cm-s-dracula" : "cm-s-eclipse";

  // App colors
  const styles = isDark
    ? `
body{margin:0;font-family:system-ui;background:#0b0b0b;color:#e5e5e5}
.notes{background:#151515;color:#e5e5e5}
.code{background:#1f2937}
.output{background:#000;color:#00ff90}
`
    : ` 
body{margin:0;font-family:system-ui;background:#f3f4f6;color:#111}
.notes{background:white;color:#111}
.code{background:white;color:#111}
.output{background:#000;color:#00ff90}
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>DevPad Export</title>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/theme/dracula.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/theme/eclipse.min.css">

<style>
.wrap{display:flex;height:100vh}
.notes{width:40%;border-right:2px solid #333;padding:10px;overflow:auto}
.right{flex:1;display:flex;flex-direction:column}
.code{flex:1;border-bottom:2px solid #333;padding:10px;overflow:auto;font-family:monospace}
.output{height:150px;padding:10px;overflow:auto}
h3{margin:0 0 5px}
pre{white-space:pre-wrap}
${styles}
</style>
</head>

<body>
<div class="wrap">

<div class="notes">
<h3>Notes</h3>
<pre>${notes.value}</pre>
</div>

<div class="right">

<div class="code ${themeClass}">
<h3>Code</h3>
<pre>${highlightedCode}</pre>
</div>

<div class="output">
<h3>Output</h3>
<pre>${output.value}</pre>
</div>

</div>
</div>
</body>
</html>
`;

  const blob = new Blob([html], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = (filename.value || "devpad") + ".html";
  a.click();
}

function reset() {
  stop();
  sec = 0;
  timer.innerText = "00:00";
}
output.value = localStorage.getItem("output") || "";
output.oninput = (e) => localStorage.setItem("output", e.target.value);
