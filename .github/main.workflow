workflow "CI" {
  on = "push"
  resolves = "Test"
}

action "Dependencies" {
  uses = "actions/npm@v2.0.0"
  args = "ci"
}

action "Test" {
  needs = "Dependencies"
  uses = "actions/npm@v2.0.0"
  args = "test"
}