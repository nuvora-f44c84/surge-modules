const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, '../scripts/VPS-TrafficPanel.js'), 'utf8');

// All addresses, credentials and usage values in these tests are synthetic.
function run(options = {}) {
  let now = Date.parse(options.date || '2030-01-10T12:00:00Z');
  const results = [], timers = [], requests = [], callbacks = [];
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  vm.runInNewContext(code, {
    Date: Clock,
    $argument: options.argument ?? new URLSearchParams({ name: 'Example VPS', url: 'https://stats.example.invalid/status', resetDay: '11', policy: 'Example Proxy', requestTimeout: '3' }).toString(),
    $done: value => results.push(JSON.parse(JSON.stringify(value))),
    setTimeout: (fn, delay) => timers.push({ fn, delay }),
    $httpClient: {
      get: (request, fn) => {
        requests.push(JSON.parse(JSON.stringify(request)));
        callbacks.push(fn);
      }
    }
  });
  return {
    results,
    timers,
    requests,
    advance: ms => { now += ms; },
    reply: (data, error = null, index = 0, elapsedMs = 125) => {
      now += elapsedMs;
      callbacks[index](error, { status: 200 }, data);
    }
  };
}

test('uses the configured policy and shows only usage, API latency and UTC reset countdown', () => {
  const r = run();
  r.reply(JSON.stringify({ used_gb: 125.25, quota_gb: 500, cpu: 90, ram: 80 }));
  assert.deepEqual(r.requests[0], { url: 'https://stats.example.invalid/status', timeout: 3, policy: 'Example Proxy' });
  assert.deepEqual(r.results, [{ title: 'Example VPS · 125 ms', content: '流量 125.25/500 GB · 1 天重置', icon: 'server.rack', 'icon-color': '#34C759' }]);
});

test('reset day starts the following billing cycle, including a year boundary', () => {
  for (const [date, days] of [['2030-01-11T12:00:00Z', 31], ['2030-12-31T12:00:00Z', 11]]) {
    const r = run({ date }); r.reply('{"used_gb":950}');
    assert.equal(r.results[0].content, `流量 950.00/1000 GB · ${days} 天重置`);
    assert.equal(r.results[0]['icon-color'], '#FF3B30');
  }
});

test('encoded credentials stay in the request and are not shown on connection failure', () => {
  const url = 'https://stats.example.invalid/status?token=SYNTHETIC+TOKEN&a=1';
  const r = run({ argument: new URLSearchParams({ url }).toString() });
  r.reply('', 'failed');
  assert.equal(r.requests[0].url, url);
  assert.equal(r.requests[0].policy, 'DIRECT');
  assert.ok(!JSON.stringify(r.results).includes('SYNTHETIC'));
});

test('missing or malformed configuration makes no network request', () => {
  for (const argument of [
    '',
    'url=%E0%A4%A',
    'url=https%3A%2F%2Fstats.example.invalid&resetDay=0',
    'name1=A&url1=https%3A%2F%2Fa.example.invalid&name2=B&url2=bad-url'
  ]) {
    const r = run({ argument });
    assert.equal(r.requests.length, 0);
    assert.equal(r.results.length, 1);
    assert.match(r.results[0].title, /参数异常/);
  }
});

test('deadline and late callbacks finish once; invalid responses show an error', () => {
  const r = run(); r.timers[0].fn(); r.reply('{"used_gb":1}');
  assert.equal(r.results.length, 1); assert.match(r.results[0].title, /请求超时/);
  for (const data of ['null', 'not-json']) {
    const r2 = run(); r2.reply(data); assert.match(r2.results[0].title, /数据异常/);
  }
});

test('multi-node 2-in-1 mode queries both endpoints concurrently with independent policies', () => {
  const argument = new URLSearchParams({
    name1: 'NodeA',
    url1: 'https://a.example.invalid/status',
    quota1: '1000',
    resetDay1: '11',
    policy1: 'DIRECT',
    requestTimeout1: '3',
    name2: 'NodeB',
    url2: 'https://b.example.invalid/status',
    quota2: '1000',
    resetDay2: '29',
    policy2: 'Proxy B',
    requestTimeout2: '5'
  }).toString();

  const r = run({ argument, date: '2030-01-10T12:00:00Z' });
  assert.equal(r.requests.length, 2);
  assert.deepEqual(r.requests[0], { url: 'https://a.example.invalid/status', timeout: 3, policy: 'DIRECT' });
  assert.deepEqual(r.requests[1], { url: 'https://b.example.invalid/status', timeout: 5, policy: 'Proxy B' });
  assert.equal(r.timers[0].delay, 6000);

  r.reply(JSON.stringify({ used_gb: 42.5, quota_gb: 1000 }), null, 0, 140);
  assert.equal(r.results.length, 0); // waits for second node
  r.reply(JSON.stringify({ used_gb: 820, quota_gb: 1000 }), null, 1, 90);

  assert.deepEqual(r.results, [{
    title: 'NodeA 140ms · NodeB 230ms',
    content: 'NodeA：42.50/1000 GB · 1 天重置\nNodeB：820.00/1000 GB · 19 天重置',
    icon: 'server.rack',
    'icon-color': '#FF9500'
  }]);
});

test('multi-node partial timeout keeps completed node traffic data intact', () => {
  const argument = new URLSearchParams({
    name1: 'NodeA',
    url1: 'https://a.example.invalid/status',
    resetDay1: '11',
    name2: 'NodeB',
    url2: 'https://b.example.invalid/status?secret=HIDDEN_TOKEN',
    resetDay2: '29',
    requestTimeout2: '5'
  }).toString();

  const r = run({ argument, date: '2030-01-10T12:00:00Z' });
  r.reply(JSON.stringify({ used_gb: 15.2, quota_gb: 1000 }), null, 0, 110);
  r.timers[0].fn(); // NodeB hangs past deadline

  assert.equal(r.results.length, 1);
  assert.equal(r.results[0].title, 'NodeA 110ms · NodeB 超时');
  assert.equal(r.results[0].content, 'NodeA：15.20/1000 GB · 1 天重置\nNodeB：请求超时（>6s）');
  assert.equal(r.results[0].icon, 'exclamationmark.triangle.fill');
  assert.equal(r.results[0]['icon-color'], '#FF9500');
  assert.ok(!JSON.stringify(r.results).includes('HIDDEN_TOKEN'));
});
