/**
 * ENTERPRISE-GRADE CORRECTED VERSION
 * GET /api/literature/library/:paperId Endpoint
 *
 * Phase 10.92 Day 1 (Enterprise Cleanup)
 *
 * This file shows the CORRECTED, enterprise-grade version of the endpoint.
 * Apply these changes to: backend/src/modules/literature/literature.controller.ts
 *
 * **Changes from Original**:
 * 1. ✅ Strong typing: `user: AuthenticatedUser` (not `any`)
 * 2. ✅ DTO validation: `@Param() params: GetPaperParamsDto`
 * 3. ✅ Response DTO: `GetPaperResponseDto` for Swagger
 * 4. ✅ JSDoc documentation
 * 5. ✅ Follows enterprise pattern from `fetchFullTextForPaper`
 *
 * **Files to Update**:
 * 1. literature.controller.ts - Add imports and replace endpoint
 * 2. get-paper.dto.ts - Already created (new file)
 */

// ═══════════════════════════════════════════════════════════════
// STEP 1: ADD THESE IMPORTS TO literature.controller.ts
// ═══════════════════════════════════════════════════════════════

// Add to existing imports from './dto/fetch-fulltext.dto' (around line 85)
import {
  FetchFullTextParamsDto,
  FetchFullTextResponseDto,
  FullTextStatus,
  AuthenticatedUser,  // ✅ Already imported
} from './dto/fetch-fulltext.dto';

// Add NEW import for get-paper DTOs (around line 84)
import {
  GetPaperParamsDto,
  GetPaperResponseDto,
  PaperDetailsDto,
} from './dto/get-paper.dto';

// ═══════════════════════════════════════════════════════════════
// STEP 2: REPLACE ENDPOINT (lines 283-313) WITH THIS VERSION
// ═══════════════════════════════════════════════════════════════

/**
 * Get a single paper from user's library by ID
 *
 * **Purpose**: Retrieve paper details including full-text extraction status.
 * Used by frontend to poll for full-text extraction progress.
 *
 * **Security**: Validates user owns the paper (cannot access others' papers).
 *
 * **Phase 10.92 Day 1**: Enterprise-grade implementation
 * - Strong TypeScript typing (AuthenticatedUser)
 * - DTO validation (GetPaperParamsDto with CUID validation)
 * - Type-safe response (GetPaperResponseDto)
 * - Follows pattern from fetchFullTextForPaper endpoint
 *
 * @param params - Validated paper ID params (CUID format)
 * @param user - Authenticated user from JWT
 * @returns Paper details with full-text status
 * @throws NotFoundException if paper not found or user doesn't have access
 *
 * @example
 * ```typescript
 * // Frontend usage
 * const response = await api.get<GetPaperResponseDto>(
 *   `/literature/library/${paperId}`
 * );
 * console.log(response.paper.fullTextStatus); // 'fetching' | 'success' | etc.
 * ```
 */
@Get('library/:paperId')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({
  summary: 'Get a single paper from library by ID',
  description:
    'Retrieves paper details with full-text status. Used for polling full-text extraction progress. Requires JWT authentication and validates user ownership.',
})
@ApiResponse({
  status: 200,
  description: 'Paper returned successfully',
  type: GetPaperResponseDto, // ✅ Type-safe response documentation
})
@ApiResponse({
  status: 400,
  description: 'Invalid paper ID format (must be valid CUID)',
})
@ApiResponse({
  status: 401,
  description: 'Unauthorized - invalid or missing JWT token',
})
@ApiResponse({
  status: 404,
  description: 'Paper not found or access denied (user does not own this paper)',
})
async getPaperById(
  @Param() params: GetPaperParamsDto, // ✅ DTO validation (CUID format checked)
  @CurrentUser() user: AuthenticatedUser // ✅ Strong typing (not 'any')
): Promise<GetPaperResponseDto> {
  const { paperId } = params;

  // Validate ownership and retrieve paper details
  // Service method handles:
  // - Database query with userId filter
  // - NotFoundException if not found or access denied
  const paper = await this.literatureService.verifyPaperOwnership(
    paperId,
    user.userId,
  );

  // Return in consistent response structure
  return { paper };
}

// ═══════════════════════════════════════════════════════════════
// VERIFICATION CHECKLIST
// ═══════════════════════════════════════════════════════════════

/**
 * ✅ Type Safety:
 * - No 'any' types used
 * - AuthenticatedUser for user parameter
 * - GetPaperParamsDto for params
 * - GetPaperResponseDto return type
 *
 * ✅ Validation:
 * - CUID format validated by GetPaperParamsDto
 * - Rejects invalid IDs with 400 Bad Request
 * - User ownership validated at service layer
 *
 * ✅ Security:
 * - JWT authentication required
 * - User can only access their own papers
 * - No sensitive data exposed
 *
 * ✅ Documentation:
 * - Comprehensive JSDoc
 * - Swagger annotations complete
 * - Example usage provided
 *
 * ✅ Performance:
 * - Single database query
 * - Optimized field selection
 * - No N+1 queries
 *
 * ✅ Maintainability:
 * - Follows enterprise pattern
 * - Consistent with fetchFullTextForPaper
 * - Self-documenting code
 *
 * ✅ Error Handling:
 * - Clear HTTP status codes
 * - Descriptive error messages
 * - Proper exception types
 */

// ═══════════════════════════════════════════════════════════════
// TESTING INSTRUCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * 1. Backend Compilation:
 *    ```bash
 *    cd backend
 *    npm run build
 *    ```
 *    Expected: 0 TypeScript errors
 *
 * 2. Start Backend:
 *    ```bash
 *    npm run start:dev
 *    ```
 *    Expected: "Mapped {/api/literature/library/:paperId, GET} route"
 *
 * 3. Test Valid CUID:
 *    ```bash
 *    curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
 *      http://localhost:4000/api/literature/library/cmi2n24cl00079kt7xu9k82xo
 *    ```
 *    Expected: 200 OK with paper details
 *
 * 4. Test Invalid CUID:
 *    ```bash
 *    curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
 *      http://localhost:4000/api/literature/library/invalid-id-format
 *    ```
 *    Expected: 400 Bad Request with validation error
 *
 * 5. Test Without Auth:
 *    ```bash
 *    curl http://localhost:4000/api/literature/library/cmi2n24cl00079kt7xu9k82xo
 *    ```
 *    Expected: 401 Unauthorized
 *
 * 6. Test Other User's Paper:
 *    ```bash
 *    curl -H "Authorization: Bearer OTHER_USER_JWT" \
 *      http://localhost:4000/api/literature/library/cmi2n24cl00079kt7xu9k82xo
 *    ```
 *    Expected: 404 Not Found (access denied)
 */

// ═══════════════════════════════════════════════════════════════
// MIGRATION NOTES
// ═══════════════════════════════════════════════════════════════

/**
 * **Breaking Changes**: NONE
 * - Endpoint URL unchanged: GET /api/literature/library/:paperId
 * - Response structure unchanged: { paper: { ... } }
 * - Frontend code requires NO changes
 *
 * **Improvements**:
 * - Better validation (rejects invalid CUIDs earlier)
 * - Better documentation (Swagger shows field details)
 * - Better type safety (compile-time checks)
 * - Better error messages (clear validation feedback)
 *
 * **Backward Compatibility**: ✅ FULL
 * - All existing API calls will work identically
 * - Response format unchanged
 * - Only adds validation, doesn't change behavior
 */
