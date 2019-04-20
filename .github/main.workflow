workflow "CI" {
  on = "push"
  resolves = ["Format", "Test"]
}

action "Dependencies" {
  uses = "actions/npm@v2.0.0"
  args = "ci"
}

action "Compile" {
  needs = "Dependencies"
  uses = "actions/npm@v2.0.0"
  args = "run build"
}

action "Format" {
  needs = "Compile"
  uses = "actions/npm@v2.0.0"
  args = "run format"
}

action "Test" {
  needs = "Compile"
  uses = "actions/npm@v2.0.0"
  args = "test"
}