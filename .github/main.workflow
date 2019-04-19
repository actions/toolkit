workflow "CI" {
  on = "push"
  resolves = ["Format", "Lint", "Test"]
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

action "Lint" {
  needs = "Dependencies"
  uses = "actions/npm@v2.0.0"
  args = "run lint"
}

action "Test" {
  needs = "Dependencies"
  uses = "actions/npm@v2.0.0"
  args = "test"
}