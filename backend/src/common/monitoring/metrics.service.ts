import { Injectable } from '@nestjs/common';
import { Counter, Histogram, Gauge, Registry, collectDefaultMetrics } from 'prom-client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;
  
  // HTTP Metrics
  private readonly httpRequestDuration: Histogram<string>;
  private readonly httpRequestTotal: Counter<string>;
  private readonly httpRequestErrors: Counter<string>;
  
  // Business Metrics
  private readonly studiesCreated: Counter<string>;
  private readonly participantsRegistered: Counter<string>;
  private readonly analysisRuns: Counter<string>;
  private readonly aiApiCalls: Counter<string>;
  
  // System Metrics
  private readonly activeUsers: Gauge<string>;
  private readonly activeSessions: Gauge<string>;
  private readonly queueSize: Gauge<string>;
  private readonly cacheHitRatio: Gauge<string>;
  
  // Database Metrics
  private readonly dbQueryDuration: Histogram<string>;
  private readonly dbConnectionPool: Gauge<string>;
  private readonly dbQueryErrors: Counter<string>;
  
  // Performance Metrics
  private readonly responseTime: Histogram<string>;
  private readonly throughput: Counter<string>;
  private readonly errorRate: Gauge<string>;

  constructor(private configService: ConfigService) {
    this.registry = new Registry();
    
    // Collect default Node.js metrics
    collectDefaultMetrics({ 
      register: this.registry,
      prefix: 'vqmethod_',
    });

    // Initialize HTTP metrics
    this.httpRequestDuration = new Histogram({
      name: 'vqmethod_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.httpRequestTotal = new Counter({
      name: 'vqmethod_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    this.httpRequestErrors = new Counter({
      name: 'vqmethod_http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_type'],
      registers: [this.registry],
    });

    // Initialize business metrics
    this.studiesCreated = new Counter({
      name: 'vqmethod_studies_created_total',
      help: 'Total number of studies created',
      labelNames: ['study_type'],
      registers: [this.registry],
    });

    this.participantsRegistered = new Counter({
      name: 'vqmethod_participants_registered_total',
      help: 'Total number of participants registered',
      labelNames: ['study_id'],
      registers: [this.registry],
    });

    this.analysisRuns = new Counter({
      name: 'vqmethod_analysis_runs_total',
      help: 'Total number of analysis runs',
      labelNames: ['analysis_type', 'status'],
      registers: [this.registry],
    });

    this.aiApiCalls = new Counter({
      name: 'vqmethod_ai_api_calls_total',
      help: 'Total number of AI API calls',
      labelNames: ['service', 'model', 'status'],
      registers: [this.registry],
    });

    // Initialize system metrics
    this.activeUsers = new Gauge({
      name: 'vqmethod_active_users',
      help: 'Number of currently active users',
      registers: [this.registry],
    });

    this.activeSessions = new Gauge({
      name: 'vqmethod_active_sessions',
      help: 'Number of currently active sessions',
      registers: [this.registry],
    });

    this.queueSize = new Gauge({
      name: 'vqmethod_queue_size',
      help: 'Current size of processing queues',
      labelNames: ['queue_name'],
      registers: [this.registry],
    });

    this.cacheHitRatio = new Gauge({
      name: 'vqmethod_cache_hit_ratio',
      help: 'Cache hit ratio',
      labelNames: ['cache_type'],
      registers: [this.registry],
    });

    // Initialize database metrics
    this.dbQueryDuration = new Histogram({
      name: 'vqmethod_db_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registry],
    });

    this.dbConnectionPool = new Gauge({
      name: 'vqmethod_db_connection_pool',
      help: 'Database connection pool status',
      labelNames: ['status'],
      registers: [this.registry],
    });

    this.dbQueryErrors = new Counter({
      name: 'vqmethod_db_query_errors_total',
      help: 'Total number of database query errors',
      labelNames: ['operation', 'error_type'],
      registers: [this.registry],
    });

    // Initialize performance metrics
    this.responseTime = new Histogram({
      name: 'vqmethod_response_time_seconds',
      help: 'API response time in seconds',
      labelNames: ['endpoint', 'method'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });

    this.throughput = new Counter({
      name: 'vqmethod_throughput_total',
      help: 'Total throughput of the system',
      labelNames: ['type'],
      registers: [this.registry],
    });

    this.errorRate = new Gauge({
      name: 'vqmethod_error_rate',
      help: 'Current error rate',
      registers: [this.registry],
    });
  }

  // HTTP Metrics Methods
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    const labels = { method, route, status_code: statusCode.toString() };
    this.httpRequestDuration.observe(labels, duration);
    this.httpRequestTotal.inc(labels);
    
    if (statusCode >= 400) {
      this.httpRequestErrors.inc({ 
        method, 
        route, 
        error_type: statusCode >= 500 ? 'server_error' : 'client_error' 
      });
    }
  }

  // Business Metrics Methods
  incrementStudiesCreated(studyType: string = 'standard'): void {
    this.studiesCreated.inc({ study_type: studyType });
  }

  incrementParticipantsRegistered(studyId: string): void {
    this.participantsRegistered.inc({ study_id: studyId });
  }

  recordAnalysisRun(analysisType: string, success: boolean): void {
    this.analysisRuns.inc({ 
      analysis_type: analysisType, 
      status: success ? 'success' : 'failure' 
    });
  }

  recordAIApiCall(service: string, model: string, success: boolean): void {
    this.aiApiCalls.inc({ 
      service, 
      model, 
      status: success ? 'success' : 'failure' 
    });
  }

  // System Metrics Methods
  setActiveUsers(count: number): void {
    this.activeUsers.set(count);
  }

  setActiveSessions(count: number): void {
    this.activeSessions.set(count);
  }

  setQueueSize(queueName: string, size: number): void {
    this.queueSize.set({ queue_name: queueName }, size);
  }

  setCacheHitRatio(cacheType: string, ratio: number): void {
    this.cacheHitRatio.set({ cache_type: cacheType }, ratio);
  }

  // Database Metrics Methods
  recordDbQuery(operation: string, table: string, duration: number, error?: boolean): void {
    this.dbQueryDuration.observe({ operation, table }, duration);
    
    if (error) {
      this.dbQueryErrors.inc({ operation, error_type: 'query_error' });
    }
  }

  setDbConnectionPool(active: number, idle: number, waiting: number): void {
    this.dbConnectionPool.set({ status: 'active' }, active);
    this.dbConnectionPool.set({ status: 'idle' }, idle);
    this.dbConnectionPool.set({ status: 'waiting' }, waiting);
  }

  // Performance Metrics Methods
  recordResponseTime(endpoint: string, method: string, duration: number): void {
    this.responseTime.observe({ endpoint, method }, duration);
  }

  incrementThroughput(type: string = 'request'): void {
    this.throughput.inc({ type });
  }

  updateErrorRate(rate: number): void {
    this.errorRate.set(rate);
  }

  // Get metrics for Prometheus endpoint
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  // Get metrics in JSON format
  async getMetricsJson(): Promise<any> {
    const metrics = await this.registry.getMetricsAsJSON();
    return metrics;
  }

  // Health check metrics
  getHealthMetrics(): any {
    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      activeConnections: this.activeSessions.get(),
      errorRate: this.errorRate.get(),
    };
  }

  // Custom business metrics dashboard
  async getBusinessMetrics(): Promise<any> {
    return {
      studies: {
        total: await this.getCounterValue(this.studiesCreated),
        todayCount: await this.getTodayCount(this.studiesCreated),
      },
      participants: {
        total: await this.getCounterValue(this.participantsRegistered),
        todayCount: await this.getTodayCount(this.participantsRegistered),
      },
      analysis: {
        total: await this.getCounterValue(this.analysisRuns),
        successRate: await this.getSuccessRate(this.analysisRuns),
      },
      ai: {
        totalCalls: await this.getCounterValue(this.aiApiCalls),
        successRate: await this.getSuccessRate(this.aiApiCalls),
      },
      system: {
        activeUsers: this.activeUsers.get(),
        activeSessions: this.activeSessions.get(),
        cacheHitRatio: this.cacheHitRatio.get(),
      },
    };
  }

  // Helper methods
  private async getCounterValue(counter: Counter<string>): Promise<number> {
    // Get the metric value directly from counter
    const metric = await this.registry.getSingleMetric((counter as any).name || '');
    if (metric) {
      const values = await metric.get();
      // Sum all values from the metric
      return values.values.reduce((sum: number, v: any) => sum + (v.value || 0), 0);
    }
    return 0;
  }

  private async getTodayCount(counter: Counter<string>): Promise<number> {
    // Would need to track daily counts separately
    return 0;
  }

  private async getSuccessRate(counter: Counter<string>): Promise<number> {
    // Calculate success rate from counter labels
    return 0;
  }

  // Alert thresholds
  async checkAlertThresholds(): Promise<any[]> {
    const alerts = [];
    
    // Check error rate threshold
    const errorRateValue = (await this.errorRate.get()).values[0]?.value || 0;
    if (errorRateValue > 0.05) { // 5% error rate
      alerts.push({
        level: 'warning',
        metric: 'error_rate',
        value: errorRateValue,
        threshold: 0.05,
        message: 'Error rate exceeds 5%',
      });
    }
    
    // Check response time threshold
    // Would need to calculate p95 from histogram
    
    // Check queue size threshold
    // Would need to check specific queue sizes
    
    return alerts;
  }
}