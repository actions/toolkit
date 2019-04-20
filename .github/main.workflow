workflow "CI" {
  on = "push"
  resolves = ["Format", "Test"]
}

action "Dependencies" {
  uses = "actions/npm@v2.0.0"
  args = "ci"
}

action "Compile" {
  uses = "actions/npm@v2.0.0"
  run = "run build"
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