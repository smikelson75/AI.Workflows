import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';

const writeFileSync = fs.writeFileSync;
let sessionStateWrites = 0;

fs.writeFileSync = (filePath, ...args) => {
  if (String(filePath).endsWith('.json')) {
    sessionStateWrites += 1;
    if (sessionStateWrites > 1) {
      throw new Error('simulated session state write failure');
    }
  }
  return writeFileSync(filePath, ...args);
};
syncBuiltinESMExports();
