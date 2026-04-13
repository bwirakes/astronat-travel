import * as migration_20260411_075029_initial from './20260411_075029_initial';
import * as migration_20260411_091836 from './20260411_091836';
import * as migration_20260411_092941_consolidate_universal_blocks from './20260411_092941_consolidate_universal_blocks';

export const migrations = [
  {
    up: migration_20260411_075029_initial.up,
    down: migration_20260411_075029_initial.down,
    name: '20260411_075029_initial',
  },
  {
    up: migration_20260411_091836.up,
    down: migration_20260411_091836.down,
    name: '20260411_091836',
  },
  {
    up: migration_20260411_092941_consolidate_universal_blocks.up,
    down: migration_20260411_092941_consolidate_universal_blocks.down,
    name: '20260411_092941_consolidate_universal_blocks'
  },
];
