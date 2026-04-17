import * as migration_20260414_083121_init_payload from './20260414_083121_init_payload';

export const migrations = [
  {
    up: migration_20260414_083121_init_payload.up,
    down: migration_20260414_083121_init_payload.down,
    name: '20260414_083121_init_payload'
  },
];
