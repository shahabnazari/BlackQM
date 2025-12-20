/**
 * HTML Full-Text Service Tests
 * Phase 10.183: Netflix-Grade Tests for PMC Abstract Extraction
 *
 * Coverage:
 * - extractAbstractFromPmcXml(): PMC XML abstract extraction
 * - cleanAbstractText(): Text normalization
 * - extractAbstract(): Publisher HTML abstract extraction
 * - getPublisherKey(): Publisher detection
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HtmlFullTextService } from '../html-full-text.service';
import { PrismaService } from '../../../../common/prisma.service';

// Mock axios to prevent real HTTP requests
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock JSDOM for document parsing
vi.mock('jsdom', () => ({
  JSDOM: vi.fn().mockImplementation((html: string) => ({
    window: {
      document: {
        querySelector: vi.fn(),
      },
    },
  })),
}));

describe('HtmlFullTextService', () => {
  let service: HtmlFullTextService;
  let mockPrisma: Partial<PrismaService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma = {
      paper: {
        findUnique: vi.fn(),
        update: vi.fn(),
      } as any,
    };
    service = new HtmlFullTextService(mockPrisma as PrismaService);
  });

  // ============================================================================
  // extractAbstractFromPmcXml() Tests - Phase 10.183 Loophole #2 Fix
  // ============================================================================
  describe('extractAbstractFromPmcXml', () => {
    // Access private method for testing
    const callExtractAbstractFromPmcXml = (xmlContent: string) => {
      return (service as any).extractAbstractFromPmcXml(xmlContent);
    };

    describe('Simple Abstract Extraction', () => {
      it('should extract abstract from simple PMC XML structure', () => {
        const xml = `
          <article>
            <front>
              <article-meta>
                <abstract>
                  <p>This is a comprehensive abstract about climate change research that provides significant detail about methodology, findings, and implications for future studies across multiple disciplines.</p>
                </abstract>
              </article-meta>
            </front>
            <body>Article content here...</body>
          </article>
        `;

        const result = callExtractAbstractFromPmcXml(xml);

        expect(result).toBeDefined();
        expect(result).toContain('climate change research');
        expect(result!.length).toBeGreaterThanOrEqual(100);
      });

      it('should extract abstract from abstract-group tag', () => {
        const xml = `
          <article>
            <abstract-group>
              <abstract>
                <p>This is a comprehensive abstract from abstract-group that provides significant detail about methodology, findings, and implications for future studies across multiple disciplines.</p>
              </abstract>
            </abstract-group>
          </article>
        `;

        const result = callExtractAbstractFromPmcXml(xml);

        expect(result).toBeDefined();
        expect(result).toContain('abstract-group');
      });

      it('should return undefined for XML without abstract tag', () => {
        const xml = `
          <article>
            <front>
              <article-meta>
                <title>Test Article</title>
              </article-meta>
            </front>
            <body>Article content without abstract...</body>
          </article>
        `;

        const result = callExtractAbstractFromPmcXml(xml);

        expect(result).toBeUndefined();
      });

      it('should return undefined for abstract shorter than 100 characters', () => {
        const xml = `
          <article>
            <abstract>
              <p>Too short.</p>
            </abstract>
          </article>
        `;

        const result = callExtractAbstractFromPmcXml(xml);

        expect(result).toBeUndefined();
      });
    });

    describe('Structured Abstract Extraction', () => {
      it('should extract structured abstract with BACKGROUND, METHODS, RESULTS, CONCLUSIONS', () => {
        const xml = `
          <article>
            <abstract>
              <sec>
                <title>Background</title>
                <p>Climate change represents a significant global challenge affecting ecosystems worldwide.</p>
              </sec>
              <sec>
                <title>Methods</title>
                <p>We conducted a systematic review of 500 studies published between 2010 and 2024.</p>
              </sec>
              <sec>
                <title>Results</title>
                <p>Our analysis revealed statistically significant correlations between temperature rise and species migration patterns.</p>
              </sec>
              <sec>
                <title>Conclusions</title>
                <p>Immediate policy interventions are necessary to mitigate these effects and protect biodiversity.</p>
              </sec>
            </abstract>
          </article>
        `;

        const result = callExtractAbstractFromPmcXml(xml);

        expect(result).toBeDefined();
        expect(result).toContain('BACKGROUND:');
        expect(result).toContain('METHODS:');
        expect(result).toContain('RESULTS:');
        expect(result).toContain('CONCLUSIONS:');
        expect(result).toContain('Climate change');
        expect(result).toContain('systematic review');
        expect(result).toContain('species migration');
        expect(result).toContain('policy interventions');
      });

      it('should handle structured abstract with 2 sections', () => {
        const xml = `
          <article>
            <abstract>
              <sec>
                <title>Objective</title>
                <p>To investigate the effectiveness of mindfulness-based interventions for anxiety disorders in clinical populations.</p>
              </sec>
              <sec>
                <title>Findings</title>
                <p>Mindfulness interventions showed significant reductions in anxiety symptoms compared to control groups across multiple studies.</p>
              </sec>
            </abstract>
          </article>
        `;

        const result = callExtractAbstractFromPmcXml(xml);

        expect(result).toBeDefined();
        expect(result).toContain('OBJECTIVE:');
        expect(result).toContain('FINDINGS:');
      });

      it('should fall back to paragraph extraction if structured sections are empty', () => {
        const xml = `
          <article>
            <abstract>
              <p>This is a non-structured abstract that provides comprehensive detail about the research methodology, findings, and implications for future studies in the field of machine learning and artificial intelligence.</p>
            </abstract>
          </article>
        `;

        const result = callExtractAbstractFromPmcXml(xml);

        expect(result).toBeDefined();
        expect(result).toContain('machine learning');
        expect(result).not.toContain('BACKGROUND:');
      });
    });

    describe('XML Entity Decoding', () => {
      it('should decode HTML entities in abstract', () => {
        const xml = `
          <article>
            <abstract>
              <p>This research examines the relationship between temperature (&gt;30°C) &amp; humidity levels, finding that conditions with &lt;50% humidity showed significant effects on plant growth across multiple agricultural regions.</p>
            </abstract>
          </article>
        `;

        const result = callExtractAbstractFromPmcXml(xml);

        expect(result).toBeDefined();
        expect(result).toContain('>30°C');
        expect(result).toContain('&');
        expect(result).toContain('<50%');
        expect(result).not.toContain('&gt;');
        expect(result).not.toContain('&amp;');
        expect(result).not.toContain('&lt;');
      });

      it('should decode quote entities', () => {
        const xml = `
          <article>
            <abstract>
              <p>The study found that &quot;positive outcomes&quot; were observed in 85% of participants, with researchers noting that &apos;consistent practice&apos; was the key factor for success.</p>
            </abstract>
          </article>
        `;

        const result = callExtractAbstractFromPmcXml(xml);

        expect(result).toBeDefined();
        expect(result).toContain('"positive outcomes"');
        expect(result).toContain("'consistent practice'");
      });
    });

    describe('XML Tag Removal', () => {
      it('should remove inline formatting tags (italic, bold)', () => {
        const xml = `
          <article>
            <abstract>
              <p>The <i>Escherichia coli</i> bacteria showed <b>significant resistance</b> to common antibiotics, representing a major public health concern that requires immediate attention and further research.</p>
            </abstract>
          </article>
        `;

        const result = callExtractAbstractFromPmcXml(xml);

        expect(result).toBeDefined();
        expect(result).toContain('Escherichia coli');
        expect(result).toContain('significant resistance');
        expect(result).not.toContain('<i>');
        expect(result).not.toContain('<b>');
        expect(result).not.toContain('</i>');
        expect(result).not.toContain('</b>');
      });

      it('should remove superscript and subscript tags', () => {
        const xml = `
          <article>
            <abstract>
              <p>The concentration of CO<sub>2</sub> was measured at 10<sup>6</sup> molecules per cubic meter, showing a significant increase from baseline measurements in this comprehensive climate study.</p>
            </abstract>
          </article>
        `;

        const result = callExtractAbstractFromPmcXml(xml);

        expect(result).toBeDefined();
        // Tags are replaced with spaces, so CO<sub>2</sub> becomes "CO 2"
        expect(result).toContain('CO');
        expect(result).toContain('2');
        expect(result).toContain('10');
        expect(result).toContain('6');
        expect(result).not.toContain('<sub>');
        expect(result).not.toContain('<sup>');
      });

      it('should remove xref citation tags', () => {
        const xml = `
          <article>
            <abstract>
              <p>Previous research <xref ref-type="bibr" rid="ref1">[1]</xref> has demonstrated that early intervention significantly improves patient outcomes in cardiovascular disease management across diverse populations.</p>
            </abstract>
          </article>
        `;

        const result = callExtractAbstractFromPmcXml(xml);

        expect(result).toBeDefined();
        expect(result).toContain('Previous research');
        expect(result).toContain('[1]');
        expect(result).not.toContain('<xref');
        expect(result).not.toContain('ref-type=');
      });
    });

    describe('Whitespace Normalization', () => {
      it('should normalize excessive whitespace', () => {
        const xml = `
          <article>
            <abstract>
              <p>This    research    examines     the   relationship   between


              multiple   variables   in   climate   science   research   methodology   and   findings.</p>
            </abstract>
          </article>
        `;

        const result = callExtractAbstractFromPmcXml(xml);

        expect(result).toBeDefined();
        expect(result).not.toMatch(/\s{2,}/); // No double spaces
        expect(result).not.toMatch(/\n/); // No newlines
      });

      it('should trim leading and trailing whitespace', () => {
        const xml = `
          <article>
            <abstract>
              <p>   This comprehensive research study examines the relationship between environmental factors and human health outcomes across multiple populations.   </p>
            </abstract>
          </article>
        `;

        const result = callExtractAbstractFromPmcXml(xml);

        expect(result).toBeDefined();
        expect(result).not.toMatch(/^\s/); // No leading whitespace
        expect(result).not.toMatch(/\s$/); // No trailing whitespace
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty XML gracefully', () => {
        const result = callExtractAbstractFromPmcXml('');
        expect(result).toBeUndefined();
      });

      it('should handle malformed XML gracefully', () => {
        const xml = '<article><abstract><p>Incomplete XML';
        const result = callExtractAbstractFromPmcXml(xml);
        // Should not throw, may return undefined or partial content
        expect(() => callExtractAbstractFromPmcXml(xml)).not.toThrow();
      });

      it('should handle abstract with only whitespace', () => {
        const xml = `
          <article>
            <abstract>
              <p>   </p>
            </abstract>
          </article>
        `;

        const result = callExtractAbstractFromPmcXml(xml);
        expect(result).toBeUndefined();
      });

      it('should handle multiple paragraph abstracts', () => {
        const xml = `
          <article>
            <abstract>
              <p>First paragraph discusses the background and motivation for this comprehensive research study.</p>
              <p>Second paragraph details the methodology used, including data collection and analysis procedures.</p>
              <p>Third paragraph presents the key findings and their statistical significance.</p>
            </abstract>
          </article>
        `;

        const result = callExtractAbstractFromPmcXml(xml);

        expect(result).toBeDefined();
        expect(result).toContain('First paragraph');
        expect(result).toContain('Second paragraph');
        expect(result).toContain('Third paragraph');
      });

      it('should handle nested sec elements', () => {
        const xml = `
          <article>
            <abstract>
              <sec>
                <title>Introduction</title>
                <p>Nested content within section element discussing comprehensive research methodology.</p>
                <sec>
                  <title>Sub-section</title>
                  <p>This sub-section provides additional detail about the study parameters.</p>
                </sec>
              </sec>
            </abstract>
          </article>
        `;

        const result = callExtractAbstractFromPmcXml(xml);

        expect(result).toBeDefined();
        expect(result).toContain('Nested content');
      });
    });
  });

  // ============================================================================
  // cleanAbstractText() Tests
  // ============================================================================
  describe('cleanAbstractText', () => {
    const callCleanAbstractText = (text: string) => {
      return (service as any).cleanAbstractText(text);
    };

    it('should normalize multiple spaces to single space', () => {
      const result = callCleanAbstractText('Hello    world   test');
      expect(result).toBe('Hello world test');
    });

    it('should convert newlines to spaces', () => {
      const result = callCleanAbstractText('Hello\nworld\ntest');
      expect(result).toBe('Hello world test');
    });

    it('should handle mixed whitespace', () => {
      const result = callCleanAbstractText('Hello  \n  world\n\n  test');
      expect(result).toBe('Hello world test');
    });

    it('should trim leading and trailing whitespace', () => {
      const result = callCleanAbstractText('  Hello world  ');
      expect(result).toBe('Hello world');
    });

    it('should handle empty string', () => {
      const result = callCleanAbstractText('');
      expect(result).toBe('');
    });

    it('should handle string with only whitespace', () => {
      const result = callCleanAbstractText('   \n\n   ');
      expect(result).toBe('');
    });

    it('should preserve single spaces', () => {
      const result = callCleanAbstractText('Already clean text');
      expect(result).toBe('Already clean text');
    });
  });

  // ============================================================================
  // getPublisherKey() Tests
  // ============================================================================
  describe('getPublisherKey', () => {
    const callGetPublisherKey = (hostname: string) => {
      return (service as any).getPublisherKey(hostname);
    };

    it('should detect PLOS publisher', () => {
      expect(callGetPublisherKey('journals.plos.org')).toBe('plos');
      expect(callGetPublisherKey('www.plos.org')).toBe('plos');
    });

    it('should detect MDPI publisher', () => {
      expect(callGetPublisherKey('www.mdpi.com')).toBe('mdpi');
      expect(callGetPublisherKey('mdpi.com')).toBe('mdpi');
    });

    it('should detect Frontiers publisher', () => {
      expect(callGetPublisherKey('www.frontiersin.org')).toBe('frontiers');
      expect(callGetPublisherKey('frontiersin.org')).toBe('frontiers');
    });

    it('should detect Springer/Nature publisher', () => {
      expect(callGetPublisherKey('www.nature.com')).toBe('springerNature');
      expect(callGetPublisherKey('link.springer.com')).toBe('springerNature');
    });

    it('should detect ScienceDirect publisher', () => {
      expect(callGetPublisherKey('www.sciencedirect.com')).toBe('scienceDirect');
      expect(callGetPublisherKey('www.cell.com')).toBe('scienceDirect');
    });

    it('should detect JAMA publisher', () => {
      expect(callGetPublisherKey('jamanetwork.com')).toBe('jama');
    });

    it('should return generic for unknown publishers', () => {
      expect(callGetPublisherKey('www.example.com')).toBe('generic');
      expect(callGetPublisherKey('unknown-journal.org')).toBe('generic');
    });
  });

  // ============================================================================
  // calculateWordCount() Tests
  // ============================================================================
  describe('calculateWordCount', () => {
    const callCalculateWordCount = (text: string) => {
      return (service as any).calculateWordCount(text);
    };

    it('should count words correctly', () => {
      expect(callCalculateWordCount('Hello world')).toBe(2);
      expect(callCalculateWordCount('One two three four five')).toBe(5);
    });

    it('should handle multiple spaces between words', () => {
      expect(callCalculateWordCount('Hello   world   test')).toBe(3);
    });

    it('should handle empty string', () => {
      expect(callCalculateWordCount('')).toBe(0);
    });

    it('should handle string with only whitespace', () => {
      expect(callCalculateWordCount('   ')).toBe(0);
    });
  });

  // ============================================================================
  // decodeXmlEntities() Tests
  // ============================================================================
  describe('decodeXmlEntities', () => {
    const callDecodeXmlEntities = (text: string) => {
      return (service as any).decodeXmlEntities(text);
    };

    it('should decode basic XML entities', () => {
      expect(callDecodeXmlEntities('&lt;tag&gt;')).toBe('<tag>');
      expect(callDecodeXmlEntities('a &amp; b')).toBe('a & b');
      expect(callDecodeXmlEntities('&quot;quoted&quot;')).toBe('"quoted"');
      expect(callDecodeXmlEntities('&apos;single&apos;')).toBe("'single'");
    });

    it('should decode numeric entities', () => {
      expect(callDecodeXmlEntities('&#8217;')).toBe("'");
      expect(callDecodeXmlEntities('&#8220;&#8221;')).toBe('""');
      expect(callDecodeXmlEntities('&#8211;')).toBe('–');
      expect(callDecodeXmlEntities('&#8212;')).toBe('—');
    });

    it('should handle mixed entities and text', () => {
      const input = 'Temperature &gt; 30°C &amp; humidity &lt; 50%';
      const expected = 'Temperature > 30°C & humidity < 50%';
      expect(callDecodeXmlEntities(input)).toBe(expected);
    });

    it('should handle text without entities', () => {
      expect(callDecodeXmlEntities('Plain text')).toBe('Plain text');
    });
  });
});
