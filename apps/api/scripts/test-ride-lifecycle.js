const { spawnSync } = require('node:child_process');
const path = require('node:path');

const scripts = [
  'test-affiliate-dispatch-visibility.js',
  'test-independent-dispatch.js',
  'test-affiliate-allocation-lifecycle.js',
];

for (const script of scripts) {
  const result = spawnSync(process.execPath, [path.join(__dirname, script)], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(JSON.stringify({
  success: true,
  verified: [
    'affiliate dispatch visibility',
    'independent driver booking-to-completion lifecycle',
    'affiliate driver and allocated vehicle booking-to-completion lifecycle',
  ],
}));
