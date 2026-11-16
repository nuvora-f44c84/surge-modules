// Cron/event script. Pass source group, destination select group and fallback name separated by |.
// Configure the fallback as the first explicit member. Include the source group’s policies via include-other-group.
(async function () {
  const [pool, group, fallback] = String($argument || '').split('|');
  const key = 'yt-premium-selector-v1-' + group;
  const owner = Date.now() + '-' + Math.random();
  const read = () => JSON.parse($persistentStore.read(key) || '{}');
  const write = state => $persistentStore.write(JSON.stringify(state), key);
  const groups = () => $surge.selectGroupDetails();
  const selected = d => d.decisions[group] || (d.groups[group] || [])[0];
  const api = (path, params) => new Promise(resolve => $httpAPI('GET',path,params,resolve));
  function networkKey() {
    const n = $network || {}, v4 = n.v4 || {}, wifi = n.wifi || {};
    const value = [wifi.ssid,wifi.bssid,v4.primaryInterface,v4.primaryAddress,v4.primaryRouter,
      (n.v6 || {}).primaryInterface,(n['cellular-data'] || {}).carrier].join('|');
    let hash = 2166136261;
    for (let i=0;i<value.length;i++) hash = Math.imul(hash ^ value.charCodeAt(i),16777619);
    return String(hash >>> 0);
  }
  async function probe(node) {
    const response = await new Promise(resolve => {
      $httpClient.get({url:'https://www.youtube.com/premium?hl=en&surge_probe=' + Date.now() + '-' + Math.random(),
        policy:node.identifier,timeout:5,'auto-cookie':false,'auto-redirect':false,
        headers:{'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          Accept:'text/html','Accept-Language':'en-US,en;q=0.9','Cache-Control':'no-cache',Connection:'close'}
      }, (error,res,data) => resolve({error:!!error,status:res && res.status,data}));
    });
    const result = CFYouTubePremium.classify(response);
    return result.status === 'available' ? result.region : null;
  }
  async function run() {
    const options = groups().groups[group] || [];
    if (!options.includes(fallback)) throw Error('fallback missing');
    const now = Date.now(), net = networkKey(), previous = read();
    // The first event to acquire the lease owns the run. A new network supersedes the old owner.
    if (previous.network === net && previous.owner && previous.until > now) return;
    const old = selected(groups());
    const state = {network:net,owner,until:now+125000};
    if (!write(state)) throw Error('store unavailable');
    const current = () => read().owner === owner && networkKey() === net && Date.now() < state.until;
    try {
      // A persisted selection can outlive a network change, sleep or a subscription refresh.
      if (!$surge.setSelectGroupPolicy(group,fallback) || selected(groups()) !== fallback) throw Error('fallback selection failed');
      const list = await api('/v1/policies',{include_external:true});
      const nodes = ((list || {})['external-policies'] || []).filter(p => p.group === pool &&
        p.name !== 'DIRECT' && options.includes(p.name) && /^POLICY::/.test(p.identifier));
      const preferred = nodes.find(p => p.name === old || (old === fallback && p.name === previous.last));
      const ordered = preferred ? [preferred,...nodes.filter(p => p !== preferred)] : nodes;
      for (const node of ordered) {
        if (!current()) return;
        const region = await probe(node);
        if (!region || !current() || await probe(node) !== region || !current()) continue;
        if (!(groups().groups[group] || []).includes(node.name)) continue;
        if (!$surge.setSelectGroupPolicy(group,node.name) || selected(groups()) !== node.name) throw Error('node selection failed');
        write({network:net,last:node.name,checked:Date.now(),region});
        console.log('Premium confirmed · ' + node.name + ' · ' + region);
        return;
      }
      console.log('No confirmed Premium offer in this pool');
    } finally {
      if (read().owner === owner) write({network:net,last:previous.last || ''});
    }
  }
  try { await run(); } catch (_) { console.log('Premium recheck could not be completed'); }
  $done({});
})();
