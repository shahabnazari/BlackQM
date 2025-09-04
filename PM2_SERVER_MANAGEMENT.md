# VQMethod PM2 Server Management

## 🚀 Quick Start

### Start Both Servers
```bash
npm start
# or
./start.sh
```

### Stop All Servers
```bash
npm stop
# or
./stop.sh
```

### Restart Servers
```bash
npm restart
# or
./restart.sh
```

## 📊 Server Status & Monitoring

### Check Server Status
```bash
npm run pm2:status
# or
pm2 status
```

### View Server Logs
```bash
npm run pm2:logs
# or
pm2 logs
```

### Live Monitoring Dashboard
```bash
npm run pm2:monit
# or
pm2 monit
```

## 🔧 PM2 Configuration

The servers are configured in `ecosystem.config.js` with the following features:

### Auto-Restart
- **Automatic restart** on crash or failure
- **Max restarts**: 10 attempts before giving up
- **Min uptime**: 10 seconds required for a successful start
- **Restart delay**: 4 seconds between restart attempts

### Memory Management
- **Max memory**: 1GB per process
- **Auto-restart** on memory limit exceeded

### Logging
- All logs are stored in the `logs/` directory
- Separate logs for frontend and backend
- Error logs: `logs/frontend-error.log` and `logs/backend-error.log`
- Output logs: `logs/frontend-out.log` and `logs/backend-out.log`

## 🛠️ Advanced PM2 Commands

### Restart Specific Service
```bash
pm2 restart vqmethod-frontend
pm2 restart vqmethod-backend
```

### Stop Specific Service
```bash
pm2 stop vqmethod-frontend
pm2 stop vqmethod-backend
```

### View Specific Service Logs
```bash
pm2 logs vqmethod-frontend
pm2 logs vqmethod-backend
```

### Clear Logs
```bash
pm2 flush
```

### Save Current Process List
```bash
pm2 save
```

### Resurrect Saved Processes
```bash
pm2 resurrect
```

## 🔄 Auto-Start on System Boot

To make PM2 start automatically when your system boots:

```bash
# Generate startup script
pm2 startup

# Follow the instructions provided, then save the process list
pm2 save
```

## 📝 Troubleshooting

### Servers Not Starting?
1. Check if ports are already in use:
   ```bash
   lsof -i :3000
   lsof -i :3001
   ```

2. Kill processes manually if needed:
   ```bash
   lsof -ti:3000 | xargs kill -9
   lsof -ti:3001 | xargs kill -9
   ```

3. Clear PM2 and restart:
   ```bash
   pm2 delete all
   npm start
   ```

### View Error Logs
```bash
# View last 50 lines of error logs
pm2 logs --err --lines 50
```

### Reset Everything
```bash
# Stop all processes
pm2 delete all

# Clear all logs
pm2 flush

# Clear PM2 dump file
rm ~/.pm2/dump.pm2

# Start fresh
npm start
```

## 🌐 Access Points

Once servers are running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **API Documentation**: http://localhost:3001/api/docs
- **Prisma Studio**: Run `npx prisma studio` in backend directory

## 💡 Why PM2?

PM2 provides:
- **Process management**: Keeps servers running permanently
- **Auto-restart**: Automatically restarts crashed processes
- **Load balancing**: Can scale to multiple instances
- **Monitoring**: Built-in monitoring and logging
- **Zero-downtime reload**: Update code without stopping service
- **Production ready**: Battle-tested in production environments

## 🔐 Security Notes

- PM2 runs processes with your user permissions
- Logs may contain sensitive information - protect the `logs/` directory
- Consider using PM2 Plus for production monitoring
- Set up proper firewall rules for production deployment

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [PM2 Quick Start](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [PM2 Process Management](https://pm2.keymetrics.io/docs/usage/process-management/)