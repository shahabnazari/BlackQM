import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, IsOptional, IsArray, IsUUID, IsBoolean } from 'class-validator';

export enum CollaboratorRole {
  OWNER = 'owner',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  COMMENTER = 'commenter',
}

export class AddCollaboratorDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: CollaboratorRole, example: CollaboratorRole.EDITOR })
  @IsEnum(CollaboratorRole)
  role!: CollaboratorRole;
}

export class UpdateCollaboratorRoleDto {
  @ApiProperty({ enum: CollaboratorRole })
  @IsEnum(CollaboratorRole)
  role!: CollaboratorRole;
}

export class AddCommentDto {
  @ApiProperty({ example: 'This is a comment about the study' })
  @IsString()
  content!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

export class JoinSessionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: any;
}

export class LockSectionDto {
  @ApiProperty()
  @IsString()
  sectionId!: string;
}

export class CollaboratorDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: CollaboratorRole })
  role!: CollaboratorRole;

  @ApiProperty()
  permissions!: string[];

  @ApiProperty()
  invitedAt!: Date;

  @ApiProperty({ required: false })
  acceptedAt?: Date;
}

export class CommentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  studyId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  userName!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty({ required: false })
  sectionId?: string;

  @ApiProperty({ required: false })
  parentId?: string;

  @ApiProperty()
  timestamp!: Date;

  @ApiProperty()
  edited!: boolean;

  @ApiProperty()
  resolved!: boolean;
}

export class ActivityLogDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  studyId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  userName!: string;

  @ApiProperty()
  action!: string;

  @ApiProperty()
  details!: any;

  @ApiProperty()
  timestamp!: Date;

  @ApiProperty({ required: false })
  metadata?: any;
}

export class CollaborationStateDto {
  @ApiProperty()
  studyId!: string;

  @ApiProperty()
  activeUsers!: any[];

  @ApiProperty()
  lockedSections!: Map<string, string>;

  @ApiProperty()
  pendingChanges!: any[];

  @ApiProperty()
  lastSync!: Date;
}