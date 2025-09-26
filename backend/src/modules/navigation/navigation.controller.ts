import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NavigationStateService, ResearchPhase } from './navigation-state.service';

@ApiTags('Navigation')
@Controller('navigation')
export class NavigationController {
  constructor(private navigationService: NavigationStateService) {}

  @Get('state')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current navigation state for user' })
  @ApiResponse({
    status: 200,
    description: 'Navigation state retrieved successfully',
  })
  async getNavigationState(
    @Request() req: any,
    @Query('studyId') studyId?: string,
  ) {
    return this.navigationService.getNavigationState(req.user.id, studyId);
  }

  @Post('phase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current phase' })
  @ApiResponse({ status: 200, description: 'Phase updated successfully' })
  async updatePhase(
    @Request() req: any,
    @Body() body: { phase: ResearchPhase; studyId?: string },
  ) {
    await this.navigationService.updateCurrentPhase(
      req.user.id,
      body.phase,
      body.studyId,
    );
    return { success: true };
  }

  @Post('track')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track action completion' })
  @ApiResponse({ status: 200, description: 'Action tracked successfully' })
  async trackAction(
    @Request() req: any,
    @Body()
    body: {
      studyId: string;
      phase: ResearchPhase;
      action: string;
    },
  ) {
    await this.navigationService.trackActionCompletion(
      req.user.id,
      body.studyId,
      body.phase,
      body.action,
    );
    return { success: true };
  }

  @Get('phase/:phase/metadata')
  @ApiOperation({ summary: 'Get phase metadata' })
  @ApiResponse({ status: 200, description: 'Phase metadata retrieved' })
  getPhaseMetadata(@Param('phase') phase: ResearchPhase) {
    return this.navigationService.getPhaseMetadata(phase);
  }

  @Get('phases')
  @ApiOperation({ summary: 'Get all phase metadata' })
  @ApiResponse({ status: 200, description: 'All phase metadata retrieved' })
  getAllPhaseMetadata() {
    const navigationService = this.navigationService as any;
    return navigationService.getPhases();
  }
}
