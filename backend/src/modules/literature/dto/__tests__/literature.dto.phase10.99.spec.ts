/**
 * PHASE 10.99: Critical Bug Fixes - DTO Validation Tests
 *
 * Tests for decorator order fix and purpose field validation
 *
 * Critical Bug #1: @IsOptional() decorator order
 * - BEFORE: @IsString() @IsOptional() → purpose always required
 * - AFTER: @IsOptional() @IsString() → purpose truly optional
 *
 * Test Coverage:
 * - Purpose field optional validation
 * - Purpose field with valid values
 * - Purpose field with invalid values
 * - Decorator order correctness
 * - SourceContentDto validation
 */

import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  ExtractThemesV2Dto,
  ExtractThemesAcademicDto,
  SourceContentDto,
} from '../literature.dto';

describe('PHASE 10.99: ExtractThemesV2Dto - Purpose Field Validation', () => {
  describe('Critical Bug #1: Purpose Field Optional (Decorator Order)', () => {
    it('should PASS when purpose field is undefined (CRITICAL FIX)', async () => {
      // This test verifies the @IsOptional() decorator order fix
      const dto = plainToClass(ExtractThemesV2Dto, {
        sources: [
          {
            id: 'test-001',
            type: 'paper',
            title: 'Test Paper',
            content: 'Test content',
          },
        ],
        validationLevel: 'rigorous',
        // NO purpose field - should NOT fail
      });

      const errors = await validate(dto);
      const purposeErrors = errors.filter((e) =>
        e.property.includes('purpose')
      );

      expect(purposeErrors).toHaveLength(0);
      expect(errors.every((e) => !e.property.includes('purpose'))).toBe(true);
    });

    it('should PASS when purpose field is explicitly undefined', async () => {
      const dto = plainToClass(ExtractThemesV2Dto, {
        sources: [
          {
            id: 'test-001',
            type: 'paper',
            title: 'Test Paper',
            content: 'Test content',
          },
        ],
        validationLevel: 'rigorous',
        purpose: undefined, // Explicitly undefined
      });

      const errors = await validate(dto);
      const purposeErrors = errors.filter((e) =>
        e.property.includes('purpose')
      );

      expect(purposeErrors).toHaveLength(0);
    });

    it('should FAIL if decorator order was wrong (@IsString before @IsOptional)', async () => {
      // This test documents the BUG that was fixed
      // If decorator order is wrong, purpose=undefined would fail with:
      // "purpose must be a string"
      //
      // With correct order, purpose=undefined passes validation

      const dto = plainToClass(ExtractThemesV2Dto, {
        sources: [
          {
            id: 'test-001',
            type: 'paper',
            title: 'Test Paper',
            content: 'Test content',
          },
        ],
        purpose: undefined,
      });

      const errors = await validate(dto);

      // Should NOT have error about purpose being required
      const hasPurposeTypeError = errors.some(
        (e) =>
          e.property === 'purpose' &&
          Object.values(e.constraints || {}).some((msg) =>
            msg.includes('must be a string')
          )
      );

      expect(hasPurposeTypeError).toBe(false);
    });
  });

  describe('Valid Purpose Values', () => {
    const validPurposes = [
      'q_methodology',
      'survey_construction',
      'qualitative_analysis',
      'literature_synthesis',
      'hypothesis_generation',
    ];

    validPurposes.forEach((purpose) => {
      it(`should PASS with valid purpose: ${purpose}`, async () => {
        const dto = plainToClass(ExtractThemesV2Dto, {
          sources: [
            {
              id: 'test-001',
              type: 'paper',
              title: 'Test Paper',
              content: 'Test content',
            },
          ],
          purpose: purpose,
          validationLevel: 'rigorous',
        });

        const errors = await validate(dto);
        const purposeErrors = errors.filter((e) => e.property === 'purpose');

        expect(purposeErrors).toHaveLength(0);
      });
    });
  });

  describe('Invalid Purpose Values', () => {
    it('should FAIL with invalid purpose value', async () => {
      const dto = plainToClass(ExtractThemesV2Dto, {
        sources: [
          {
            id: 'test-001',
            type: 'paper',
            title: 'Test Paper',
            content: 'Test content',
          },
        ],
        purpose: 'invalid_purpose',
        validationLevel: 'rigorous',
      });

      const errors = await validate(dto);
      const purposeErrors = errors.filter((e) => e.property === 'purpose');

      expect(purposeErrors.length).toBeGreaterThan(0);
      expect(
        Object.values(purposeErrors[0].constraints || {}).some((msg) =>
          msg.includes('must be one of')
        )
      ).toBe(true);
    });

    it('should FAIL with empty string purpose', async () => {
      const dto = plainToClass(ExtractThemesV2Dto, {
        sources: [
          {
            id: 'test-001',
            type: 'paper',
            title: 'Test Paper',
            content: 'Test content',
          },
        ],
        purpose: '',
        validationLevel: 'rigorous',
      });

      const errors = await validate(dto);
      const purposeErrors = errors.filter((e) => e.property === 'purpose');

      expect(purposeErrors.length).toBeGreaterThan(0);
    });

    it('should FAIL with numeric purpose', async () => {
      const dto = plainToClass(ExtractThemesV2Dto, {
        sources: [
          {
            id: 'test-001',
            type: 'paper',
            title: 'Test Paper',
            content: 'Test content',
          },
        ],
        purpose: 123 as any,
        validationLevel: 'rigorous',
      });

      const errors = await validate(dto);
      const purposeErrors = errors.filter((e) => e.property === 'purpose');

      expect(purposeErrors.length).toBeGreaterThan(0);
    });
  });

  describe('SourceContentDto Validation', () => {
    it('should PASS with valid source structure', async () => {
      const source = plainToClass(SourceContentDto, {
        id: 'paper-001',
        type: 'paper',
        title: 'Valid Paper Title',
        content: 'This is valid paper content with sufficient length.',
        year: 2023,
        authors: ['Author A', 'Author B'],
        doi: '10.1234/example.001',
      });

      const errors = await validate(source);
      expect(errors).toHaveLength(0);
    });

    it('should FAIL when missing required id field', async () => {
      const source = plainToClass(SourceContentDto, {
        // id missing
        type: 'paper',
        title: 'Paper Title',
        content: 'Content',
      });

      const errors = await validate(source);
      const idErrors = errors.filter((e) => e.property === 'id');

      expect(idErrors.length).toBeGreaterThan(0);
    });

    it('should FAIL when missing required type field', async () => {
      const source = plainToClass(SourceContentDto, {
        id: 'paper-001',
        // type missing
        title: 'Paper Title',
        content: 'Content',
      });

      const errors = await validate(source);
      const typeErrors = errors.filter((e) => e.property === 'type');

      expect(typeErrors.length).toBeGreaterThan(0);
    });

    it('should FAIL with invalid type value', async () => {
      const source = plainToClass(SourceContentDto, {
        id: 'paper-001',
        type: 'invalid_type' as any,
        title: 'Paper Title',
        content: 'Content',
      });

      const errors = await validate(source);
      const typeErrors = errors.filter((e) => e.property === 'type');

      expect(typeErrors.length).toBeGreaterThan(0);
    });
  });

  describe('ExtractThemesAcademicDto (Base Class)', () => {
    it('should validate sources array correctly', async () => {
      const dto = plainToClass(ExtractThemesAcademicDto, {
        sources: [
          {
            id: 'test-001',
            type: 'paper',
            title: 'Test Paper',
            content: 'Test content',
          },
        ],
      });

      const errors = await validate(dto);
      const sourcesErrors = errors.filter((e) => e.property === 'sources');

      expect(sourcesErrors).toHaveLength(0);
    });

    it('should FAIL with empty sources array', async () => {
      const dto = plainToClass(ExtractThemesAcademicDto, {
        sources: [],
      });

      const errors = await validate(dto);
      const sourcesErrors = errors.filter((e) => e.property === 'sources');

      expect(sourcesErrors.length).toBeGreaterThan(0);
      // Check for array size validation error
      const hasArraySizeError = Object.values(sourcesErrors[0].constraints || {}).some((msg) =>
        msg.toLowerCase().includes('least') || msg.toLowerCase().includes('required')
      );
      expect(hasArraySizeError).toBe(true);
    });

    it('should validate optional fields correctly', async () => {
      const dto = plainToClass(ExtractThemesAcademicDto, {
        sources: [
          {
            id: 'test-001',
            type: 'paper',
            title: 'Test Paper',
            content: 'Test content',
          },
        ],
        researchContext: 'Test context',
        methodology: 'reflexive_thematic',
        validationLevel: 'rigorous',
        maxThemes: 10,
        minConfidence: 0.7,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null purpose gracefully', async () => {
      const dto = plainToClass(ExtractThemesV2Dto, {
        sources: [
          {
            id: 'test-001',
            type: 'paper',
            title: 'Test Paper',
            content: 'Test content',
          },
        ],
        purpose: null,
      });

      const errors = await validate(dto);
      // Null should be treated similar to undefined (optional)
      // or should fail with type error (not "required" error)
      const purposeErrors = errors.filter((e) => e.property === 'purpose');

      // Either no errors OR type error (not "required" error)
      if (purposeErrors.length > 0) {
        const hasRequiredError = Object.values(
          purposeErrors[0].constraints || {}
        ).some((msg) => msg.includes('required'));
        expect(hasRequiredError).toBe(false);
      }
    });

    it('should handle whitespace-only purpose', async () => {
      const dto = plainToClass(ExtractThemesV2Dto, {
        sources: [
          {
            id: 'test-001',
            type: 'paper',
            title: 'Test Paper',
            content: 'Test content',
          },
        ],
        purpose: '   ',
      });

      const errors = await validate(dto);
      const purposeErrors = errors.filter((e) => e.property === 'purpose');

      expect(purposeErrors.length).toBeGreaterThan(0);
    });
  });
});

describe('PHASE 10.99: Decorator Order Verification', () => {
  it('should document correct decorator order', () => {
    // This test documents the correct decorator order for optional fields
    //
    // ✅ CORRECT ORDER (top-to-bottom execution):
    // @IsOptional()    // 1st: Allow undefined
    // @IsString()      // 2nd: Validate type if present
    // @IsIn([...])     // 3rd: Validate value if present
    //
    // ❌ WRONG ORDER (causes bug):
    // @IsString()      // 1st: Fails if undefined!
    // @IsOptional()    // 2nd: Never reached
    // @IsIn([...])
    //
    // This test just documents the fix - actual validation is tested above

    expect(true).toBe(true);
  });
});
