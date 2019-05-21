workflow "CI" {
  on = "push"
  resolves = ["Format", "Lint", "Test"]
}

action "Dependencies" {
  uses = "actions/npm@v2.0.0"
  args = "ci"
}

action "Bootstrap" {
  needs = "Dependencies"
  uses = "actions/npm@v2.0.0"
  args = "run bootstrap"
}

action "Compile" {
  needs = "Bootstrap"
  uses = "actions/npm@v2.0.0"
  args = "run build"
}

action "Format" {
  needs = "Dependencies"
  uses = "actions/npm@v2.0.0"
  args = "run format-check"
}

action "Lint" {
  needs = "Dependencies"
  uses = "actions/npm@v2.0.0"
  args = "run lint"
}

action "Test" {
  needs = "Compile"
  uses = "actions/npm@v2.0.0"
  args = "test"
}