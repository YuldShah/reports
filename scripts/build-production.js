const fs = require("fs")
const path = require("path")
const { spawnSync } = require("child_process")

const resolvedCwd = fs.realpathSync.native(process.cwd())

if (resolvedCwd !== process.cwd()) {
  process.chdir(resolvedCwd)
}

const nextBin = path.join(resolvedCwd, "node_modules", "next", "dist", "bin", "next")
const result = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: resolvedCwd,
  env: process.env,
  stdio: "inherit",
})

if (result.error) {
  throw result.error
}

process.exit(result.status ?? 1)