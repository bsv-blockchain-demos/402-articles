export function doublePageHtml() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Teranode Double-Spend Test</title>
  <meta name="color-scheme" content="dark">
  <style>
    :root { --bg:#1a1a1a; --panel:#222; --border:#333; --text:#e8e6e1; --muted:#888; --accent:#b76b3a; }
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:var(--bg);color:var(--text);padding:32px 16px;max-width:960px;margin:0 auto;line-height:1.5}
    header.top{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px;flex-wrap:wrap}
    h1{letter-spacing:-0.02em;font-size:1.6rem}
    .net{display:inline-flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;font-family:ui-monospace,monospace;font-size:0.85rem;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;background:#252525;color:var(--muted);border:1px solid var(--border)}
    .net.main{background:rgba(58,138,58,0.15);color:#7fcf7f;border-color:#3a8a3a}
    .net.test{background:rgba(183,138,58,0.15);color:#e0b060;border-color:#b78a3a}
    .net .dot{width:8px;height:8px;border-radius:50%;background:currentColor}
    p.lead{color:var(--muted);margin-bottom:24px}
    .row{display:flex;gap:12px;margin-bottom:10px;align-items:center}
    .row label{flex:0 0 110px;font-size:0.85rem;color:var(--muted)}
    input[type=text]{flex:1;padding:8px 10px;background:#2a2a28;border:1px solid #444;color:inherit;border-radius:4px;font-family:ui-monospace,monospace;font-size:0.85rem}
    button{margin-top:10px;padding:10px 18px;background:var(--accent);color:white;border:0;border-radius:4px;cursor:pointer;font-weight:600;font-size:0.95rem}
    button:disabled{opacity:0.5;cursor:not-allowed}
    .results{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px}
    .panel{background:var(--panel);border:1px solid var(--border);border-radius:6px;padding:16px}
    .panel h3{margin:0 0 10px;font-size:0.95rem;letter-spacing:0.01em}
    .kv{font-size:0.78rem;margin-bottom:6px;color:var(--muted)}
    .mono{font-family:ui-monospace,monospace;font-size:0.78rem;word-break:break-all;color:#ccc}
    .status{margin-top:10px;padding:8px 10px;border-radius:4px;font-size:0.82rem;font-family:ui-monospace,monospace}
    .status.ok{background:#1e3a1e;color:#7fcf7f}
    .status.err{background:#3a1e1e;color:#ff8888}
    .status.idle{background:#252525;color:var(--muted)}
    .log{margin-top:8px;font-family:ui-monospace,monospace;font-size:0.72rem;white-space:pre-wrap;word-break:break-all;color:#999;max-height:160px;overflow:auto}
    .pending{margin-top:24px}
    .pending h2{font-size:1rem;margin-bottom:10px;letter-spacing:-0.01em}
    .pending-row{display:flex;align-items:center;gap:10px;padding:8px 10px;background:#222;border:1px solid var(--border);border-radius:4px;margin-bottom:6px;font-family:ui-monospace,monospace;font-size:0.75rem}
    .pending-row .txid{flex:1;word-break:break-all;color:#ccc}
    .pending-row .net-tag{padding:2px 8px;border-radius:999px;background:#2a2a28;color:var(--muted);font-size:0.65rem;text-transform:uppercase;letter-spacing:0.05em}
    .pending-row .st{padding:2px 8px;border-radius:999px;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.05em}
    .pending-row .st.pending{background:#3a2f1e;color:#e0b060}
    .pending-row .st.signed{background:#1e3a1e;color:#7fcf7f}
    .pending-row .st.superseded{background:#2a2a28;color:#888}
    .pending-row .st.error{background:#3a1e1e;color:#ff8888}
    .pending-empty{font-size:0.78rem;color:var(--muted)}
    @media (max-width:640px){.results{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <header class="top">
    <h1>Teranode Double-Spend Test</h1>
    <div class="net" id="netBadge"><span class="dot"></span><span id="netLabel">connecting...</span></div>
  </header>
  <p class="lead">Builds one funded tx via BRC-100 wallet (<code>noSend:true</code>, single 0-sat OP_FALSE OP_RETURN output), then malleates input 0 signature (ECDSA s-flip) to produce a twin spending the same UTXO. Both broadcast to separate Teranode propagation endpoints.</p>

  <div class="row"><label>Endpoint A</label><input id="urlA" type="text" placeholder="https://node-a.example/api/v1/tx" /></div>
  <div class="row"><label>Endpoint B</label><input id="urlB" type="text" placeholder="https://node-b.example/api/v1/tx" /></div>

  <button id="run">Create &amp; broadcast double-spend</button>

  <section class="pending">
    <h2>Pending lookups</h2>
    <div id="pending"><div class="pending-empty">none</div></div>
  </section>

  <div class="results">
    <div class="panel">
      <h3>Endpoint A &mdash; original tx</h3>
      <div class="kv">txid</div>
      <div class="mono" id="txidA">&mdash;</div>
      <div class="kv" style="margin-top:8px">input 0 unlocking script</div>
      <div class="mono" id="unlockA">&mdash;</div>
      <div class="status idle" id="statusA">idle</div>
      <div class="log" id="logA"></div>
    </div>
    <div class="panel">
      <h3>Endpoint B &mdash; malleated twin</h3>
      <div class="kv">txid</div>
      <div class="mono" id="txidB">&mdash;</div>
      <div class="kv" style="margin-top:8px">input 0 unlocking script</div>
      <div class="mono" id="unlockB">&mdash;</div>
      <div class="status idle" id="statusB">idle</div>
      <div class="log" id="logB"></div>
    </div>
  </div>

  <script type="module">
    import { WalletClient, Transaction, Script, Utils, OP } from 'https://esm.sh/@bsv/sdk@2.0.13'

    const LS_KEY_A = 'teranode.endpointA'
    const LS_KEY_B = 'teranode.endpointB'
    const LS_KEY_PENDING = 'teranode.pendingTxids'
    const POLL_INTERVAL_MS = 15000

    const wallet = new WalletClient()
    let walletNetwork = 'mainnet'

    function hex(bytes){ return [...bytes].map(b => b.toString(16).padStart(2,'0')).join('') }

    function setStatus(label, cls, text){
      const el = document.getElementById('status' + label)
      el.className = 'status ' + cls
      el.textContent = text
    }
    function setLog(label, text){ document.getElementById('log' + label).textContent = text }

    async function postRaw(url, bytes, label){
      if (!url){ setStatus(label, 'err', 'no endpoint URL'); return }
      setStatus(label, 'idle', 'broadcasting...')
      try {
        const proxied = '/double/proxy?url=' + encodeURIComponent(url)
        const res = await fetch(proxied, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: bytes
        })
        const text = await res.text()
        setStatus(label, res.ok ? 'ok' : 'err', res.status + ' ' + res.statusText)
        setLog(label, text || '(empty body)')
      } catch (e){
        setStatus(label, 'err', 'fetch error')
        setLog(label, String(e))
      }
    }

    async function loadNetwork(){
      const badge = document.getElementById('netBadge')
      const label = document.getElementById('netLabel')
      try {
        const { network } = await wallet.getNetwork({})
        walletNetwork = network
        label.textContent = network
        badge.classList.add(network === 'mainnet' ? 'main' : 'test')
      } catch (e){
        label.textContent = 'no wallet'
        console.error(e)
      }
    }

    function loadPending(){
      try { return JSON.parse(localStorage.getItem(LS_KEY_PENDING) || '[]') } catch { return [] }
    }
    function savePending(list){ localStorage.setItem(LS_KEY_PENDING, JSON.stringify(list)) }
    function addPending(txid, network, reference, unlockHex){
      const list = loadPending()
      if (list.find(e => e.txid === txid)) return
      list.push({ txid, network, reference, unlockHex, addedAt: Date.now(), status: 'pending' })
      savePending(list)
      renderPending()
    }
    function updatePending(txid, patch){
      const list = loadPending()
      const i = list.findIndex(e => e.txid === txid)
      if (i < 0) return
      list[i] = { ...list[i], ...patch }
      savePending(list)
      renderPending()
    }

    function renderPending(){
      const el = document.getElementById('pending')
      const list = loadPending()
      if (!list.length){ el.innerHTML = '<div class="pending-empty">none</div>'; return }
      el.innerHTML = list.map(e => {
        const safeTxid = (e.txid || '').replace(/[^a-f0-9]/gi, '')
        const safeNet = (e.network || '').replace(/[^a-z]/gi, '')
        const safeStatus = (e.status || 'pending').replace(/[^a-z]/gi, '')
        return '<div class="pending-row">' +
          '<span class="txid">' + safeTxid + '</span>' +
          '<span class="net-tag">' + safeNet + '</span>' +
          '<span class="st ' + safeStatus + '">' + safeStatus + '</span>' +
          '</div>'
      }).join('')
    }

    function hexToBytes(hex){
      const out = []
      for (let i = 0; i < hex.length; i += 2) out.push(parseInt(hex.slice(i, i+2), 16))
      return out
    }

    async function fetchWocBeef(txid, network){
      const seg = network === 'mainnet' ? 'main' : 'test'
      const url = 'https://api.whatsonchain.com/v1/bsv/' + seg + '/tx/' + txid + '/beef'
      const res = await fetch(url)
      if (res.status === 404) return null
      if (!res.ok) throw new Error('woc ' + res.status)
      const body = (await res.text()).trim()
      if (!body || /not[- ]?found/i.test(body)) return null
      return body.replace(/^"|"$/g, '')
    }

    async function pollPending(){
      const list = loadPending()
      const settledRefs = new Set(list.filter(e => e.status === 'signed').map(e => e.reference))
      for (const entry of list){
        if (entry.status === 'signed' || entry.status === 'superseded') continue
        if (settledRefs.has(entry.reference)){
          updatePending(entry.txid, { status: 'superseded' })
          continue
        }
        try {
          const hex = await fetchWocBeef(entry.txid, entry.network)
          if (!hex) continue
          await wallet.signAction({
            reference: entry.reference,
            spends: { 0: { unlockingScript: entry.unlockHex } },
            options: { noSend: false, acceptDelayedBroadcast: true }
          })
          updatePending(entry.txid, { status: 'signed' })
          settledRefs.add(entry.reference)
          for (const other of loadPending()){
            if (other.reference === entry.reference && other.txid !== entry.txid && other.status !== 'signed'){
              updatePending(other.txid, { status: 'superseded' })
            }
          }
        } catch (e){
          console.error('poll error', entry.txid, e)
          updatePending(entry.txid, { status: 'error' })
        }
      }
    }

    function loadEndpoints(){
      const a = localStorage.getItem(LS_KEY_A) || ''
      const b = localStorage.getItem(LS_KEY_B) || ''
      document.getElementById('urlA').value = a
      document.getElementById('urlB').value = b
    }

    function persistEndpoint(key, value){
      if (value) localStorage.setItem(key, value)
      else localStorage.removeItem(key)
    }

    async function run(){
      const btn = document.getElementById('run')
      btn.disabled = true
      try {
        const urlA = document.getElementById('urlA').value.trim()
        const urlB = document.getElementById('urlB').value.trim()
        persistEndpoint(LS_KEY_A, urlA)
        persistEndpoint(LS_KEY_B, urlB)

        const marker = Utils.toArray(new Date().toISOString(), 'utf8')
        const lockingScript = '006a08' + hex(marker)

        const action = await wallet.createAction({
          version: 3,
          description: 'Double-spend resilience test',
          outputs: [{
            lockingScript,
            satoshis: 0,
            outputDescription: 'double-spend marker'
          }],
          options: {
            noSend: true,
            randomizeOutputs: false,
            signAndProcess: false
          }
        })

        const signable = action.signableTransaction
        if (!signable) throw new Error('createAction did not return a signableTransaction')
        const reference = signable.reference

        const initialSign = await wallet.signAction({
          reference,
          spends: {},
          options: { noSend: true, acceptDelayedBroadcast: true }
        })
        if (!initialSign.tx) throw new Error('initial signAction returned no tx')

        const orig = Transaction.fromAtomicBEEF(initialSign.tx)
        const origInput = orig.inputs[0]
        const origUnlock = origInput.unlockingScript

        const modifiedScriptA = new Script()
        modifiedScriptA.writeBin(Utils.toArray(urlA, 'utf8'))
        modifiedScriptA.writeOpCode(OP.OP_DROP)
        modifiedScriptA.writeScript(origUnlock)
        const tx1 = new Transaction(orig.version, [], orig.outputs, orig.lockTime)
        tx1.addInput({
          sourceTransaction: origInput.sourceTransaction,
          sourceTXID: origInput.sourceTXID,
          sourceOutputIndex: origInput.sourceOutputIndex,
          sequence: origInput.sequence,
          unlockingScript: modifiedScriptA
        })
        for (let i = 1; i < orig.inputs.length; i++) {
          const ip = orig.inputs[i]
          tx1.addInput({
            sourceTransaction: ip.sourceTransaction,
            sourceTXID: ip.sourceTXID,
            sourceOutputIndex: ip.sourceOutputIndex,
            sequence: ip.sequence,
            unlockingScript: ip.unlockingScript
          })
        }
        const txid1 = tx1.id('hex')

        const modifiedScriptB = new Script()
        modifiedScriptB.writeBin(Utils.toArray(urlB, 'utf8'))
        modifiedScriptB.writeOpCode(OP.OP_DROP)
        modifiedScriptB.writeScript(origUnlock)
        const tx2 = new Transaction(orig.version, [], orig.outputs, orig.lockTime)
        tx2.addInput({
          sourceTransaction: origInput.sourceTransaction,
          sourceTXID: origInput.sourceTXID,
          sourceOutputIndex: origInput.sourceOutputIndex,
          sequence: origInput.sequence,
          unlockingScript: modifiedScriptB
        })
        for (let i = 1; i < orig.inputs.length; i++) {
          const ip = orig.inputs[i]
          tx2.addInput({
            sourceTransaction: ip.sourceTransaction,
            sourceTXID: ip.sourceTXID,
            sourceOutputIndex: ip.sourceOutputIndex,
            sequence: ip.sequence,
            unlockingScript: ip.unlockingScript
          })
        }
        const txid2 = tx2.id('hex')

        document.getElementById('txidA').textContent = txid1
        document.getElementById('txidB').textContent = txid2
        document.getElementById('unlockA').textContent = tx1.inputs[0].unlockingScript.toHex()
        document.getElementById('unlockB').textContent = tx2.inputs[0].unlockingScript.toHex()

        const unlockHexA = modifiedScriptA.toHex()
        const unlockHexB = modifiedScriptB.toHex()
        addPending(txid1, walletNetwork, reference, unlockHexA)
        addPending(txid2, walletNetwork, reference, unlockHexB)

        if (txid1 === txid2) throw new Error('malleation produced identical txid')

        const rawA = new Uint8Array(tx1.toBinary())
        const rawB = new Uint8Array(tx2.toBinary())

        await Promise.all([
          postRaw(urlA, rawA, 'A'),
          postRaw(urlB, rawB, 'B')
        ])
      } catch (e){
        alert(String(e))
        console.error(e)
      } finally {
        btn.disabled = false
      }
    }

    function bindPersist(id, key){
      const el = document.getElementById(id)
      el.addEventListener('change', () => persistEndpoint(key, el.value.trim()))
      el.addEventListener('blur', () => persistEndpoint(key, el.value.trim()))
    }

    loadEndpoints()
    bindPersist('urlA', LS_KEY_A)
    bindPersist('urlB', LS_KEY_B)
    renderPending()
    loadNetwork().then(() => { pollPending(); setInterval(pollPending, POLL_INTERVAL_MS) })
    document.getElementById('run').addEventListener('click', run)
  </script>
</body>
</html>`
}
