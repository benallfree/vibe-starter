# Vibe Coding Starter Kit

Welcome to the Vibe Coding Starter Kit! This project provides a robust foundation for AI-driven development using a 100% TypeScript stack to maximize context management and developer experience.

## Getting Started

Begin by asking AI to read this document. If you are using Cursor, it will automatically find the `.cursor` directory with other rules as well.

## What is Vibe Coding?

Vibe Coding is an AI-driven development methodology that focuses on outcomes rather than tactics. It leverages the power of AI to streamline the development process, allowing you to rapidly prototype and build applications by "vibing" with AI tools to generate and refine your code.

## Why 100% TypeScript?

This starter kit is built entirely with TypeScript for several key reasons:

- **Maximum Context Management**: TypeScript's strong typing system provides rich context for AI models, enhancing their understanding of your codebase.
- **Improved Autocomplete and Intellisense**: TypeScript makes it easier for both humans and AI to understand what functions and variables are available.
- **Type Safety**: Catch errors at compile time, reducing runtime issues that are harder to debug.
- **Better Documentation**: Types serve as built-in documentation for your code.
- **Easier Refactoring**: TypeScript provides confidence when making large changes to your codebase.

## The Vibe Coding Process

### Step 1: Vibe a Spec

Don't write your specifications manually. Instead, use AI to help you generate a comprehensive spec in `spec.md`. Describe your vision and let AI refine it into a detailed plan.

### Step 2: Vibe the Game Feature by Feature

With your spec in hand, use AI to help you implement features one by one. Describe the feature you want and collaborate with AI to bring it to life.

### Step 3: Ask AI to Frquently Refactor and Reorganize

After each successful feature, ask AI to refactor. This is important for managing complexity that can clutter the context window and cause the app to collapse under the sheer complexity of possible code interactions and side effects.

### Step 4: Profit

Enjoy the benefits of rapid, AI-assisted development that focuses on outcomes while maintaining high code quality.

## Tech Stack

This starter kit includes a carefully selected set of technologies:

### Core Technologies

- **TypeScript**: For type-safe code with excellent IDE support
- **Vite**: Fast, modern frontend build tool
- **Three.js**: Powerful 3D graphics library for creating immersive experiences
- **Socket.IO**: Real-time, bidirectional communication between clients and server
- **Express**: Robust web server framework for the backend

### Development Tools

- **Bun**: Modern JavaScript runtime and package manager for improved performance
- **Prettier**: Consistent code formatting
- **Concurrently**: Run multiple development processes simultaneously

### Deployment

- **Docker**: Containerization for consistent deployments
- **Fly.io**: Configuration included for easy cloud deployment

## Why This Stack?

- **Performance**: Vite and Bun provide blazing-fast development and build times
- **Real-time Capabilities**: Socket.IO enables real-time features essential for interactive applications
- **Full Stack TypeScript**: Share types between frontend and backend for seamless integration
- **Immersive Experiences**: Three.js allows for creating engaging 3D visualizations when needed
- **Developer Experience**: Comprehensive tooling and type safety enhance productivity

## Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Build for production
bun run build:production

# Start production server
bun start
```

## Deploying to Fly.io

This starter kit comes preconfigured for Fly.io deployment, making it easy to quickly get your application running in the cloud.

### Setup

1. Install the Fly.io CLI:

   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. Authenticate with Fly.io:
   ```bash
   fly auth login
   ```

### Deployment

1. Build your application for production:

   ```bash
   bun run build:production
   ```

2. Deploy to Fly.io:
   ```bash
   fly deploy
   ```

The included `fly.toml` configuration file is pre-configured with:

- Auto-scaling to handle varying traffic loads
- Zero downtime deployments
- Shared CPU (1x) with 256MB memory allocation
- Automatic HTTPS/TLS certificates
- Auto-stop feature to reduce costs when your app isn't being used

### Monitoring and Management

```bash
# View application status
fly status

# View application logs
fly logs

# Scale your application
fly scale count 2  # Scale to 2 instances

# Open your deployed application in a browser
fly open
```

For more details, visit the [Fly.io documentation](https://fly.io/docs/).

## Best Practices

- Keep your code modular and focused on specific features
- Regularly ask AI to help with refactoring
- Maintain comprehensive type definitions
- Use early returns in functions for better readability
- Prefer function factories over classes for more flexible code organization

---

Start vibing your next great project today! 🚀
