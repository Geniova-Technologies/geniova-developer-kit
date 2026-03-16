#!/usr/bin/env node

import { main } from '../src/index.js';
import { sync } from '../src/steps/sync.js';

const command = process.argv[2];

if (command === 'sync') {
  sync(process.argv[3]).catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
