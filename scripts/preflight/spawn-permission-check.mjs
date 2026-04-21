import { spawnSync } from "node:child_process";
import process from "node:process";

const probes = [
  {
    name: "spawn:node-self",
    command: process.execPath,
    args: ["-e", "process.exit(0)"]
  },
  {
    name: "spawn:cmd",
    command: process.env.ComSpec || "cmd.exe",
    args: ["/c", "exit", "0"]
  },
  {
    name: "spawn:powershell",
    command: "powershell.exe",
    args: ["-NoProfile", "-Command", "exit 0"]
  }
];

function runProbe(probe) {
  const result = spawnSync(probe.command, probe.args, {
    stdio: "pipe",
    encoding: "utf8",
    windowsHide: true,
    timeout: 10_000
  });

  return {
    name: probe.name,
    command: probe.command,
    args: probe.args,
    status: result.status,
    signal: result.signal,
    error: result.error
      ? {
          code: result.error.code,
          syscall: result.error.syscall,
          path: result.error.path
        }
      : null,
    stderr: (result.stderr || "").trim().slice(0, 200)
  };
}

function printProbeOutcome(outcome) {
  const prefix = outcome.error ? "FAILED" : "OK";
  const detail = outcome.error
    ? `${outcome.error.code ?? "UNKNOWN"} (${outcome.error.syscall ?? "no-syscall"})`
    : `exit=${outcome.status ?? "null"}`;
  console.log(`[preflight:spawn] ${prefix} ${outcome.name} -> ${detail}`);
}

function hasEperm(outcomes) {
  return outcomes.some((item) => item.error?.code === "EPERM");
}

function main() {
  console.log(`[preflight:spawn] node=${process.version}`);
  console.log(`[preflight:spawn] execPath=${process.execPath}`);
  console.log(`[preflight:spawn] cwd=${process.cwd()}`);
  console.log("[preflight:spawn] checking child_process.spawn capability...");
  const outcomes = probes.map(runProbe);
  outcomes.forEach(printProbeOutcome);

  if (hasEperm(outcomes)) {
    console.error(
      "[preflight:spawn] EPERM detected while creating child processes.\n" +
        "This is an environment/runtime issue (permissions/policy/EDR/sandbox), not a CaseMatter feature logic bug.\n" +
        "Since EPERM occurs on node-self/cmd/powershell probes, Next/Prisma/esbuild failures are downstream symptoms.\n" +
        "Skip long-running `npm run dev` / `npm run build` until this is resolved."
    );
    console.error("[preflight:spawn] RESULT=EPERM_BLOCKED");
    process.exitCode = 2;
    return;
  }

  const failed = outcomes.filter((item) => item.error);
  if (failed.length > 0) {
    console.error("[preflight:spawn] child-process checks failed.");
    console.error("[preflight:spawn] RESULT=FAILED");
    process.exitCode = 1;
    return;
  }

  console.log("[preflight:spawn] child-process checks passed.");
  console.log("[preflight:spawn] RESULT=PASS");
}

main();
