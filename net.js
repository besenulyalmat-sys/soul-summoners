'use strict';
/* ============ Сеть: комнаты по ссылке ============
   Хозяин комнаты ведёт игру у себя и рассылает состояние, гость присылает свои ходы.
   Связь — PeerJS (WebRTC, бесплатный публичный сервер). ?local в адресе — тест в двух вкладках одного браузера. */
const Net = (() => {
  const N = { role: null, code: null, status: 'off', peer: null, conn: null, bc: null, onData: () => { }, onStatus: () => { } };
  const LOCAL = location.search.includes('local');
  const setStatus = s => { N.status = s; N.onStatus(s); };
  N.genCode = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
  N.link = code => location.origin + location.pathname + (LOCAL ? '?local' : '') + '#room-' + code;
  N.send = m => {
    try {
      if (LOCAL) { if (N.bc) N.bc.postMessage({ from: N.role, m }); }
      else if (N.conn && N.conn.open) N.conn.send(m);
    } catch (e) { console.warn('send', e); }
  };
  const hasPeer = () => typeof Peer !== 'undefined';
  function localChannel() {
    N.bc = new BroadcastChannel('bpd-' + N.code);
    N.bc.onmessage = e => { const d = e.data; if (!d || d.from === N.role) return; if (N.status !== 'connected') setStatus('connected'); N.onData(d.m); };
  }
  N.host = code => {
    N.role = 'host'; N.code = code;
    if (LOCAL) { localChannel(); setStatus('waiting'); return; }
    if (!hasPeer()) return setStatus('nolib');
    setStatus('starting');
    const start = () => {
      N.peer = new Peer('bpd-' + code, { debug: 1 });
      N.peer.on('open', () => setStatus(N.conn && N.conn.open ? 'connected' : 'waiting'));
      N.peer.on('connection', c => {
        if (N.conn && N.conn !== c) try { N.conn.close(); } catch (e) { }
        N.conn = c;
        c.on('open', () => setStatus('connected'));
        c.on('data', d => N.onData(d));
        c.on('close', () => { if (N.conn === c) setStatus('lost'); });
        c.on('error', () => { if (N.conn === c) setStatus('lost'); });
      });
      N.peer.on('disconnected', () => { try { N.peer.reconnect(); } catch (e) { } });
      N.peer.on('error', e => {
        if (e.type === 'unavailable-id') { setStatus('retry'); try { N.peer.destroy(); } catch (x) { } setTimeout(start, 4000); }
        else if (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error') { setStatus('neterr'); setTimeout(() => { try { N.peer.reconnect(); } catch (x) { } }, 3000); }
        else console.warn('peer', e.type, e);
      });
    };
    start();
  };
  N.join = (code, hello) => {
    N.role = 'guest'; N.code = code; N.hello = hello;
    if (LOCAL) { localChannel(); setStatus('connecting'); const ping = () => { if (N.status !== 'connected') { N.send(N.hello); setTimeout(ping, 1000); } }; ping(); return; }
    if (!hasPeer()) return setStatus('nolib');
    setStatus('connecting');
    N.peer = new Peer({ debug: 1 });
    const connect = () => {
      if (N.conn && N.conn.open) return;
      const c = N.peer.connect('bpd-' + code, { reliable: true });
      N.conn = c;
      c.on('open', () => { setStatus('connected'); N.send(N.hello); });
      c.on('data', d => N.onData(d));
      c.on('close', () => { if (N.conn === c) { setStatus('lost'); setTimeout(connect, 2500); } });
      c.on('error', () => { });
    };
    N.reconnect = connect;
    N.peer.on('open', connect);
    N.peer.on('disconnected', () => { try { N.peer.reconnect(); } catch (e) { } });
    N.peer.on('error', e => {
      if (e.type === 'peer-unavailable') { setStatus('nohost'); setTimeout(connect, 3000); }
      else if (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error') { setStatus('neterr'); setTimeout(() => { try { N.peer.reconnect(); } catch (x) { } }, 3000); }
      else console.warn('peer', e.type, e);
    });
  };
  N.leave = () => { try { if (N.conn) N.conn.close(); } catch (e) { } try { if (N.peer) N.peer.destroy(); } catch (e) { } try { if (N.bc) N.bc.close(); } catch (e) { } Object.assign(N, { role: null, code: null, peer: null, conn: null, bc: null }); setStatus('off'); };
  N.STATUS = { off: '', starting: 'запускаю комнату…', waiting: 'ждём друга…', connecting: 'подключаюсь…', connected: 'соперник на связи', lost: 'связь потеряна — переподключаюсь…', retry: 'комната занята, пробую снова…', nohost: 'хозяин комнаты не в сети — жду…', neterr: 'нет связи с сервером — повторяю…', nolib: 'не загрузился модуль связи (нужен интернет)' };
  return N;
})();
