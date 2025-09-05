# 🛡️ Port Conflict Prevention System

## Overview

This system permanently prevents port conflicts when running multiple web applications on your development machine. It automatically detects occupied ports, finds alternatives, and maintains a registry of all projects and their port allocations.

## ✨ Features

- **Automatic Port Detection**: Finds available ports if defaults are occupied
- **Project Registry**: Tracks which projects use which ports
- **Fallback Ports**: Automatically uses alternative ports when conflicts occur
- **Environment Configuration**: Generates `.env.ports` with allocated ports
- **Process Detection**: Shows which application is using conflicting ports
- **Global Registry**: Maintains a system-wide registry at `~/.port-registry.json`
- **Zero Configuration**: Works out of the box with sensible defaults

## 🚀 Quick Start

### Start with Automatic Port Conflict Resolution

```bash
npm run dev:safe
```

This command will:

1. Check for port conflicts
2. Allocate available ports automatically
3. Start both frontend and backend with the allocated ports
4. Display the URLs where services are running

## 📚 Available Commands

### Main Development Commands

| Command                  | Description                                                |
| ------------------------ | ---------------------------------------------------------- |
| `npm run dev:safe`       | Start all services with automatic port conflict prevention |
| `npm run ports:check`    | Check for port conflicts without starting services         |
| `npm run ports:allocate` | Allocate ports and generate `.env.ports` file              |
| `npm run ports:list`     | List all registered projects and their ports               |
| `npm run ports:clean`    | Clean up inactive projects from registry                   |

### Manual Port Management

```bash
# Check for conflicts before starting
npm run ports:check

# Allocate ports manually
npm run ports:allocate

# View all active projects
npm run ports:list

# Clean up registry
npm run ports:clean
```

## 🔧 Configuration

### Port Configuration File (`port-config.json`)

```json
{
  "projectName": "VQMethod",
  "services": {
    "frontend": {
      "defaultPort": 3000,
      "fallbackPorts": [3001, 3002, 3003, 3004, 3005],
      "description": "Next.js Frontend"
    },
    "backend": {
      "defaultPort": 4000,
      "fallbackPorts": [4001, 4002, 4003, 4004, 4005],
      "description": "NestJS Backend API"
    }
  }
}
```

### Default Port Assignments

| Service               | Default Port | Fallback Range |
| --------------------- | ------------ | -------------- |
| Frontend (Next.js)    | 3000         | 3001-3005      |
| Backend (NestJS)      | 4000         | 4001-4005      |
| Database (PostgreSQL) | 5432         | 5433-5435      |

## 🎯 Use Cases

### Scenario 1: Simple Development

```bash
# Just run this - it handles everything
npm run dev:safe
```

### Scenario 2: Check Before Starting

```bash
# Check for conflicts
npm run ports:check

# If conflicts exist, allocate new ports
npm run ports:allocate

# Start with allocated ports
npm run dev:safe
```

### Scenario 3: Multiple Projects Running

```bash
# See what's running
npm run ports:list

# Output:
# 📊 Active Projects Registry:
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# VQMethod:
#   🟢 frontend   : 3000
#   🟢 backend    : 4000
#
# AnotherProject:
#   🟢 frontend   : 3001
#   🟢 backend    : 4001
```

## 📁 Generated Files

### `.env.ports`

Automatically generated file containing allocated ports:

```env
# Auto-generated port configuration
FRONTEND_PORT=3000
BACKEND_PORT=4000
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### `~/.port-registry.json`

Global registry tracking all projects:

```json
{
  "projects": {
    "VQMethod": {
      "ports": {
        "frontend": 3000,
        "backend": 4000
      },
      "timestamp": "2025-09-02T10:00:00.000Z"
    }
  },
  "ports": {
    "3000": {
      "project": "VQMethod",
      "service": "frontend"
    }
  }
}
```

## 🔍 How It Works

1. **Port Detection**: When you run `npm run dev:safe`, the system checks if default ports are available
2. **Conflict Resolution**: If a port is occupied, it automatically tries fallback ports
3. **Registry Update**: Allocated ports are registered globally to track usage
4. **Environment Setup**: A `.env.ports` file is generated with the allocated ports
5. **Service Start**: Frontend and backend start with the allocated ports
6. **Cleanup**: When services stop, the registry can be cleaned with `npm run ports:clean`

## ⚡ Benefits

1. **No More Port Conflicts**: Never see "EADDRINUSE" errors again
2. **Multiple Projects**: Run multiple projects simultaneously without manual port changes
3. **Automatic Fallback**: Services start even if default ports are occupied
4. **Visibility**: Always know which project is using which port
5. **Zero Configuration**: Works immediately without setup
6. **Clean Shutdown**: Proper cleanup when stopping services

## 🛠️ Troubleshooting

### Port Still Shows as Occupied

```bash
# Clean the registry
npm run ports:clean

# Force allocate new ports
npm run ports:allocate
```

### Manual Port Release

```bash
# Find process using a port
lsof -i :3000

# Kill specific process
kill -9 <PID>
```

### Reset Everything

```bash
# Remove global registry
rm ~/.port-registry.json

# Remove local port config
rm .env.ports

# Reallocate
npm run ports:allocate
```

## 🔄 Integration with CI/CD

The port management system is designed to work in CI/CD environments:

```yaml
# Example GitHub Actions
- name: Allocate ports
  run: npm run ports:allocate

- name: Start services
  run: npm run dev:safe &

- name: Run tests
  run: npm test
```

## 📈 Best Practices

1. **Always use `npm run dev:safe`** for development
2. **Check ports before deployment** with `npm run ports:check`
3. **Clean registry periodically** with `npm run ports:clean`
4. **Document port usage** in your project README
5. **Use consistent port ranges** across teams

## 🎨 Customization

To change default ports for your project:

1. Edit `port-config.json`
2. Update the `defaultPort` and `fallbackPorts` for each service
3. Run `npm run ports:allocate` to apply changes

## 🚦 Status Indicators

When running commands, you'll see these indicators:

- ✅ Default port available and allocated
- ⚠️ Default port occupied, using fallback
- 🟢 Service is running
- ⚫ Service is not running
- 🔍 Checking for conflicts
- 🧹 Cleaning registry
- 📝 Generating configuration

## 💡 Tips

1. **Development**: Always use `npm run dev:safe`
2. **Production**: Use environment variables from `.env.ports`
3. **Docker**: Map container ports based on `.env.ports`
4. **Team Work**: Share `port-config.json` but not `.env.ports`
5. **Debugging**: Use `npm run ports:list` to see all allocations

---

**Never worry about port conflicts again!** 🎉
