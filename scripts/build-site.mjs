import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const publicUrl = process.env.PUBLIC_URL || '/roulette/';
const parcelBinPath = fileURLToPath(new URL('../node_modules/parcel/lib/bin.js', import.meta.url));

const run = (command, args) => {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

run(process.execPath, [parcelBinPath, 'build', 'index.html', '--no-cache', '--public-url', publicUrl]);
run(process.execPath, ['scripts/build-sw.js']);
