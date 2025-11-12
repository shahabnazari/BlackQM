import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Query,
  Param,
  Body,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  ResearchRepositoryService,
  SearchQuery,
} from '../services/research-repository.service';

// Phase 10 Day 30: Simplified caching (using service-level cache instead of HTTP interceptor)
// CacheInterceptor requires @nestjs/cache-manager which may not be configured
// The service already has CacheService with 5-minute TTL

/**
 * Phase 10 Days 26-30: Research Repository Controller
 *
 * REST API endpoints for research repository and knowledge management
 *
 * Endpoints:
 * - POST /repository/index - Reindex entities
 * - POST /repository/index/study/:studyId - Reindex specific study
 * - GET /repository/search - Search repository
 * - GET /repository/insights/:id - Get insight details
 * - GET /repository/insights/:id/related - Get related insights
 * - GET /repository/facets - Get available facets
 * - GET /repository/stats - Get repository statistics
 */

@ApiTags('Repository')
@Controller('repository')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RepositoryController {
  constructor(private readonly repositoryService: ResearchRepositoryService) {}

  // ==========================================================================
  // INDEXING ENDPOINTS
  // ==========================================================================

  /**
   * Reindex all entities for the current user
   */
  @Post('index')
  @ApiOperation({
    summary: 'Reindex all research entities',
    description:
      'Extracts and indexes all research insights from studies, literature, and analyses',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Indexing completed successfully',
    schema: {
      type: 'object',
      properties: {
        indexed: { type: 'number', example: 156 },
        message: {
          type: 'string',
          example: 'Successfully indexed 156 insights',
        },
      },
    },
  })
  async reindexAll(@Request() req: any) {
    const userId = req.user.userId;
    const indexed = await this.repositoryService.reindexAll(userId);

    return {
      indexed,
      message: `Successfully indexed ${indexed} insights`,
    };
  }

  /**
   * Reindex a specific study
   */
  @Post('index/study/:studyId')
  @ApiOperation({
    summary: 'Reindex specific study',
    description: 'Extracts and indexes all insights from a single study',
  })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Study reindexed successfully',
  })
  async reindexStudy(@Param('studyId') studyId: string, @Request() req: any) {
    const userId = req.user.userId;
    const indexed = await this.repositoryService.reindexStudy(studyId, userId);

    return {
      studyId,
      indexed,
      message: `Successfully indexed ${indexed} insights from study ${studyId}`,
    };
  }

  // ==========================================================================
  // SEARCH ENDPOINTS
  // ==========================================================================

  /**
   * Search across all repository entities
   * Phase 10 Day 30: Service-level caching already implemented in service
   */
  @Get('search')
  @ApiOperation({
    summary: 'Search research repository',
    description:
      'Full-text search with faceting across all indexed research insights',
  })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiQuery({
    name: 'types',
    description: 'Filter by insight types (comma-separated)',
    required: false,
  })
  @ApiQuery({
    name: 'sourceTypes',
    description: 'Filter by source types (comma-separated)',
    required: false,
  })
  @ApiQuery({
    name: 'studyIds',
    description: 'Filter by study IDs (comma-separated)',
    required: false,
  })
  @ApiQuery({
    name: 'allStudies',
    description: 'Search across all user studies (default: false)',
    required: false,
    type: Boolean,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of results per page',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Pagination offset',
    required: false,
    type: Number,
  })
  @ApiQuery({
    name: 'sort',
    description: 'Sort by: relevance, date, popularity, citationCount',
    required: false,
  })
  @ApiQuery({
    name: 'order',
    description: 'Sort order: asc or desc',
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results with facets',
  })
  async search(
    @Query('q') query: string,
    @Query('types') types?: string,
    @Query('sourceTypes') sourceTypes?: string,
    @Query('studyIds') studyIds?: string,
    @Query('allStudies') allStudies?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('sort') sort?: string,
    @Query('order') order?: string,
    @Request() req?: any,
  ) {
    const searchQuery: SearchQuery = {
      query,
      filters: {
        types: types ? types.split(',') : undefined,
        sourceTypes: sourceTypes ? sourceTypes.split(',') : undefined,
        // Phase 10 Day 28: Cross-study search - only filter by studyId if not searching all studies
        studyIds:
          allStudies === 'true' || !studyIds ? undefined : studyIds.split(','),
        userIds: [req.user.userId], // Only search user's own insights
      },
      sort: sort
        ? {
            field: sort as any,
            order: (order as 'asc' | 'desc') || 'desc',
          }
        : undefined,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    };

    const result = await this.repositoryService.search(searchQuery);

    // Phase 10 Day 28: Save search to history
    await this.repositoryService.saveSearchHistory(
      req.user.userId,
      query,
      searchQuery.filters,
      result.total,
    );

    return result;
  }

  /**
   * Get insight details with full citation lineage
   * Phase 10 Day 30: Database-level caching via Prisma
   */
  @Get('insights/:id')
  @ApiOperation({
    summary: 'Get insight details',
    description:
      'Retrieve full insight details including citation chain and provenance',
  })
  @ApiParam({ name: 'id', description: 'Insight ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Insight details',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Insight not found',
  })
  async getInsight(@Param('id') insightId: string, @Request() req: any) {
    const userId = req.user.userId;
    const insight = await this.repositoryService.getInsight(insightId, userId);

    if (!insight) {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Insight not found',
      };
    }

    return insight;
  }

  /**
   * Get related insights
   * Phase 10 Day 30: Service-level caching already implemented
   */
  @Get('insights/:id/related')
  @ApiOperation({
    summary: 'Get related insights',
    description: 'Find insights related to the specified insight',
  })
  @ApiParam({ name: 'id', description: 'Insight ID' })
  @ApiQuery({
    name: 'limit',
    description: 'Number of related insights',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Related insights',
  })
  async getRelatedInsights(
    @Param('id') insightId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    return await this.repositoryService.getRelatedInsights(insightId, limitNum);
  }

  /**
   * Get available facets for filtering
   * Phase 10 Day 30: Static data, no caching needed
   */
  @Get('facets')
  @ApiOperation({
    summary: 'Get available facets',
    description: 'Get all available facets for filtering search results',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available facets',
  })
  async getFacets(@Request() req: any) {
    // Return available facet options
    return {
      types: [
        'statement',
        'factor',
        'theme',
        'gap',
        'quote',
        'paper_finding',
        'hypothesis',
      ],
      sourceTypes: ['study', 'paper', 'response', 'analysis', 'literature'],
      shareLevels: ['private', 'team', 'institution', 'public'],
      sortOptions: ['relevance', 'date', 'popularity', 'citationCount'],
    };
  }

  /**
   * Get repository statistics
   * Phase 10 Day 30: Lightweight query, caching not critical
   */
  @Get('stats')
  @ApiOperation({
    summary: 'Get repository statistics',
    description: 'Get statistics about indexed insights',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Repository statistics',
  })
  async getStats(@Request() req: any) {
    const userId = req.user.userId;

    // Get counts by type
    const results = await this.repositoryService.search({
      query: '',
      filters: { userIds: [userId] },
      limit: 0,
    });

    return {
      totalInsights: results.total,
      byType: Object.fromEntries(results.facets.types),
      bySourceType: Object.fromEntries(results.facets.sourceTypes),
      byStudy: Object.fromEntries(results.facets.studies),
    };
  }

  // ==========================================================================
  // ANNOTATION ENDPOINTS (Day 27)
  // ==========================================================================

  /**
   * Get annotations for an insight
   */
  @Get('insights/:id/annotations')
  @ApiOperation({
    summary: 'Get insight annotations',
    description: 'Retrieve all annotations for a specific insight',
  })
  @ApiParam({ name: 'id', description: 'Insight ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of annotations',
  })
  async getAnnotations(@Param('id') insightId: string, @Request() req: any) {
    return await this.repositoryService.getAnnotations(
      insightId,
      req.user.userId,
    );
  }

  /**
   * Create annotation on an insight
   */
  @Post('insights/:id/annotations')
  @ApiOperation({
    summary: 'Create annotation',
    description: 'Add a new annotation to an insight',
  })
  @ApiParam({ name: 'id', description: 'Insight ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Annotation created',
  })
  async createAnnotation(
    @Param('id') insightId: string,
    @Body() body: { content: string; type: string; parentId?: string },
    @Request() req: any,
  ) {
    return await this.repositoryService.createAnnotation(
      insightId,
      req.user.userId,
      body.content,
      body.type,
      body.parentId,
    );
  }

  /**
   * Update an annotation
   */
  @Post('annotations/:id')
  @ApiOperation({
    summary: 'Update annotation',
    description: 'Update an existing annotation',
  })
  @ApiParam({ name: 'id', description: 'Annotation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Annotation updated',
  })
  async updateAnnotation(
    @Param('id') annotationId: string,
    @Body() body: { content: string },
    @Request() req: any,
  ) {
    return await this.repositoryService.updateAnnotation(
      annotationId,
      req.user.userId,
      body.content,
    );
  }

  /**
   * Delete an annotation
   */
  @Post('annotations/:id/delete')
  @ApiOperation({
    summary: 'Delete annotation',
    description: 'Delete an annotation',
  })
  @ApiParam({ name: 'id', description: 'Annotation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Annotation deleted',
  })
  async deleteAnnotation(
    @Param('id') annotationId: string,
    @Request() req: any,
  ) {
    return await this.repositoryService.deleteAnnotation(
      annotationId,
      req.user.userId,
    );
  }

  // ==========================================================================
  // VERSION HISTORY ENDPOINTS (Day 27)
  // ==========================================================================

  /**
   * Get version history for an insight
   */
  @Get('insights/:id/versions')
  @ApiOperation({
    summary: 'Get version history',
    description: 'Retrieve version history for an insight',
  })
  @ApiParam({ name: 'id', description: 'Insight ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Version history',
  })
  async getVersionHistory(@Param('id') insightId: string, @Request() req: any) {
    return await this.repositoryService.getVersionHistory(
      insightId,
      req.user.userId,
    );
  }

  /**
   * Get specific version of an insight
   */
  @Get('insights/:id/versions/:version')
  @ApiOperation({
    summary: 'Get specific version',
    description: 'Retrieve a specific version of an insight',
  })
  @ApiParam({ name: 'id', description: 'Insight ID' })
  @ApiParam({ name: 'version', description: 'Version number' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Version data',
  })
  async getVersion(
    @Param('id') insightId: string,
    @Param('version') version: string,
    @Request() req: any,
  ) {
    return await this.repositoryService.getVersion(
      insightId,
      parseInt(version, 10),
      req.user.userId,
    );
  }

  // ==========================================================================
  // SEARCH HISTORY ENDPOINTS (Phase 10 Day 28)
  // ==========================================================================

  /**
   * Get search history
   */
  @Get('search-history')
  @ApiOperation({
    summary: 'Get search history',
    description: 'Retrieve user search history',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of results',
    required: false,
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search history',
  })
  async getSearchHistory(@Query('limit') limit?: string, @Request() req?: any) {
    return await this.repositoryService.getSearchHistory(
      req.user.userId,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * Clear search history
   */
  @Delete('search-history')
  @ApiOperation({
    summary: 'Clear search history',
    description: 'Delete all search history for user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'History cleared',
  })
  async clearSearchHistory(@Request() req: any) {
    return await this.repositoryService.clearSearchHistory(req.user.userId);
  }

  // ==========================================================================
  // PERMISSIONS & COLLABORATION ENDPOINTS (Phase 10 Day 29)
  // ==========================================================================

  /**
   * Update insight visibility
   */
  @Put('insights/:id/visibility')
  @ApiOperation({
    summary: 'Update insight visibility',
    description:
      'Change insight public/private status and share level (owner only)',
  })
  @ApiParam({ name: 'id', description: 'Insight ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Visibility updated',
  })
  async updateVisibility(
    @Param('id') insightId: string,
    @Body()
    body: {
      isPublic: boolean;
      shareLevel: 'private' | 'team' | 'institution' | 'public';
    },
    @Request() req: any,
  ) {
    return await this.repositoryService.updateInsightVisibility(
      insightId,
      req.user.userId,
      body.isPublic,
      body.shareLevel,
    );
  }

  /**
   * Grant access to a user
   */
  @Post('insights/:id/access')
  @ApiOperation({
    summary: 'Grant access to user',
    description:
      'Grant a user access to an insight with specific role (owner only)',
  })
  @ApiParam({ name: 'id', description: 'Insight ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Access granted',
  })
  async grantAccess(
    @Param('id') insightId: string,
    @Body()
    body: {
      userId: string;
      role: 'VIEWER' | 'COMMENTER' | 'EDITOR' | 'OWNER';
      expiresAt?: string;
    },
    @Request() req: any,
  ) {
    return await this.repositoryService.grantAccess(
      insightId,
      req.user.userId,
      body.userId,
      body.role,
      body.expiresAt ? new Date(body.expiresAt) : undefined,
    );
  }

  /**
   * Revoke user access
   */
  @Delete('insights/:id/access/:userId')
  @ApiOperation({
    summary: 'Revoke user access',
    description: 'Remove user access from an insight (owner only)',
  })
  @ApiParam({ name: 'id', description: 'Insight ID' })
  @ApiParam({ name: 'userId', description: 'User ID to revoke' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Access revoked',
  })
  async revokeAccess(
    @Param('id') insightId: string,
    @Param('userId') targetUserId: string,
    @Request() req: any,
  ) {
    return await this.repositoryService.revokeAccess(
      insightId,
      req.user.userId,
      targetUserId,
    );
  }

  /**
   * Check if user has access to insight
   */
  @Get('insights/:id/check-access')
  @ApiOperation({
    summary: 'Check access',
    description: 'Check if current user has access to an insight',
  })
  @ApiParam({ name: 'id', description: 'Insight ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Access check result',
  })
  async checkAccess(@Param('id') insightId: string, @Request() req: any) {
    return await this.repositoryService.checkAccess(insightId, req.user.userId);
  }

  /**
   * Get access list for insight
   */
  @Get('insights/:id/access')
  @ApiOperation({
    summary: 'Get access list',
    description: 'Get list of users with access to insight (owner only)',
  })
  @ApiParam({ name: 'id', description: 'Insight ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Access list',
  })
  async getAccessList(@Param('id') insightId: string, @Request() req: any) {
    return await this.repositoryService.getInsightAccessList(
      insightId,
      req.user.userId,
    );
  }

  /**
   * Grant study-level access
   */
  @Post('studies/:studyId/access')
  @ApiOperation({
    summary: 'Grant study access',
    description: 'Grant access to all insights in a study (owner only)',
  })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Access granted to all study insights',
  })
  async grantStudyAccess(
    @Param('studyId') studyId: string,
    @Body()
    body: {
      userId: string;
      role: 'VIEWER' | 'COMMENTER' | 'EDITOR';
    },
    @Request() req: any,
  ) {
    return await this.repositoryService.grantStudyAccess(
      studyId,
      req.user.userId,
      body.userId,
      body.role,
    );
  }

  /**
   * Revoke study-level access
   */
  @Delete('studies/:studyId/access/:userId')
  @ApiOperation({
    summary: 'Revoke study access',
    description: 'Revoke access to all insights in a study (owner only)',
  })
  @ApiParam({ name: 'studyId', description: 'Study ID' })
  @ApiParam({ name: 'userId', description: 'User ID to revoke' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Access revoked from all study insights',
  })
  async revokeStudyAccess(
    @Param('studyId') studyId: string,
    @Param('userId') targetUserId: string,
    @Request() req: any,
  ) {
    return await this.repositoryService.revokeStudyAccess(
      studyId,
      req.user.userId,
      targetUserId,
    );
  }
}
