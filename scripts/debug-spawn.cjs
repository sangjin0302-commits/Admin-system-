const cp = require("node:child_process");

function formatArgs(args) {
  try {
    return JSON.stringify(args);
  } catch {
    return "[unserializable]";
  }
}

function patch(name) {
  const original = cp[name];
  if (typeof original !== "function") return;

  cp[name] = function patched(command, args, options) {
    const safeCommand = typeof command === "string" ? command : String(command);
    const safeArgs = Array.isArray(args) ? args : [];
    // eslint-disable-next-line no-console
    console.error(`[debug-spawn] ${name} -> ${safeCommand} ${formatArgs(safeArgs)}`);
    return original.apply(this, [command, args, options]);
  };
}

patch("spawn");
patch("spawnSync");
patch("execFile");
patch("execFileSync");
patch("fork");
