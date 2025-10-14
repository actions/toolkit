.PHONY: help install clean build test lint lint-fix format format-check check audit bootstrap repair dev

# Default target
help:
	@echo "Toolkit Makefile - Available targets:"
	@echo ""
	@echo "Installation:"
	@echo "  install         - Install dependencies for all packages"
	@echo "  bootstrap       - Bootstrap all packages with npm install"
	@echo "  repair          - Repair lerna configuration"
	@echo ""
	@echo "Development:"
	@echo "  dev             - Start development mode"
	@echo "  build           - Build all packages"
	@echo "  clean           - Clean node_modules and build artifacts"
	@echo ""
	@echo "Code Quality:"
	@echo "  format          - Format code with prettier"
	@echo "  format-check    - Check code formatting"
	@echo "  lint            - Lint all packages"
	@echo "  lint-fix        - Lint and auto-fix issues"
	@echo "  test            - Run test suite"
	@echo "  check           - Run all checks (format, lint, test, build)"
	@echo ""
	@echo "Security:"
	@echo "  audit           - Run security audit on all packages"
	@echo ""
	@echo "Utilities:"
	@echo "  new-package     - Create a new package (interactive)"

# Installation targets
install:
	npm install

bootstrap:
	npm run bootstrap

repair:
	npm run repair

# Development targets
dev:
	npm run build

build:
	npm run build

clean:
	npm run clean
	rm -rf node_modules/
	find packages/ -type d -name node_modules -exec rm -rf {} +
	find packages/ -type d -name dist -exec rm -rf {} +

# Code quality targets
format:
	npm run format

format-check:
	npm run format-check

lint:
	npm run lint

lint-fix:
	npm run lint-fix

test:
	npm run test

check:
	npm run check-all

# Security targets
audit:
	npm run audit-all

# Utilities
new-package:
	npm run new-package

# Quick dev setup
setup: install bootstrap
	@echo "✅ Setup complete! Run 'make build' to build all packages."

# Full check before commit
pre-commit: format lint test
	@echo "✅ Pre-commit checks passed!"

