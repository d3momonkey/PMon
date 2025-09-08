# Contributing to PMon

We love your input! We want to make contributing to PMon as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Coding Style

* Use meaningful variable names
* Follow existing code structure and patterns
* Add comments for complex logic
* Use ES6+ features where appropriate
* Follow the existing CSS methodology

### JavaScript Style Guide

```javascript
// Good
const getUserData = async () => {
  const response = await fetch('/api/user');
  return response.json();
};

// Bad
function getData() {
  return fetch('/api/user').then(r => r.json());
}
```

### CSS Style Guide

```css
/* Good - Use BEM methodology */
.metric-card {
  padding: var(--spacing-md);
}

.metric-card__header {
  display: flex;
  justify-content: space-between;
}

.metric-card__header--active {
  background: var(--accent-color);
}

/* Bad - Avoid deep nesting */
.metric-card .header .title.active {
  color: red;
}
```

## Bug Reports

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/yourusername/PMon/issues).

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

### Bug Report Template

```markdown
**Description**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
 - OS: [e.g. Windows 10, macOS 11.0, Ubuntu 20.04]
 - PMon Version: [e.g. 1.0.0]
 - Node.js Version: [e.g. 18.15.0]

**Additional context**
Add any other context about the problem here.
```

## Feature Requests

We track feature requests using GitHub issues with the `enhancement` label.

**Great Feature Requests** include:

- Clear description of the feature
- Use cases and motivation
- Mockups or examples if applicable
- Discussion of potential implementation approaches

### Feature Request Template

```markdown
**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

## Development Setup

1. **Fork and clone the repository**
```bash
git clone https://github.com/yourusername/PMon.git
cd PMon
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Run tests**
```bash
npm test
```

5. **Build for production**
```bash
npm run build:all
```

## Project Structure for Contributors

```
PMon/
├── main/                   # Electron main process
├── modules/               # System monitoring modules
├── renderer/              # Frontend application
│   ├── styles/           # CSS files
│   └── scripts/          # JavaScript files
├── assets/               # Static resources
├── tests/                # Test files
└── docs/                 # Additional documentation
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write unit tests for utility functions
- Write integration tests for main features
- Use descriptive test names
- Mock external dependencies
- Test error conditions

Example test:
```javascript
describe('CPU Module', () => {
  it('should return CPU usage as a number between 0 and 100', async () => {
    const cpuStats = await cpuModule.getStats();
    expect(cpuStats.usage).toBeGreaterThanOrEqual(0);
    expect(cpuStats.usage).toBeLessThanOrEqual(100);
  });
});
```

## Documentation

- Update README.md for user-facing changes
- Add inline comments for complex code
- Update API documentation when changing interfaces
- Include examples in documentation

## Commit Messages

Use clear and meaningful commit messages:

```
feat: add GPU temperature monitoring
fix: resolve memory leak in chart updates
docs: update installation instructions
style: fix code formatting in main.js
refactor: extract common chart utilities
test: add tests for network monitoring
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## Community Guidelines

### Our Pledge

We pledge to make participation in our project and our community a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

* Using welcoming and inclusive language
* Being respectful of differing viewpoints and experiences
* Gracefully accepting constructive criticism
* Focusing on what is best for the community
* Showing empathy towards other community members

## Questions?

Feel free to open an issue with the `question` label or start a discussion in the [Discussions](https://github.com/yourusername/PMon/discussions) section.

Thank you for contributing! 🎉
