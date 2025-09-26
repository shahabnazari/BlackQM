import { Test, TestingModule } from '@nestjs/testing';
import { ReferenceService, BibTeXType, CitationStyle } from './reference.service';
import { PrismaService } from '../../../common/prisma.service';

describe('ReferenceService', () => {
  let service: ReferenceService;
  let prisma: PrismaService;

  const mockPrismaService = {
    paper: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferenceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReferenceService>(ReferenceService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('BibTeX Parsing', () => {
    it('should parse valid BibTeX entry', () => {
      const bibtex = `@article{Smith2023example,
        title = {An Example Paper},
        author = {Smith, John and Doe, Jane},
        year = {2023},
        journal = {Example Journal},
        volume = {10},
        number = {2},
        pages = {123-145},
        doi = {10.1234/example.2023}
      }`;

      const result = service.parseBibTeX(bibtex);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(BibTeXType.ARTICLE);
      expect(result[0].citationKey).toBe('Smith2023example');
      expect(result[0].fields.title).toBe('An Example Paper');
      expect(result[0].fields.author).toBe('Smith, John and Doe, Jane');
      expect(result[0].fields.year).toBe('2023');
    });

    it('should parse multiple BibTeX entries', () => {
      const bibtex = `
        @article{Article2023,
          title = {First Article},
          author = {Author One},
          year = {2023}
        }
        @book{Book2022,
          title = {A Book},
          author = {Book Author},
          year = {2022},
          publisher = {Publisher Name}
        }
      `;

      const result = service.parseBibTeX(bibtex);
      
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe(BibTeXType.ARTICLE);
      expect(result[1].type).toBe(BibTeXType.BOOK);
    });

    it('should handle empty BibTeX string', () => {
      const result = service.parseBibTeX('');
      expect(result).toEqual([]);
    });
  });

  describe('BibTeX Generation', () => {
    it('should generate BibTeX for journal article', () => {
      const paper = {
        title: 'Test Article',
        authors: ['Smith, John', 'Doe, Jane'],
        year: 2023,
        journal: 'Test Journal',
        volume: '10',
        number: '2',
        pages: '100-110',
        doi: '10.1234/test',
      };

      const result = service.generateBibTeX(paper);
      
      expect(result).toContain('@article{');
      expect(result).toContain('title = {Test Article}');
      expect(result).toContain('author = {Smith, John and Doe, Jane}');
      expect(result).toContain('year = {2023}');
      expect(result).toContain('journal = {Test Journal}');
    });

    it('should handle missing optional fields', () => {
      const paper = {
        title: 'Minimal Paper',
        authors: 'Single Author',
        year: 2023,
      };

      const result = service.generateBibTeX(paper);
      
      expect(result).toContain('@misc{');
      expect(result).toContain('title = {Minimal Paper}');
      expect(result).not.toContain('journal =');
    });
  });

  describe('RIS Parsing', () => {
    it('should parse valid RIS entry', () => {
      const ris = `TY  - JOUR
TI  - Test Article
AU  - Smith, John
AU  - Doe, Jane
PY  - 2023
JO  - Test Journal
VL  - 10
IS  - 2
SP  - 100
EP  - 110
ER  - `;

      const result = service.parseRIS(ris);
      
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('JOUR');
      expect(result[0].fields.TI[0]).toBe('Test Article');
      expect(result[0].fields.AU).toHaveLength(2);
      expect(result[0].fields.PY[0]).toBe('2023');
    });

    it('should parse multiple RIS entries', () => {
      const ris = `TY  - JOUR
TI  - First Article
ER  - 
TY  - BOOK
TI  - A Book
ER  - `;

      const result = service.parseRIS(ris);
      
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('JOUR');
      expect(result[1].type).toBe('BOOK');
    });
  });

  describe('RIS Generation', () => {
    it('should generate RIS for journal article', () => {
      const paper = {
        title: 'Test Article',
        authors: ['Smith, John', 'Doe, Jane'],
        year: 2023,
        journal: 'Test Journal',
        volume: '10',
        number: '2',
        pages: '100-110',
      };

      const result = service.generateRIS(paper);
      
      expect(result).toContain('TY  - JOUR');
      expect(result).toContain('TI  - Test Article');
      expect(result).toContain('AU  - Smith, John');
      expect(result).toContain('AU  - Doe, Jane');
      expect(result).toContain('PY  - 2023');
      expect(result).toContain('ER  -');
    });
  });

  describe('Citation Formatting', () => {
    const testPaper = {
      title: 'Understanding Q-Methodology',
      authors: ['Smith, John', 'Doe, Jane', 'Johnson, Bob'],
      year: 2023,
      journal: 'Journal of Research Methods',
      volume: '15',
      number: '3',
      pages: '234-256',
      doi: '10.1234/jrm.2023.15',
    };

    it('should format APA citation', () => {
      const result = service.formatCitation(testPaper, CitationStyle.APA);
      
      expect(result).toContain('Smith, John et al.');
      expect(result).toContain('(2023)');
      expect(result).toContain('Understanding Q-Methodology');
      expect(result).toContain('Journal of Research Methods');
      expect(result).toContain('15(3), 234-256');
    });

    it('should format MLA citation', () => {
      const result = service.formatCitation(testPaper, CitationStyle.MLA);
      
      expect(result).toContain('Smith, John, et al');
      expect(result).toContain('"Understanding Q-Methodology"');
      expect(result).toContain('Journal of Research Methods');
      expect(result).toContain('(2023)');
    });

    it('should format Chicago citation', () => {
      const result = service.formatCitation(testPaper, CitationStyle.CHICAGO);
      
      expect(result).toContain('"Understanding Q-Methodology"');
      expect(result).toContain('Journal of Research Methods');
      expect(result).toContain('15, no. 3');
      expect(result).toContain('(2023)');
    });

    it('should format Harvard citation', () => {
      const result = service.formatCitation(testPaper, CitationStyle.HARVARD);
      
      expect(result).toContain('Smith, John et al.');
      expect(result).toContain('2023');
      expect(result).toContain("'Understanding Q-Methodology'");
      expect(result).toContain('Journal of Research Methods');
    });

    it('should format IEEE citation', () => {
      const result = service.formatCitation(testPaper, CitationStyle.IEEE);
      
      expect(result).toContain('J. Smith et al.');
      expect(result).toContain('"Understanding Q-Methodology,"');
      expect(result).toContain('Journal of Research Methods');
      expect(result).toContain('vol. 15');
    });

    it('should format Vancouver citation', () => {
      const result = service.formatCitation(testPaper, CitationStyle.VANCOUVER);
      
      expect(result).toContain('Smith J');
      expect(result).toContain('Understanding Q-Methodology');
      expect(result).toContain('Journal of Research Methods');
      expect(result).toContain('2023;15(3):234-256');
    });
  });

  describe('PDF Attachment', () => {
    it('should attach PDF to paper', async () => {
      const paperId = 'paper123';
      const pdfPath = '/path/to/paper.pdf';
      
      mockPrismaService.paper.update.mockResolvedValue({
        id: paperId,
        pdfPath,
        hasFullText: true,
      });

      await service.attachPDF(paperId, pdfPath);
      
      expect(mockPrismaService.paper.update).toHaveBeenCalledWith({
        where: { id: paperId },
        data: {
          pdfPath,
          hasFullText: true,
        },
      });
    });
  });

  describe('Citation Key Generation', () => {
    it('should generate citation key from paper data', () => {
      const paper = {
        title: 'Understanding Q-Methodology Applications',
        authors: ['Smith, John', 'Doe, Jane'],
        year: 2023,
      };

      const bibtex = service.generateBibTeX(paper);
      
      expect(bibtex).toContain('Smith2023understanding');
    });

    it('should handle missing year', () => {
      const paper = {
        title: 'Test Paper',
        authors: 'Author Name',
      };

      const bibtex = service.generateBibTeX(paper);
      
      expect(bibtex).toContain('NameXXXXtest');
    });
  });
});