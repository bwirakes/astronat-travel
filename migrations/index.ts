import * as migration_20260411_092941_consolidate_universal_blocks from './20260411_092941_consolidate_universal_blocks';

export const migrations = [
  {
    up: migration_20260411_092941_consolidate_universal_blocks.up,
    down: migration_20260411_092941_consolidate_universal_blocks.down,
    name: '20260411_092941_consolidate_universal_blocks'
  },
];
