import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import puppeteer from 'puppeteer';

describe('Smoke Tests - Essential Visualizations', () => {
  let app: INestApplication;
  let authToken: string;
  let browser: puppeteer.Browser;
  let page: puppeteer.Page;

  const VISUALIZATION_TIMEOUT = 10000; // 10 seconds for chart rendering
  const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: JwtService,
          useValue: new JwtService({
            secret: 'test-secret-key',
            signOptions: { expiresIn: '1h' },
          }),
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = jwtService.sign({ sub: 'viz-test-user', role: 'researcher' });

    // Launch headless browser for visual testing
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    await app.close();
  });

  describe('Chart Rendering API Tests', () => {
    it('should generate correlation heatmap successfully', async () => {
      console.log('\n📊 Testing Correlation Heatmap Generation\n');

      const correlationMatrix = generateCorrelationMatrix(20);

      const response = await request(app.getHttpServer())
        .post('/api/visualizations/correlation-heatmap')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: correlationMatrix,
          options: {
            colorScheme: 'diverging',
            showValues: true,
            interactive: true,
          },
        })
        .expect(200);

      expect(response.body.chartData).toBeDefined();
      expect(response.body.chartConfig).toBeDefined();
      expect(response.body.chartConfig.type).toBe('heatmap');
      expect(response.body.dimensions).toEqual({ width: 800, height: 600 });

      // Validate color scale
      expect(response.body.chartConfig.colorScale).toBeDefined();
      expect(response.body.chartConfig.colorScale.domain).toEqual([-1, 0, 1]);

      console.log('✅ Correlation heatmap generated successfully');
    });

    it('should generate factor loading chart successfully', async () => {
      console.log('\n📊 Testing Factor Loading Chart\n');

      const loadingData = generateLoadingData(30, 3);

      const response = await request(app.getHttpServer())
        .post('/api/visualizations/factor-loadings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          loadings: loadingData,
          factorLabels: ['Factor 1', 'Factor 2', 'Factor 3'],
          statementLabels: Array.from({ length: 30 }, (_, i) => `S${i + 1}`),
          options: {
            highlightThreshold: 0.4,
            sortByLoading: true,
          },
        })
        .expect(200);

      expect(response.body.chartData).toBeDefined();
      expect(response.body.chartType).toBe('grouped-bar');
      expect(response.body.axes).toBeDefined();
      expect(response.body.axes.x.label).toBe('Statements');
      expect(response.body.axes.y.label).toBe('Factor Loadings');

      console.log('✅ Factor loading chart generated successfully');
    });

    it('should generate scree plot successfully', async () => {
      console.log('\n📊 Testing Scree Plot\n');

      const eigenvalues = [4.5, 3.2, 2.1, 1.5, 1.2, 0.9, 0.7, 0.5, 0.4, 0.3];

      const response = await request(app.getHttpServer())
        .post('/api/visualizations/scree-plot')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          eigenvalues,
          options: {
            showKaiserCriterion: true,
            showParallelAnalysis: true,
            highlightElbow: true,
          },
        })
        .expect(200);

      expect(response.body.chartData).toBeDefined();
      expect(response.body.chartType).toBe('line-scatter');
      expect(response.body.annotations).toBeDefined();
      expect(response.body.annotations).toContainEqual(
        expect.objectContaining({ type: 'kaiser-line' }),
      );

      console.log('✅ Scree plot generated successfully');
    });

    it('should generate Q-sort distribution chart successfully', async () => {
      console.log('\n📊 Testing Q-Sort Distribution\n');

      const distribution = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
      const frequency = [2, 3, 4, 5, 6, 5, 4, 3, 2];

      const response = await request(app.getHttpServer())
        .post('/api/visualizations/q-sort-distribution')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          distribution,
          frequency,
          actualSorts: generateQSortData(20, distribution),
          options: {
            showForcedDistribution: true,
            showActualDistribution: true,
            compareMode: true,
          },
        })
        .expect(200);

      expect(response.body.chartData).toBeDefined();
      expect(response.body.chartType).toBe('histogram');
      expect(response.body.series).toHaveLength(2); // Forced and actual

      console.log('✅ Q-sort distribution chart generated successfully');
    });

    it('should generate factor array visualization successfully', async () => {
      console.log('\n📊 Testing Factor Array Visualization\n');

      const factorArrays = generateFactorArrays(3, 36);

      const response = await request(app.getHttpServer())
        .post('/api/visualizations/factor-arrays')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          factorArrays,
          statementTexts: Array.from(
            { length: 36 },
            (_, i) => `Statement ${i + 1}`,
          ),
          options: {
            layout: 'grid',
            colorByValue: true,
            interactive: true,
          },
        })
        .expect(200);

      expect(response.body.chartData).toBeDefined();
      expect(response.body.chartType).toBe('factor-grid');
      expect(response.body.interactiveFeatures).toContain('hover');
      expect(response.body.interactiveFeatures).toContain('click');

      console.log('✅ Factor array visualization generated successfully');
    });

    it('should generate distinguishing statements chart successfully', async () => {
      console.log('\n📊 Testing Distinguishing Statements Chart\n');

      const distinguishingData = generateDistinguishingStatements();

      const response = await request(app.getHttpServer())
        .post('/api/visualizations/distinguishing-statements')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          statements: distinguishingData,
          options: {
            sortBySignificance: true,
            showPValues: true,
            highlightConsensus: true,
          },
        })
        .expect(200);

      expect(response.body.chartData).toBeDefined();
      expect(response.body.chartType).toBe('diverging-bar');
      expect(response.body.legend).toBeDefined();
      expect(response.body.legend.items).toContainEqual(
        expect.objectContaining({ label: 'Distinguishing' }),
      );

      console.log('✅ Distinguishing statements chart generated successfully');
    });
  });

  describe('Interactive 3D Visualizations', () => {
    it('should generate 3D factor rotation visualization', async () => {
      console.log('\n🎮 Testing 3D Factor Rotation\n');

      const factorLoadings = generate3DFactorData(50, 3);

      const response = await request(app.getHttpServer())
        .post('/api/visualizations/3d-rotation')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          loadings: factorLoadings,
          options: {
            enableRotation: true,
            showAxes: true,
            particleSize: 5,
            colorByLoading: true,
          },
        })
        .expect(200);

      expect(response.body.sceneConfig).toBeDefined();
      expect(response.body.sceneConfig.camera).toBeDefined();
      expect(response.body.sceneConfig.controls).toBeDefined();
      expect(response.body.sceneConfig.controls.enableRotate).toBe(true);
      expect(response.body.renderEngine).toBe('webgl');

      console.log('✅ 3D factor rotation visualization configured');
    });

    it('should handle real-time rotation updates', async () => {
      console.log('\n🎮 Testing Real-time Rotation Updates\n');

      const initialMatrix = generateLoadingMatrix(20, 2);

      // Initial render
      const initResponse = await request(app.getHttpServer())
        .post('/api/visualizations/rotation/init')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          matrix: initialMatrix,
        })
        .expect(200);

      const sessionId = initResponse.body.sessionId;
      expect(sessionId).toBeDefined();

      // Rotation update
      const rotateResponse = await request(app.getHttpServer())
        .post('/api/visualizations/rotation/update')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sessionId,
          angle: 45,
          axis: 'z',
        })
        .expect(200);

      expect(rotateResponse.body.updatedMatrix).toBeDefined();
      expect(rotateResponse.body.frameTime).toBeLessThan(16); // 60fps target

      console.log(
        `✅ Real-time rotation: ${rotateResponse.body.frameTime.toFixed(2)}ms frame time`,
      );
    });
  });

  describe('Export and Static Rendering', () => {
    it('should export chart as PNG image', async () => {
      console.log('\n🖼️ Testing PNG Export\n');

      const chartData = {
        type: 'scree-plot',
        data: [4.5, 3.2, 2.1, 1.5, 1.2, 0.9],
      };

      const response = await request(app.getHttpServer())
        .post('/api/visualizations/export/png')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chart: chartData,
          width: 1200,
          height: 800,
          dpi: 300,
        })
        .expect(200);

      expect(response.headers['content-type']).toBe('image/png');
      expect(response.body).toBeDefined();

      // Check PNG signature
      const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
      const responseBuffer = Buffer.from(response.body);
      expect(responseBuffer.slice(0, 8).equals(pngSignature)).toBe(true);

      console.log('✅ PNG export successful');
    });

    it('should export chart as SVG vector', async () => {
      console.log('\n🖼️ Testing SVG Export\n');

      const chartData = {
        type: 'factor-loadings',
        data: generateLoadingData(10, 2),
      };

      const response = await request(app.getHttpServer())
        .post('/api/visualizations/export/svg')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          chart: chartData,
          width: 800,
          height: 600,
        })
        .expect(200);

      expect(response.headers['content-type']).toBe('image/svg+xml');
      expect(response.text).toContain('<svg');
      expect(response.text).toContain('</svg>');

      console.log('✅ SVG export successful');
    });

    it('should generate PDF report with multiple charts', async () => {
      console.log('\n📄 Testing PDF Report Generation\n');

      const reportData = {
        title: 'Q-Methodology Analysis Report',
        charts: [
          { type: 'scree-plot', data: [4.5, 3.2, 2.1] },
          { type: 'factor-loadings', data: generateLoadingData(10, 2) },
          { type: 'correlation-heatmap', data: generateCorrelationMatrix(10) },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/visualizations/report/pdf')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reportData)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');

      // Check PDF signature
      const pdfSignature = '%PDF';
      expect(response.text.substring(0, 4)).toBe(pdfSignature);

      console.log('✅ PDF report generation successful');
    });
  });

  describe('Browser-based Visual Validation', () => {
    it('should render correlation heatmap in browser', async () => {
      console.log('\n🌐 Testing Browser Rendering - Heatmap\n');

      // Navigate to visualization page
      await page.goto(`${BASE_URL}/visualizations/heatmap-demo`, {
        waitUntil: 'networkidle2',
      });

      // Wait for chart to render
      await page.waitForSelector('.correlation-heatmap', { timeout: 5000 });

      // Check if canvas or SVG element exists
      const chartElement = await page.$(
        '.correlation-heatmap svg, .correlation-heatmap canvas',
      );
      expect(chartElement).not.toBeNull();

      // Check for color legend
      const legend = await page.$('.heatmap-legend');
      expect(legend).not.toBeNull();

      // Take screenshot for visual regression
      await page.screenshot({
        path: 'test-artifacts/heatmap-smoke.png',
        fullPage: true,
      });

      console.log('✅ Heatmap renders correctly in browser');
    });

    it('should render interactive 3D rotation in browser', async () => {
      console.log('\n🌐 Testing Browser Rendering - 3D Rotation\n');

      await page.goto(`${BASE_URL}/visualizations/3d-rotation-demo`, {
        waitUntil: 'networkidle2',
      });

      // Wait for WebGL canvas
      await page.waitForSelector('canvas.webgl-canvas', { timeout: 5000 });

      // Check if WebGL is initialized
      const webglSupported = await page.evaluate(() => {
        const canvas = document.querySelector(
          'canvas.webgl-canvas',
        ) as HTMLCanvasElement;
        const gl =
          canvas?.getContext('webgl') ||
          canvas?.getContext('experimental-webgl');
        return !!gl;
      });

      expect(webglSupported).toBe(true);

      // Simulate rotation interaction
      const canvas = await page.$('canvas.webgl-canvas');
      if (canvas) {
        const box = await canvas.boundingBox();
        if (box) {
          // Simulate drag to rotate
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(
            box.x + box.width / 2 + 100,
            box.y + box.height / 2,
          );
          await page.mouse.up();
        }
      }

      // Take screenshot after interaction
      await page.screenshot({
        path: 'test-artifacts/3d-rotation-smoke.png',
      });

      console.log('✅ 3D rotation renders and responds to interaction');
    });

    it('should display responsive charts on different screen sizes', async () => {
      console.log('\n📱 Testing Responsive Chart Rendering\n');

      const viewports = [
        { name: 'Desktop', width: 1920, height: 1080 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Mobile', width: 375, height: 667 },
      ];

      for (const viewport of viewports) {
        await page.setViewport({
          width: viewport.width,
          height: viewport.height,
        });
        await page.goto(`${BASE_URL}/visualizations/responsive-demo`, {
          waitUntil: 'networkidle2',
        });

        const chartContainer = await page.$('.chart-container');
        const dimensions = await chartContainer?.boundingBox();

        expect(dimensions).not.toBeNull();
        if (dimensions) {
          expect(dimensions.width).toBeLessThanOrEqual(viewport.width);
          console.log(
            `   ${viewport.name}: Chart width ${dimensions.width}px fits in ${viewport.width}px viewport`,
          );
        }
      }

      console.log('✅ Charts are responsive across all screen sizes');
    });
  });

  describe('Performance and Accessibility', () => {
    it('should render charts within performance budget', async () => {
      console.log('\n⚡ Testing Chart Rendering Performance\n');

      const startTime = Date.now();

      const response = await request(app.getHttpServer())
        .post('/api/visualizations/performance-test')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          charts: [
            { type: 'heatmap', size: 'large' },
            { type: 'scree-plot', size: 'medium' },
            { type: 'factor-loadings', size: 'large' },
          ],
        })
        .expect(200);

      const renderTime = Date.now() - startTime;

      expect(renderTime).toBeLessThan(3000); // All charts within 3 seconds
      expect(response.body.metrics).toBeDefined();

      response.body.metrics.forEach((metric: any) => {
        expect(metric.renderTime).toBeLessThan(1000); // Each chart under 1 second
        console.log(`   ${metric.chart}: ${metric.renderTime}ms`);
      });

      console.log(`✅ All charts rendered in ${renderTime}ms total`);
    });

    it('should provide accessible chart descriptions', async () => {
      console.log('\n♿ Testing Chart Accessibility\n');

      await page.goto(`${BASE_URL}/visualizations/accessibility-demo`, {
        waitUntil: 'networkidle2',
      });

      // Check for ARIA labels
      const ariaLabels = await page.$$eval(
        '[aria-label]',
        (elements: Element[]) =>
          elements.map((el: Element) => el.getAttribute('aria-label')),
      );

      expect(ariaLabels.length).toBeGreaterThan(0);

      // Check for alternative text descriptions
      const altTexts = await page.$$eval(
        '.chart-alt-text',
        (elements: Element[]) => elements.map((el: Element) => el.textContent),
      );

      expect(altTexts.length).toBeGreaterThan(0);

      // Check for keyboard navigation
      const focusableElements = await page.$$eval(
        '.chart-container [tabindex]',
        (elements: Element[]) => elements.length,
      );

      expect(focusableElements).toBeGreaterThan(0);

      console.log('✅ Charts include accessibility features');
      console.log(`   ARIA labels: ${ariaLabels.length}`);
      console.log(`   Alt text descriptions: ${altTexts.length}`);
      console.log(`   Keyboard navigable elements: ${focusableElements}`);
    });
  });

  // Helper functions
  function generateCorrelationMatrix(size: number): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < size; i++) {
      matrix[i] = [];
      for (let j = 0; j < size; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else if (j < i) {
          matrix[i][j] = matrix[j][i];
        } else {
          matrix[i][j] = Math.random() * 0.8 - 0.4;
        }
      }
    }
    return matrix;
  }

  function generateLoadingData(items: number, factors: number): number[][] {
    return Array.from({ length: items }, () =>
      Array.from({ length: factors }, () => Math.random() * 0.8 - 0.4),
    );
  }

  function generateLoadingMatrix(rows: number, cols: number): number[][] {
    return generateLoadingData(rows, cols);
  }

  function generateQSortData(
    participants: number,
    distribution: number[],
  ): any[] {
    return Array.from({ length: participants }, () => ({
      values: distribution.map((d) => d + Math.random() * 0.5 - 0.25),
    }));
  }

  function generateFactorArrays(
    factors: number,
    statements: number,
  ): number[][] {
    return Array.from({ length: factors }, () =>
      Array.from(
        { length: statements },
        () => Math.floor(Math.random() * 9) - 4,
      ),
    );
  }

  function generateDistinguishingStatements(): any[] {
    return Array.from({ length: 10 }, (_, i) => ({
      statementId: i + 1,
      text: `Statement ${i + 1}`,
      factorScores: [
        Math.random() * 4 - 2,
        Math.random() * 4 - 2,
        Math.random() * 4 - 2,
      ],
      pValue: Math.random() * 0.1,
      isDistinguishing: Math.random() > 0.5,
    }));
  }

  function generate3DFactorData(
    points: number,
    dimensions: number,
  ): number[][] {
    return Array.from({ length: points }, () =>
      Array.from({ length: dimensions }, () => Math.random() * 2 - 1),
    );
  }
});
