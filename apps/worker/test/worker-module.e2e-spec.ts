import { Test } from '@nestjs/testing';
import { WorkerModule } from '../src/worker.module.js';

describe('WorkerModule (e2e)', () => {
  it('resolves every provider the worker needs, as it does on start', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [WorkerModule] }).compile();
    await moduleRef.close();
  });
});
