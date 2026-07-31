import { Module } from '@nestjs/common';
import { SubTaskController } from './sub-task.controller.js';
import { SubTaskService } from './sub-task.service.js';

@Module({
  controllers: [SubTaskController],
  providers: [SubTaskService],
  exports: [SubTaskService],
})
export class SubTaskModule {}
