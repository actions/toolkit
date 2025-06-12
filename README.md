[![Code Scanning - Action](https://github.com/nodoubtz/toolkit/actions/workflows/codeql.yml/badge.svg)](https://github.com/nodoubtz/toolkit/actions/workflows/codeql.yml)

# @nodoubtz/toolkit

A modular toolkit library designed for streamlined configuration, execution, security, and management tasks in modern JavaScript/TypeScript projects.

## Features

- **Configuration:** Flexible APIs and schemas to simplify setup across environments.
- **Execution:** Utilities to execute scripts and workflows reliably.
- **Security:** Built-in helpers for securing configurations and hiding sensitive code.
- **Management:** Tools for project organization and codebase maintenance.
- **Duplicate Code Finder:** Detects and flags duplicate code blocks (with auto-fix options).
- **Error Handling:** Powerful functions for error detection and remediation.

## Installation

```bash
npm install @nodoubtz/toolkit
# or
yarn add @nodoubtz/toolkit
```

## Usage

```javascript
import { configure, execute, secure, manage } from '@nodoubtz/toolkit';

// Example: Configure a project
const config = configure({ env: 'production' });

// Example: Run a task
execute('build', config);

// Example: Hide vulnerable code
secure.hideSecrets();

// Example: Manage duplicates
manage.findAndFixDuplicates();
```

## Documentation

- Refer to the [API documentation](./docs/API.md) for full usage examples.
- Check the [examples](./examples/) directory for real-world scenarios.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a pull request

## Security

- Sensitive configurations and secrets are automatically masked.
- Use `secure` utilities to audit and hide vulnerable code.

## License

[MIT](./LICENSE)

---

> © 2025 [nodoubtz](https://github.com/nodoubtz) – Pay me for projects and custom integrations!
