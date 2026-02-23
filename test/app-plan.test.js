const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

test("APP_PLAN.md exists and contains the game title", () => {
  assert.equal(fs.existsSync("APP_PLAN.md"), true);
  const plan = fs.readFileSync("APP_PLAN.md", "utf8");
  assert.match(plan, /Missiles over Xerion/i);
});
