workflow "CI" {
  on = "push"
  resolves = ["Format", "Test"]
}

action "Dependencies" {
  uses = "actions/npm@v2.0.0"
  args = "ci"
}

action "Format" {
  needs = "Dependencies"
  uses = "actions/npm@v2.0.0"
  args = "run format"
}

action "Test" {
  needs = "Dependencies"
  uses = "actions/npm@v2.0.0"
  args = "test"
}