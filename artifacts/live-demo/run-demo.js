const fs = require('fs');
const path = require('path');

const baseUrl = 'http://localhost:3000';
const stamp = Date.now();
const demo = {
  companyName: `Codex Live Demo Transport ${stamp}`,
  companyRegNumber: String(stamp).slice(-8),
  address: '24 Live Demo Street',
  city: 'Sheffield',
  postcode: 'S1 4AB',
  operatorLicenceNumber: `PHV-LIVE-${String(stamp).slice(-6)}`,
  contactName: 'Alex Live Demo',
  phone: '+44 7700 987654',
  email: `affiliate.live.${stamp}@example.com`,
  password: 'LiveDemo@2026!',
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function newPage(url) {
  const response = await fetch(`http://127.0.0.1:9223/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  if (!response.ok) throw new Error(`Could not open browser page: ${response.status}`);
  return response.json();
}

async function connect(target) {
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  let id = 0;

  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
  });

  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const messageId = ++id;
    pending.set(messageId, { resolve, reject });
    socket.send(JSON.stringify({ id: messageId, method, params }));
  });

  return { socket, send };
}

async function evaluate(send, expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || 'Browser evaluation failed');
  }
  return result.result.value;
}

async function waitFor(send, expression, timeout = 20000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      if (await evaluate(send, expression)) return;
    } catch {
      // Navigation can briefly replace the document between checks.
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

async function navigate(send, url) {
  await send('Page.navigate', { url });
  await waitFor(send, `document.readyState === 'complete'`);
  await sleep(600);
}

async function screenshot(send, filename) {
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  fs.writeFileSync(path.join(__dirname, filename), Buffer.from(result.data, 'base64'));
}

async function typeInput(send, index, value) {
  await evaluate(send, `(() => {
    const input = document.querySelector('form').querySelectorAll('input')[${index}];
    if (!input) throw new Error('Input ${index} not found');
    input.focus();
    input.select();
  })()`);
  await send('Input.insertText', { text: value });
  await evaluate(send, `document.querySelector('form').querySelectorAll('input')[${index}].blur()`);
  await sleep(300);
}

async function fillRegistration(send) {
  const values = [
    demo.companyName,
    demo.companyRegNumber,
    demo.address,
    demo.city,
    demo.postcode,
    demo.operatorLicenceNumber,
    '3',
    '4',
    demo.contactName,
    demo.phone,
    demo.email,
    demo.password,
  ];
  for (const index of [...values.keys()].slice(1).concat(0)) {
    await typeInput(send, index, values[index]);
  }
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const current = await evaluate(send, `[...document.querySelector('form').querySelectorAll('input')].map(input => input.value)`);
    const missing = current.map((value, index) => value ? -1 : index).filter(index => index >= 0);
    if (!missing.length) break;
    for (const index of missing) await typeInput(send, index, values[index]);
  }
  await sleep(500);
  await evaluate(send, `document.querySelector('form').requestSubmit()`);
  await waitFor(send, `document.body.innerText.includes('Application Submitted!')`);
}

async function login(send, url, email, password, destinationText) {
  await navigate(send, url);
  await typeInput(send, 0, email);
  await typeInput(send, 1, password);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const values = await evaluate(send, `[...document.querySelector('form').querySelectorAll('input')].slice(0, 2).map(input => input.value)`);
    if (values[0] && values[1]) break;
    if (!values[0]) await typeInput(send, 0, email);
    if (!values[1]) await typeInput(send, 1, password);
  }
  await evaluate(send, `document.querySelector('form').requestSubmit()`);
  await waitFor(send, `location.pathname !== ${JSON.stringify(new URL(url).pathname)}`);
  await waitFor(send, `document.body.innerText.includes(${JSON.stringify(destinationText)})`);
}

async function main() {
  const target = await newPage(`${baseUrl}/affiliate/register`);
  const { socket, send } = await connect(target);
  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });

    await waitFor(send, `document.querySelectorAll('input').length >= 12`);
    await sleep(1500);
    await fillRegistration(send);
    await screenshot(send, '01-affiliate-registration-success.png');

    await login(
      send,
      `${baseUrl}/admin/login`,
      'admin@rideprestige.co.uk',
      'Admin@2026!',
      'Dashboard',
    );
    await navigate(send, `${baseUrl}/admin/affiliates`);
    await waitFor(send, `document.body.innerText.includes(${JSON.stringify(demo.email)})`);
    await screenshot(send, '02-admin-affiliate-pending.png');

    await send('Network.clearBrowserCookies');
    await login(
      send,
      `${baseUrl}/ops/login`,
      'ops@rideprestige.co.uk',
      'Ops@2026!',
      'Operations',
    );
    await navigate(send, `${baseUrl}/ops/affiliates`);
    await waitFor(send, `document.body.innerText.includes(${JSON.stringify(demo.email)})`);
    await screenshot(send, '03-ops-affiliate-pending.png');

    fs.writeFileSync(path.join(__dirname, 'demo-account.json'), JSON.stringify(demo, null, 2));
    console.log(JSON.stringify({ success: true, demo }, null, 2));
  } finally {
    socket.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
