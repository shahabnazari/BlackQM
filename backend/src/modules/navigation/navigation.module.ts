import { Module } from '@nestjs/common';
import { NavigationController } from './navigation.controller';
import { NavigationStateService } from './navigation.service';

@Module({
  controllers: [NavigationController],
  providers: [NavigationStateService],
  exports: [NavigationStateService],
})
export class NavigationModule {}