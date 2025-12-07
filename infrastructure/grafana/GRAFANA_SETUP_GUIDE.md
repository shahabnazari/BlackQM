# Grafana Dashboards Setup Guide - Netflix-Grade Monitoring

**Date**: December 2, 2025
**Purpose**: Complete guide to set up Grafana dashboards for real-time metrics visualization
**Time to Complete**: 30-60 minutes

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Dashboard Import](#dashboard-import)
5. [Configuration](#configuration)
6. [Troubleshooting](#troubleshooting)
7. [Dashboard Overview](#dashboard-overview)

---

## 🚀 Quick Start

```bash
# 1. Start Grafana + Prometheus
cd infrastructure/grafana
docker-compose up -d

# 2. Access Grafana
open http://localhost:3000
# Default credentials: admin / admin

# 3. Import dashboards (see Dashboard Import section)
```

---

## ✅ Prerequisites

### Required:
- ✅ Docker & Docker Compose installed
- ✅ Backend running on port 3001 (for metrics endpoint)
- ✅ Prometheus metrics endpoint: `http://localhost:3001/api/metrics/prometheus`

### Check Backend Metrics:
```bash
# Verify backend is exposing metrics
curl http://localhost:3001/api/metrics/prometheus | head -20

# Expected output: Prometheus metrics in text format
# TYPE literature_search_duration_seconds histogram
# literature_search_duration_seconds_bucket{source="pubmed",cached="false",le="1"} 45
# ...
```

---

## 📦 Installation

### Option 1: Docker Compose (Recommended)

**File**: `infrastructure/grafana/docker-compose.yml`

```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: vqmethod-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    restart: unless-stopped
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: vqmethod-grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./dashboards:/etc/grafana/provisioning/dashboards
      - ./datasources:/etc/grafana/provisioning/datasources
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_INSTALL_PLUGINS=
    restart: unless-stopped
    networks:
      - monitoring
    depends_on:
      - prometheus

volumes:
  prometheus-data:
  grafana-data:

networks:
  monitoring:
    driver: bridge
```

**Start Services**:
```bash
cd infrastructure/grafana
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f grafana
```

### Option 2: Local Installation

**macOS**:
```bash
# Install Grafana
brew install grafana
brew services start grafana

# Install Prometheus
brew install prometheus
brew services start prometheus
```

**Ubuntu/Debian**:
```bash
# Install Grafana
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install grafana

sudo systemctl start grafana-server
sudo systemctl enable grafana-server

# Install Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.40.0/prometheus-2.40.0.linux-amd64.tar.gz
tar -xvf prometheus-*.tar.gz
cd prometheus-*
./prometheus --config.file=prometheus.yml
```

---

## 📊 Dashboard Import

### Automated Import (Docker Compose)

1. **Place dashboards in provisioning folder**:
```bash
mkdir -p infrastructure/grafana/dashboards/provisioning
cp dashboards/*.json dashboards/provisioning/
```

2. **Create provisioning config**:
```bash
cat > infrastructure/grafana/dashboards/provisioning/dashboards.yml <<EOF
apiVersion: 1

providers:
  - name: 'VQMethod Dashboards'
    orgId: 1
    folder: 'Netflix-Grade Monitoring'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOF
```

3. **Restart Grafana**:
```bash
docker-compose restart grafana
```

### Manual Import

1. **Access Grafana**: http://localhost:3000
2. **Login**: admin / admin (change password when prompted)
3. **Import Dashboard**:
   - Click **+ (Create)** → **Import**
   - Upload JSON file or paste JSON content
   - Select **Prometheus** data source
   - Click **Import**

**Dashboards to Import**:
- ✅ `golden-signals-dashboard.json` - Main monitoring (Latency, Traffic, Errors, Saturation)
- ✅ `business-metrics-dashboard.json` - Business KPIs and usage stats

---

## ⚙️ Configuration

### 1. Prometheus Configuration

**File**: `infrastructure/grafana/prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'vqmethod-backend'
    static_configs:
      - targets: ['host.docker.internal:3001']  # Backend metrics endpoint
    metrics_path: '/api/metrics/prometheus'
    scrape_interval: 15s

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

**For Docker on macOS/Windows**:
- Use `host.docker.internal:3001` to access host machine
- For Linux, use your machine's IP address (e.g., `192.168.1.100:3001`)

**Test Prometheus**:
```bash
# Access Prometheus UI
open http://localhost:9090

# Check targets: Status → Targets
# vqmethod-backend should be "UP"
```

### 2. Grafana Data Source

**File**: `infrastructure/grafana/datasources/prometheus.yml`

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
```

**Manual Configuration**:
1. Go to **Configuration** → **Data Sources**
2. Click **Add data source**
3. Select **Prometheus**
4. Configure:
   - **Name**: Prometheus
   - **URL**: `http://prometheus:9090` (Docker) or `http://localhost:9090` (local)
   - Click **Save & Test**

---

## 🎨 Dashboard Overview

### 1. Golden Signals Dashboard

**UID**: `golden-signals-lit`
**Refresh**: 30 seconds
**Panels**: 8

**What It Shows**:
- 🚀 **Latency Panel**: P50, P95, P99 search duration (SLO: < 2s)
- 📊 **Traffic Panel**: Requests/second overall and by source
- ❌ **Errors Panel**: Error rate gauge (SLO: < 0.1%) + error count by source
- 💾 **Saturation Panel**: Cache hit rate gauge (Target: 90%) + trend over time

**Key Metrics**:
```promql
# P95 Latency
histogram_quantile(0.95, rate(literature_search_duration_seconds_bucket[5m]))

# Error Rate
sum(rate(literature_search_errors_total[5m])) / sum(rate(literature_search_total[5m]))

# Cache Hit Rate
sum(literature_search_total{cached="true"}) / sum(literature_search_total)
```

### 2. Business Metrics Dashboard

**UID**: `business-metrics`
**Refresh**: 1 minute
**Panels**: 7

**What It Shows**:
- 📚 **Total Searches (24h)** - Search volume stat
- 💡 **Theme Extractions (24h)** - Extraction count stat
- 👥 **Active Users** - Current active users stat
- ✅ **Success Rate** - Overall success rate gauge (SLO: 99.9%)
- 📊 **Searches by Source** - Hourly bars chart
- 📊 **Source Distribution** - Donut chart (24h)
- 📈 **Traffic Trends** - Requests/min line chart

---

## 🐛 Troubleshooting

### Issue 1: "Cannot connect to data source"

**Symptoms**: Grafana shows "Cannot connect to Prometheus"

**Solutions**:
```bash
# 1. Check Prometheus is running
curl http://localhost:9090/-/healthy

# 2. Check Prometheus can reach backend
curl http://host.docker.internal:3001/api/metrics/prometheus

# 3. Check Docker network
docker network inspect grafana_monitoring

# 4. For Docker on Linux, use host IP instead of host.docker.internal
# Get your IP:
ifconfig | grep "inet " | grep -v 127.0.0.1
# Update prometheus.yml with your IP
```

### Issue 2: "No data in dashboard"

**Symptoms**: Dashboard loads but shows "No data"

**Solutions**:
```bash
# 1. Verify backend is exposing metrics
curl http://localhost:3001/api/metrics/prometheus | grep literature_search

# 2. Check Prometheus is scraping backend
# Go to http://localhost:9090/targets
# vqmethod-backend should be UP

# 3. Execute test search to generate metrics
curl -X POST http://localhost:3001/api/literature/search \
  -H "Content-Type: application/json" \
  -d '{"query": "machine learning", "sources": ["pubmed"]}'

# 4. Refresh Grafana dashboard after 30 seconds
```

### Issue 3: "Metric not found"

**Symptoms**: Dashboard shows "metric not found" errors

**Possible Causes**:
- Backend metrics not instrumented yet
- Metric name changed
- Prometheus not scraping latest metrics

**Solutions**:
```bash
# 1. Check available metrics in Prometheus
open http://localhost:9090/graph
# Type: literature_search
# See autocomplete suggestions

# 2. Verify metric exists in backend
curl http://localhost:3001/api/metrics/prometheus | grep "literature_search"

# 3. Update dashboard query to match actual metric name
```

### Issue 4: Dashboard shows old data

**Symptoms**: Metrics not updating in real-time

**Solutions**:
```bash
# 1. Check dashboard refresh rate (top-right corner)
# Set to 30s or 1m

# 2. Check Prometheus scrape_interval (should be 15s)
grep scrape_interval infrastructure/grafana/prometheus.yml

# 3. Restart Prometheus
docker-compose restart prometheus
```

---

## 📈 Advanced Configuration

### Custom Alerts

**Create Prometheus Alert Rules**:

**File**: `infrastructure/grafana/alert-rules.yml`

```yaml
groups:
  - name: literature_search_alerts
    interval: 30s
    rules:
      # High Error Rate Alert
      - alert: HighErrorRate
        expr: |
          sum(rate(literature_search_errors_total[5m])) /
          sum(rate(literature_search_total[5m])) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }}, exceeding 1% threshold"

      # High Latency Alert
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95,
            rate(literature_search_duration_seconds_bucket[5m])
          ) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High P95 latency detected"
          description: "P95 latency is {{ $value }}s, exceeding 2s SLO"

      # Low Cache Hit Rate Alert
      - alert: LowCacheHitRate
        expr: |
          sum(literature_search_total{cached="true"}) /
          sum(literature_search_total) < 0.8
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Low cache hit rate"
          description: "Cache hit rate is {{ $value | humanizePercentage }}, below 80% threshold"
```

**Update `prometheus.yml`**:
```yaml
rule_files:
  - 'alert-rules.yml'

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

### Grafana Alerts

1. **Open Dashboard** → **Edit Panel**
2. Click **Alert** tab
3. **Create Alert Rule**:
   - **Name**: High P95 Latency
   - **Evaluate every**: 1m
   - **For**: 5m
   - **Conditions**:
     ```
     WHEN avg() OF query(A, 5m, now) IS ABOVE 2
     ```
4. **Notifications**:
   - Add **Contact Point** (Slack, email, PagerDuty)
   - Configure notification message

---

## 🎯 Dashboard Best Practices

### 1. **Time Range Selection**
- **Golden Signals**: Last 6 hours (real-time monitoring)
- **Business Metrics**: Last 24 hours (trend analysis)
- **Custom**: Use time picker (top-right) for specific ranges

### 2. **Refresh Intervals**
- **Real-time monitoring**: 30s - 1m
- **Historical analysis**: 5m - 10m
- **Cost optimization**: Longer intervals reduce Prometheus load

### 3. **Panel Organization**
- **Top Row**: Critical metrics (SLO gauges)
- **Middle Rows**: Detailed charts (trends, breakdowns)
- **Bottom Row**: Supporting metrics (distributions, comparisons)

### 4. **Color Coding**
- **Green**: Healthy, meeting SLO
- **Yellow**: Warning, approaching threshold
- **Red**: Critical, breaching SLO

---

## 📚 Additional Resources

### Prometheus Query Examples

```promql
# Search rate by source (last 5min)
rate(literature_search_total{source="pubmed"}[5m])

# Average search duration (last 5min)
rate(literature_search_duration_seconds_sum[5m]) /
rate(literature_search_duration_seconds_count[5m])

# Cache hit rate percentage
sum(literature_search_total{cached="true"}) /
sum(literature_search_total) * 100

# Top 5 slowest sources
topk(5,
  histogram_quantile(0.95,
    rate(literature_search_duration_seconds_bucket[5m])
  )
)
```

### Grafana Documentation
- [Prometheus Data Source](https://grafana.com/docs/grafana/latest/datasources/prometheus/)
- [Dashboard Best Practices](https://grafana.com/docs/grafana/latest/best-practices/best-practices-for-creating-dashboards/)
- [Alerting](https://grafana.com/docs/grafana/latest/alerting/)

### Prometheus Documentation
- [Querying Basics](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Recording Rules](https://prometheus.io/docs/prometheus/latest/configuration/recording_rules/)
- [Alerting Rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)

---

## 🏁 Verification Checklist

After setup, verify everything works:

- [ ] Prometheus UI accessible at http://localhost:9090
- [ ] Grafana UI accessible at http://localhost:3000
- [ ] Prometheus Target "vqmethod-backend" is UP
- [ ] Golden Signals Dashboard imported successfully
- [ ] Business Metrics Dashboard imported successfully
- [ ] Dashboards showing live data (perform a search to generate metrics)
- [ ] Panel refresh working (30s/1m intervals)
- [ ] No "metric not found" errors
- [ ] All gauges showing current values
- [ ] Time-series charts showing trends

---

## 🎉 Success!

You now have Netflix-grade monitoring with real-time Grafana dashboards!

**Next Steps**:
1. Customize dashboards for your specific needs
2. Set up alerts for critical metrics
3. Create team-specific dashboards
4. Integrate with PagerDuty/Slack for notifications

**Questions?** Check the [Troubleshooting](#troubleshooting) section or consult the documentation links above.
