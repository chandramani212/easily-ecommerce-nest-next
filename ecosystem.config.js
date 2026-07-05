module.exports = {
  apps: [
    { name: "api",   cwd: "./apps/api",   script: "node", args: "dist/main" },
    { name: "web",   cwd: "./apps/web",   script: "node_modules/next/dist/bin/next",
      args: "start", env: { PORT: 3000 } },
    { name: "admin", cwd: "./apps/admin", script: "node_modules/next/dist/bin/next",
      args: "start", env: { PORT: 3002 } },   // <-- must set 3002; next defaults to 3000
  ],
};
