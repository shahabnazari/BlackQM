module.exports = {
  apps: [
    {
      name: 'vqmethod-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './frontend',
      env: {
        NODE_ENV: 'development',
        PORT: 3003,
        NEXT_PUBLIC_API_URL: 'http://localhost:3001',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3003,
        NEXT_PUBLIC_API_URL: 'https://api.vqmethod.com',
      },
      // Auto-restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,

      // Memory management
      max_memory_restart: '1G',

      // Logging
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      merge_logs: true,
      time: true,

      // Port management - kill process if port is in use
      kill_timeout: 5000,
      listen_timeout: 10000,

      // Watch for file changes in development
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.next', '.git'],

      // Instance configuration
      instances: 1,
      exec_mode: 'fork',
    },
    {
      name: 'vqmethod-backend',
      script: 'npm',
      args: 'run start:dev',
      cwd: './backend',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        DATABASE_URL:
          process.env.DATABASE_URL || 'postgresql://localhost:5432/vqmethod',
        JWT_SECRET: process.env.JWT_SECRET || 'development-secret-key',
        CORS_ORIGIN: 'http://localhost:3003',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        CORS_ORIGIN: 'https://vqmethod.com',
      },
      // Auto-restart configuration
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,

      // Memory management
      max_memory_restart: '1G',

      // Logging
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      merge_logs: true,
      time: true,

      // Port management
      kill_timeout: 5000,
      listen_timeout: 10000,

      // Watch for file changes in development
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'dist', '.git', 'uploads'],

      // Instance configuration
      instances: 1,
      exec_mode: 'fork',
    },
  ],

  // Deploy configuration (optional)
  deploy: {
    production: {
      user: 'deploy',
      host: 'vqmethod.com',
      ref: 'origin/main',
      repo: 'git@github.com:vqmethod/vqmethod.git',
      path: '/var/www/vqmethod',
      'pre-deploy-local': '',
      'post-deploy':
        'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
    },
  },
};
