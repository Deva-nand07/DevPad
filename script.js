/* ================= CODEMIRROR ================= */

const editor = CodeMirror.fromTextArea(code, {
  mode: "javascript",
  lineNumbers: true,
  theme: "eclipse",
});

/* ================= RESTORE FROM STORAGE ================= */

editor.setValue(localStorage.getItem("code") || "");
notes.value = localStorage.getItem("notes") || "";
output.value = localStorage.getItem("output") || "";

/* ================= SAVE TO STORAGE ================= */

editor.on("change", () => localStorage.setItem("code", editor.getValue()));
notes.oninput = (e) => localStorage.setItem("notes", e.target.value);
output.oninput = (e) => localStorage.setItem("output", e.target.value);

/* ================= THEME ICONS ================= */

const sunIcon = `
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
<circle cx="12" cy="12" r="5"/>
<line x1="12" y1="1" x2="12" y2="3"/>
<line x1="12" y1="21" x2="12" y2="23"/>
<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
<line x1="1" y1="12" x2="3" y2="12"/>
<line x1="21" y1="12" x2="23" y2="12"/>
<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
</svg>
`;

const moonIcon = `
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
</svg>
`;

themeIcon.innerHTML = moonIcon;

/* ================= THEME TOGGLE ================= */

themeBtn.onclick = () => {
  document.body.classList.toggle("dark");

  const isDark = document.body.classList.contains("dark");

  editor.setOption("theme", isDark ? "dracula" : "eclipse");

  themeIcon.innerHTML = isDark ? sunIcon : moonIcon;
  themeBtn.classList.toggle("rotate");
};

/* ================= TIMER ================= */

let sec = 0;
let i = null;

function start() {
  if (!i) {
    i = setInterval(() => {
      sec++;
      timer.innerText =
        `${String(Math.floor(sec / 60)).padStart(2, "0")}:` +
        `${String(sec % 60).padStart(2, "0")}`;
    }, 1000);
  }
}

function stop() {
  clearInterval(i);
  i = null;
}

function reset() {
  stop();
  sec = 0;
  timer.innerText = "00:00";
}

/* ================= EXPORT ================= */

function saveFile() {
  const isDark = document.body.classList.contains("dark");

  let highlightedCode = "";

  CodeMirror.runMode(editor.getValue(), "javascript", (text, style) => {
    highlightedCode += style
      ? `<span class="cm-${style}">${text}</span>`
      : text;
  });

  const themeClass = isDark ? "cm-s-dracula" : "cm-s-eclipse";

  const styles = isDark
    ? `
body{margin:0;font-family:system-ui;background:#0b0b0b;color:#e5e5e5}
.notes{background:#151515;color:#e5e5e5}
.code{background:#1f2937}
.output{background:#000;color:#00ff90}`
    : `
body{margin:0;font-family:system-ui;background:#f3f4f6;color:#111}
.notes{background:white;color:#111}
.code{background:white;color:#111}
.output{background:#000;color:#00ff90}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

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
