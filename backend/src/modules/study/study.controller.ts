import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { StudyService } from './study.service';
import { StatementService } from './statement.service';
import { CreateStudyDto } from './dto/create-study.dto';
import { UpdateStudyDto } from './dto/update-study.dto';
import { CreateStatementDto } from './dto/create-statement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SurveyStatus } from '@prisma/client';

@ApiTags('Studies')
@Controller('studies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StudyController {
  constructor(
    private readonly studyService: StudyService,
    private readonly statementService: StatementService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new study' })
  @ApiResponse({ status: 201, description: 'Study created successfully' })
  async create(@Body() createStudyDto: CreateStudyDto, @Request() req: ExpressRequest & { user: any }) {
    return this.studyService.create({
      ...createStudyDto,
      createdBy: req.user.userId,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all studies for the current user' })
  @ApiResponse({ status: 200, description: 'Returns all studies' })
  async findAll(@Request() req: ExpressRequest & { user: any }, @Query('status') status?: SurveyStatus) {
    return this.studyService.findAll(req.user.userId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific study' })
  @ApiResponse({ status: 200, description: 'Returns the study' })
  @ApiResponse({ status: 404, description: 'Study not found' })
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.studyService.findOne(id, req.user.userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a study' })
  @ApiResponse({ status: 200, description: 'Study updated successfully' })
  @ApiResponse({ status: 404, description: 'Study not found' })
  async update(
    @Param('id') id: string,
    @Body() updateStudyDto: UpdateStudyDto,
    @Request() req: any,
  ) {
    return this.studyService.update(id, updateStudyDto, req.user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a study' })
  @ApiResponse({ status: 204, description: 'Study deleted successfully' })
  @ApiResponse({ status: 404, description: 'Study not found' })
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.studyService.remove(id, req.user.userId);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update study status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: SurveyStatus,
    @Request() req: any,
  ) {
    return this.studyService.updateStatus(id, status, req.user.userId);
  }

  // Statement management
  @Post(':id/statements')
  @ApiOperation({ summary: 'Add statements to a study' })
  @ApiResponse({ status: 201, description: 'Statements added successfully' })
  async addStatements(
    @Param('id') studyId: string,
    @Body() statements: CreateStatementDto[],
    @Request() req: any,
  ) {
    // Verify user owns the study
    await this.studyService.findOne(studyId, req.user.userId);
    return this.statementService.createMany(studyId, statements);
  }

  @Get(':id/statements')
  @ApiOperation({ summary: 'Get all statements for a study' })
  @ApiResponse({ status: 200, description: 'Returns all statements' })
  async getStatements(@Param('id') studyId: string) {
    return this.statementService.findByStudy(studyId);
  }

  @Put(':id/statements/:statementId')
  @ApiOperation({ summary: 'Update a statement' })
  @ApiResponse({ status: 200, description: 'Statement updated successfully' })
  async updateStatement(
    @Param('id') studyId: string,
    @Param('statementId') statementId: string,
    @Body() updateData: { text?: string; order?: number },
    @Request() req: any,
  ) {
    // Verify user owns the study
    await this.studyService.findOne(studyId, req.user.userId);
    return this.statementService.update(statementId, updateData);
  }

  @Delete(':id/statements/:statementId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a statement' })
  @ApiResponse({ status: 204, description: 'Statement deleted successfully' })
  async deleteStatement(
    @Param('id') studyId: string,
    @Param('statementId') statementId: string,
    @Request() req: any,
  ) {
    // Verify user owns the study
    await this.studyService.findOne(studyId, req.user.userId);
    await this.statementService.delete(statementId);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get study statistics' })
  @ApiResponse({ status: 200, description: 'Returns study statistics' })
  async getStatistics(@Param('id') id: string, @Request() req: any) {
    return this.studyService.getStatistics(id, req.user.userId);
  }

  @Post('preview')
  @ApiOperation({ summary: 'Preview study as participant would see it' })
  @ApiResponse({ status: 200, description: 'Returns preview data' })
  async previewStudy(@Body() studyData: CreateStudyDto, @Request() req: any) {
    // Generate a preview of how the study will appear to participants
    return this.studyService.generatePreview(studyData, req.user.userId);
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Get preview of existing study' })
  @ApiResponse({ status: 200, description: 'Returns preview data for existing study' })
  async getStudyPreview(@Param('id') id: string, @Request() req: any) {
    return this.studyService.getPreview(id, req.user.userId);
  }
}