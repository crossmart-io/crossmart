import { Module } from '@nestjs/common';
import { ActivityEventRepository } from './repositories/activity-event.repository.js';
import { ActivityLogRecorder } from './services/activity-log.recorder.js';
import { ActivityRecorder } from './services/activity-recorder.js';
import { ActivityService } from './services/activity.service.js';

/** The workspace activity log: who changed what, and when. Import it to record events. */
@Module({
  providers: [
    ActivityEventRepository,
    ActivityService,
    { provide: ActivityRecorder, useClass: ActivityLogRecorder },
  ],
  exports: [ActivityRecorder, ActivityService],
})
export class ActivityModule {}
