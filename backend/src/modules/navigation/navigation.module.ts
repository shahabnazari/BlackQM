import { Module } from '@nestjs/common';
import { NavigationController } from './navigation.controller';
import { NavigationStateService } from './navigation-state.service';
import { NavigationGateway } from './navigation.gateway';

@Module({
  controllers: [NavigationController],
  providers: [NavigationStateService, NavigationGateway],
  exports: [NavigationStateService],
})
export class NavigationModule {}
