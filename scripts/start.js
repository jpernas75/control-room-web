const { execSync } = require("child_process");

execSync("npx prisma migrate deploy", { stdio: "inherit" });
execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
execSync(`npx next start --hostname 0.0.0.0 --port ${process.env.PORT || "3000"}`, {
  stdio: "inherit",
});
