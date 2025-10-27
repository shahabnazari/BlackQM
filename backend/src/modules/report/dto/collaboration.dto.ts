/**
 * Collaboration DTOs - Phase 10 Day 4
 *
 * Request/response validation for collaboration features
 */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// Co-author Management DTOs
export class AddReportCollaboratorDto {
  @ApiProperty({ example: 'collaborator@example.com' })
  @IsEmail()
  collaboratorEmail!: string;

  @ApiProperty({ enum: ['editor', 'reviewer', 'viewer'], default: 'viewer' })
  @IsEnum(['editor', 'reviewer', 'viewer'])
  role!: 'editor' | 'reviewer' | 'viewer';
}

export class UpdateReportCollaboratorRoleDto {
  @ApiProperty({ enum: ['editor', 'reviewer', 'viewer'] })
  @IsEnum(['editor', 'reviewer', 'viewer'])
  newRole!: 'editor' | 'reviewer' | 'viewer';
}

// Version Control DTOs
export class CreateVersionDto {
  @ApiProperty({ example: 'Added methodology section', required: false })
  @IsOptional()
  @IsString()
  changeMessage?: string;
}

export class RestoreVersionDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  versionNumber!: number;
}

export class CompareVersionsDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  version1!: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  version2!: number;
}

// Comment DTOs
export class CreateCommentDto {
  @ApiProperty({ example: 'This section needs more references' })
  @IsString()
  content!: string;

  @ApiProperty({ example: 'section-3', required: false })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiProperty({ example: 'parent-comment-id', required: false })
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateCommentDto {
  @ApiProperty({ example: 'Updated comment text' })
  @IsString()
  content!: string;
}

// Track Changes DTOs
export class TrackChangeDto {
  @ApiProperty({ example: 'section-2' })
  @IsString()
  sectionId!: string;

  @ApiProperty({ enum: ['insert', 'delete', 'modify', 'format'] })
  @IsEnum(['insert', 'delete', 'modify', 'format'])
  changeType!: 'insert' | 'delete' | 'modify' | 'format';

  @ApiProperty({ example: 'Original text', required: false })
  @IsOptional()
  @IsString()
  before?: string;

  @ApiProperty({ example: 'New text', required: false })
  @IsOptional()
  @IsString()
  after?: string;

  @ApiProperty({
    example: { start: 0, end: 10, line: 1, column: 5 },
    required: false,
  })
  @IsOptional()
  position?: {
    start?: number;
    end?: number;
    line?: number;
    column?: number;
  };
}

export class RejectChangeDto {
  @ApiProperty({ example: 'Incorrect citation format', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RejectAllChangesDto {
  @ApiProperty({ example: 'Needs complete revision', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

// Approval Workflow DTOs
export class SubmitForApprovalDto {
  @ApiProperty({
    example: ['reviewer-id-1', 'reviewer-id-2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  reviewerIds!: string[];

  @ApiProperty({
    example: 'Please review the methodology section',
    required: false,
  })
  @IsOptional()
  @IsString()
  message?: string;
}

export class ApproveReportDto {
  @ApiProperty({ example: 'Looks good, approved', required: false })
  @IsOptional()
  @IsString()
  comments?: string;
}

export class RejectReportDto {
  @ApiProperty({ example: 'Needs revision in the results section' })
  @IsString()
  comments!: string;
}

// Query DTOs
export class GetChangesDto {
  @ApiProperty({ example: 'section-1', required: false })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiProperty({
    enum: ['insert', 'delete', 'modify', 'format'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['insert', 'delete', 'modify', 'format'])
  changeType?: 'insert' | 'delete' | 'modify' | 'format';

  @ApiProperty({ example: 'author-id', required: false })
  @IsOptional()
  @IsString()
  authorId?: string;
}

// Response DTOs
export interface CollaboratorResponse {
  id: string;
  role: 'editor' | 'reviewer' | 'viewer';
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  invitedBy: string | null;
  invitedAt: Date;
  status: string;
}

export interface VersionResponse {
  id: string;
  versionNumber: number;
  changeMessage: string | null;
  snapshot: any;
  diff: any;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface CommentResponse {
  id: string;
  content: string;
  sectionId: string | null;
  resolved: boolean;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  replies?: CommentResponse[];
}

export interface ChangeResponse {
  id: string;
  sectionId: string | null;
  changeType: string;
  before: string | null;
  after: string | null;
  position: any;
  accepted: boolean;
  rejected: boolean;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface ApprovalResponse {
  id: string;
  status: string;
  comments: string | null;
  requestedAt: Date;
  reviewedAt: Date | null;
  reviewer: {
    id: string;
    name: string | null;
    email: string;
  };
  requester: {
    id: string;
    name: string | null;
    email: string;
  };
}
