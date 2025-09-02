import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Request,
  HttpStatus,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ParticipantService } from './participant.service';
import { QSortService } from './qsort.service';
import { ProgressService } from './progress.service';
import { StartSessionDto } from './dto/start-session.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { SubmitPreSortDto } from './dto/submit-presort.dto';
import { SubmitQSortDto } from './dto/submit-qsort.dto';
import { SubmitCommentaryDto } from './dto/submit-commentary.dto';
import { SubmitDemographicsDto } from './dto/submit-demographics.dto';

@ApiTags('Participant')
@Controller('participant')
export class ParticipantController {
  constructor(
    private readonly participantService: ParticipantService,
    private readonly qSortService: QSortService,
    private readonly progressService: ProgressService,
  ) {}

  @Post('session/start')
  @ApiOperation({ summary: 'Start a new participant session' })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  @ApiResponse({ status: 404, description: 'Study not found or inactive' })
  async startSession(@Body() startSessionDto: StartSessionDto, @Request() req: any) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    
    return this.participantService.startSession(
      startSessionDto.studyId,
      startSessionDto.invitationCode,
      { ipAddress, userAgent }
    );
  }

  @Get('session/:sessionCode')
  @ApiOperation({ summary: 'Get session information' })
  @ApiResponse({ status: 200, description: 'Returns session information' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSession(@Param('sessionCode') sessionCode: string) {
    return this.participantService.getSession(sessionCode);
  }

  @Get('session/:sessionCode/study')
  @ApiOperation({ summary: 'Get study information for participant' })
  @ApiResponse({ status: 200, description: 'Returns study details' })
  async getStudyInfo(@Param('sessionCode') sessionCode: string) {
    return this.participantService.getStudyInfo(sessionCode);
  }

  @Get('session/:sessionCode/statements')
  @ApiOperation({ summary: 'Get randomized statements for the session' })
  @ApiResponse({ status: 200, description: 'Returns randomized statements' })
  async getStatements(@Param('sessionCode') sessionCode: string) {
    return this.participantService.getStatements(sessionCode);
  }

  @Put('session/:sessionCode/progress')
  @ApiOperation({ summary: 'Update participant progress' })
  @ApiResponse({ status: 200, description: 'Progress updated successfully' })
  async updateProgress(
    @Param('sessionCode') sessionCode: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    return this.progressService.updateProgress(sessionCode, updateProgressDto);
  }

  @Get('session/:sessionCode/progress')
  @ApiOperation({ summary: 'Get participant progress' })
  @ApiResponse({ status: 200, description: 'Returns current progress' })
  async getProgress(@Param('sessionCode') sessionCode: string) {
    return this.progressService.getProgress(sessionCode);
  }

  @Post('session/:sessionCode/consent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record consent agreement' })
  @ApiResponse({ status: 200, description: 'Consent recorded' })
  async recordConsent(
    @Param('sessionCode') sessionCode: string,
    @Body() consentData: { consented: boolean; timestamp: string },
  ) {
    return this.progressService.recordConsent(sessionCode, consentData);
  }

  @Post('session/:sessionCode/presort')
  @ApiOperation({ summary: 'Submit pre-sort categorization' })
  @ApiResponse({ status: 201, description: 'Pre-sort saved successfully' })
  async submitPreSort(
    @Param('sessionCode') sessionCode: string,
    @Body() preSortDto: SubmitPreSortDto,
  ) {
    return this.qSortService.savePreSort(sessionCode, preSortDto);
  }

  @Get('session/:sessionCode/presort')
  @ApiOperation({ summary: 'Get pre-sort data' })
  @ApiResponse({ status: 200, description: 'Returns pre-sort data' })
  async getPreSort(@Param('sessionCode') sessionCode: string) {
    return this.qSortService.getPreSort(sessionCode);
  }

  @Post('session/:sessionCode/qsort')
  @ApiOperation({ summary: 'Submit Q-sort grid data' })
  @ApiResponse({ status: 201, description: 'Q-sort saved successfully' })
  async submitQSort(
    @Param('sessionCode') sessionCode: string,
    @Body() qSortDto: SubmitQSortDto,
  ) {
    return this.qSortService.saveQSort(sessionCode, qSortDto);
  }

  @Get('session/:sessionCode/qsort')
  @ApiOperation({ summary: 'Get Q-sort data' })
  @ApiResponse({ status: 200, description: 'Returns Q-sort data' })
  async getQSort(@Param('sessionCode') sessionCode: string) {
    return this.qSortService.getQSort(sessionCode);
  }

  @Post('session/:sessionCode/commentary')
  @ApiOperation({ summary: 'Submit commentary for extreme positions' })
  @ApiResponse({ status: 201, description: 'Commentary saved successfully' })
  async submitCommentary(
    @Param('sessionCode') sessionCode: string,
    @Body() commentaryDto: SubmitCommentaryDto,
  ) {
    return this.qSortService.saveCommentary(sessionCode, commentaryDto);
  }

  @Post('session/:sessionCode/demographics')
  @ApiOperation({ summary: 'Submit demographic information' })
  @ApiResponse({ status: 201, description: 'Demographics saved successfully' })
  async submitDemographics(
    @Param('sessionCode') sessionCode: string,
    @Body() demographicsDto: SubmitDemographicsDto,
  ) {
    return this.participantService.saveDemographics(sessionCode, demographicsDto);
  }

  @Post('session/:sessionCode/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark session as complete' })
  @ApiResponse({ status: 200, description: 'Session completed successfully' })
  async completeSession(@Param('sessionCode') sessionCode: string) {
    return this.participantService.completeSession(sessionCode);
  }

  @Get('session/:sessionCode/validate')
  @ApiOperation({ summary: 'Validate Q-sort completion' })
  @ApiResponse({ status: 200, description: 'Returns validation result' })
  async validateQSort(@Param('sessionCode') sessionCode: string) {
    return this.qSortService.validateQSort(sessionCode);
  }
}