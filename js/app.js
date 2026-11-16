/* Colecionador de Comandos e Arquivos — guarda os comandos (Termux, PC, adb, Replit…) e os arquivos
   (.py, .sh…) com a explicação de cada um. Copia num toque, passa de um aparelho para o outro por
   QR Code, e cria o arquivo direto no Termux ou no PC sem precisar baixar (o antivírus não apaga).
   Os itens do Claude vêm no pacote-claude.js e se atualizam sozinhos; os seus ficam do seu jeito. */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const CHAVE = 'colecionador:v1';
  const ONDE = { termux: '📱 Termux (celular)', pc: '💻 PC (PowerShell)', adb: '🔌 adb / scrcpy (PC + celular)', replit: '☁ Replit (Shell)', qualquer: '🌐 Qualquer lugar' };
  const ONDE_CURTO = { termux: '📱 Termux', pc: '💻 PC', adb: '🔌 adb', replit: '☁ Replit', qualquer: '🌐 Qualquer' };
  let filtro = 'todos', aberto = null;

  // ---------- guardar ----------
  function ler() { try { return Object.assign({ itens: [], escondidos: [], favoritos: [] }, JSON.parse(localStorage.getItem(CHAVE) || '{}')); } catch { return { itens: [], escondidos: [], favoritos: [] }; } }
  function gravar(d) { try { localStorage.setItem(CHAVE, JSON.stringify(d)); return true; } catch { aviso('⚠ Não consegui guardar (memória do navegador cheia?)'); return false; } }
  let D = ler();
  // o pacote do Claude: entra o que é novo, atualiza o que você não editou
  (function semear() {
    const P = (window.PACOTE_CLAUDE && window.PACOTE_CLAUDE.itens) || []; let mudou = false;
    P.forEach((p) => {
      const i = D.itens.findIndex((x) => x.id === p.id);
      if (i < 0) { D.itens.push(Object.assign({}, p)); mudou = true; }
      else if (!D.itens[i].editado && (D.itens[i].v || 0) < (p.v || 0)) { D.itens[i] = Object.assign({}, p); mudou = true; }
    });
    if (mudou) gravar(D);
  })();

  // ---------- aviso e copiar ----------
  let tAviso = 0;
  function aviso(t) { let a = $('.aviso'); if (!a) { a = document.createElement('div'); a.className = 'aviso'; document.body.appendChild(a); } a.textContent = t; a.hidden = false; clearTimeout(tAviso); tAviso = setTimeout(() => (a.hidden = true), 2600); }
  async function copiar(t) {
    try { await navigator.clipboard.writeText(t); aviso('📋 Copiado! Agora é só colar.'); }
    catch { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); aviso('📋 Copiado!'); } catch { aviso('⚠ Não consegui copiar.'); } ta.remove(); }
  }
  function baixar(nome, texto, tipo) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([texto], { type: tipo || 'text/plain;charset=utf-8' })); a.download = nome;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  // criar o arquivo direto pelo terminal (sem baixar: o antivírus e o Downloads não atrapalham)
  const fimSeguro = (c) => { let m = 'FIM_DO_ARQUIVO'; while (c.includes(m)) m += '_X'; return m; };
  const cmdTermux = (a) => { const m = fimSeguro(a.conteudo); return "cat > '" + a.nome.replace(/'/g, '') + "' <<'" + m + "'\n" + a.conteudo.replace(/\n?$/, '\n') + m; };
  const cmdPS = (a) => "@'\n" + a.conteudo.replace(/\r/g, '').replace(/\n'@/g, "\n '@") + "\n'@ | Set-Content -Encoding utf8 '" + a.nome.replace(/'/g, '') + "'";

  // ---------- lista ----------
  function visiveis() {
    const q = $('#busca').value.trim().toLowerCase();
    return D.itens.filter((i) => !D.escondidos.includes(i.id))
      .filter((i) => filtro === 'todos' || (filtro === 'fav' ? D.favoritos.includes(i.id) : filtro === 'arquivos' ? !!i.arquivo : filtro === 'faxina' ? (i.tags || []).includes('faxina') : filtro === 'meus' ? i.origem !== 'claude' : i.onde === filtro))
      .filter((i) => !q || JSON.stringify([i.titulo, i.explica, i.tags, i.passos, i.arquivo && i.arquivo.nome]).toLowerCase().includes(q))
      .sort((a, b) => (D.favoritos.includes(b.id) - D.favoritos.includes(a.id)) || a.titulo.localeCompare(b.titulo, 'pt'));
  }
  function pintarFiltros() {
    const f = [['todos', 'Todos'], ['faxina', '🧹 Faxina'], ['fav', '⭐ Favoritos'], ['termux', '📱 Termux'], ['pc', '💻 PC'], ['adb', '🔌 adb'], ['replit', '☁ Replit'], ['arquivos', '📄 Arquivos'], ['meus', '✍ Meus']];
    $('#filtros').innerHTML = f.map(([k, n]) => '<button class="filtro' + (filtro === k ? ' on' : '') + '" data-f="' + k + '">' + n + '</button>').join('');
  }
  function htmlItem(i) {
    const fav = D.favoritos.includes(i.id), ab = aberto === i.id;
    let h = '<div class="item' + (i.perigo ? ' perigo' : '') + '" data-id="' + esc(i.id) + '"><div class="cab" data-a="abrir"><span>' + (i.arquivo ? '📄' : i.passos.some((p) => p.cmd) ? '⌨️' : '📝') + '</span><div class="t"><b>' + esc(i.titulo) + '</b>' +
      (ab ? '' : '<span class="mu">' + esc((i.explica || '').slice(0, 90)) + ((i.explica || '').length > 90 ? '…' : '') + '</span>') + '</div><span class="onde">' + (ONDE_CURTO[i.onde] || '') + '</span></div>';
    if (ab) {
      h += '<div class="corpo"><p>' + esc(i.explica) + '</p>' + (i.cuidado ? '<div class="cuidado">⚠ ' + esc(i.cuidado) + '</div>' : '') +
        '<p class="mu">Onde rodar: <b>' + (ONDE[i.onde] || '') + '</b></p>';
      i.passos.forEach((p, k) => {
        h += '<div class="passo"><p>' + (i.passos.length > 1 ? '<b>' + (k + 1) + '.</b> ' : '') + esc(p.txt) + '</p>' +
          (p.cmd ? '<div class="cmd"><code>' + esc(p.cmd) + '</code><button class="bt mini" data-a="copiar" data-k="' + k + '" title="Copiar">📋</button><button class="bt mini" data-a="qr" data-k="' + k + '" title="QR Code">🔳</button></div>' : '') + '</div>';
      });
      if (i.arquivo) {
        h += '<div class="passo"><p><b>📄 ' + esc(i.arquivo.nome) + '</b> <span class="mu">(' + Math.round(i.arquivo.conteudo.length / 1024 * 10) / 10 + ' KB)</span></p>' +
          '<div class="linha"><button class="bt" data-a="termux">📱 Criar pelo Termux</button><button class="bt" data-a="ps">💻 Criar pelo PC</button><button class="bt" data-a="baixar">⬇ Baixar</button><button class="bt" data-a="ver">👁 Ver</button></div>' +
          '<p class="mu">📱/💻 <b>Criar pelo…</b> copia um comando: cole no Termux (ou no PowerShell) e aperte Enter. O arquivo nasce ali mesmo, na pasta onde você está, sem baixar nada.</p></div>';
      }
      h += (i.tags && i.tags.length ? '<p>' + i.tags.map((t) => '<span class="tag">#' + esc(t) + '</span>').join('') + '</p>' : '') +
        '<div class="linha"><button class="bt mini" data-a="fav">' + (fav ? '★ Favorito' : '☆ Favoritar') + '</button><button class="bt mini" data-a="editar">✏️ Editar</button><button class="bt mini" data-a="passar">🔳 Passar para outro aparelho</button><button class="bt mini" data-a="apagar">🗑</button>' +
        (i.origem === 'claude' ? '<span class="mu">do Claude' + (i.editado ? ' · editado por você' : '') + '</span>' : '<span class="mu">seu</span>') + '</div></div>';
    }
    return h + '</div>';
  }
  function pintar() {
    pintarFiltros();
    const l = visiveis();
    $('#lista').innerHTML = l.map(htmlItem).join('');
    $('#vazio').hidden = l.length > 0;
  }

  // ---------- janela ----------
  function modal(html, depois) { $('#caixa').innerHTML = html; $('#modal').hidden = false; if (depois) depois($('#caixa')); }
  function fechar() { $('#modal').hidden = true; $('#caixa').innerHTML = ''; pararCamera(); }
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.closest('[data-fechar]')) fechar(); });

  // ---------- QR Code ----------
  function carregar(src) { return new Promise((ok, erro) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = () => erro(new Error('precisa de internet na primeira vez')); document.head.appendChild(s); }); }
  // 🔳 QR Code. Texto grande (código inteiro) vira QR EM SEQUÊNCIA: "1 de 5, 2 de 5…" — o 📷 do Colecionador junta tudo sozinho.
  const PEDACO = 1100; // letras por QR (cabe bem e a câmera do celular lê fácil)
  async function compactar(t) {
    try { const cs = new CompressionStream('deflate-raw'); const b = await new Response(new Blob([t]).stream().pipeThrough(cs)).arrayBuffer(); const u = new Uint8Array(b); let x = ''; for (let i = 0; i < u.length; i += 0x8000) x += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return 'z' + btoa(x); }
    catch (e) { return 't' + btoa(unescape(encodeURIComponent(t))); }
  }
  async function descompactar(s) {
    const bin = atob(s.slice(1)); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    if (s[0] === 't') return new TextDecoder().decode(u);
    const ds = new DecompressionStream('deflate-raw'); return await new Response(new Blob([u]).stream().pipeThrough(ds)).text();
  }
  async function desenharQR(caixa, texto) {
    if (!window.QRCode) await carregar('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js');
    caixa.innerHTML = ''; new window.QRCode(caixa, { text: texto, width: 300, height: 300, correctLevel: window.QRCode.CorrectLevel.L });
  }
  async function mostrarQR(texto, titulo) {
    if (texto.length <= 1800) {
      modal('<h2>🔳 ' + esc(titulo || 'QR Code') + '</h2><p class="mu">Aponte a câmera do outro aparelho (ou o 📷 do Colecionador dele) para este quadrado.</p><div id="qr"></div><div class="linha"><button class="bt p" data-fechar>Fechar</button></div>');
      try { await desenharQR($('#qr'), texto); } catch (e) { $('#qr').textContent = '⚠ Não consegui fazer o QR: ' + e.message; }
      return;
    }
    const z = await compactar(texto);
    const id = Math.random().toString(36).slice(2, 7);
    const partes = []; for (let i = 0; i < z.length; i += PEDACO) partes.push(z.slice(i, i + PEDACO));
    const n = partes.length; let atual = 0, auto = null;
    modal('<h2>🔳 ' + esc(titulo || 'QR em sequência') + '</h2><p class="mu">Grande para 1 QR: virou <b>' + n + ' QR Codes</b> (' + texto.length + ' letras, compactado). No outro aparelho: 📷 → aponte e vá passando; ele junta sozinho, em qualquer ordem.</p>' +
      '<div id="qr"></div><p id="qr-n" style="text-align:center;font-weight:700;font-size:20px"></p>' +
      '<div class="linha" style="justify-content:center"><button class="bt" id="qr-ant">◀</button><button class="bt p" id="qr-auto">▶ Passar sozinho</button><button class="bt" id="qr-prox">▶</button></div>' +
      '<div class="linha"><button class="bt" data-fechar>Fechar</button></div>', (w) => {
      const mostrar = async () => { $('#qr-n', w).textContent = (atual + 1) + ' de ' + n; try { await desenharQR($('#qr', w), 'CQR1|' + id + '|' + (atual + 1) + '|' + n + '|' + partes[atual]); } catch (e) { $('#qr', w).textContent = '⚠ ' + e.message; } };
      $('#qr-ant', w).onclick = () => { atual = (atual - 1 + n) % n; mostrar(); };
      $('#qr-prox', w).onclick = () => { atual = (atual + 1) % n; mostrar(); };
      $('#qr-auto', w).onclick = (e) => { if (auto) { clearInterval(auto); auto = null; e.target.textContent = '▶ Passar sozinho'; return; } auto = setInterval(() => { if (!document.body.contains(w) || $('#modal').hidden) { clearInterval(auto); return; } atual = (atual + 1) % n; mostrar(); }, 1600); e.target.textContent = '⏸ Parar'; };
      mostrar();
    });
  }
  // 🔳 qualquer texto ou código → QR (um só ou em sequência)
  function textoParaQR() {
    modal('<h2>🔳 Transformar em QR Code</h2><p class="mu">Cole um comando, um código inteiro ou qualquer texto (ou abra um arquivo). Se for grande, vira vários QR em sequência.</p>' +
      '<textarea id="tq-txt" style="min-height:180px" placeholder="Cole aqui…"></textarea><input type="file" id="tq-arq" hidden>' +
      '<div class="linha"><button class="bt" id="tq-abrir">📂 Abrir arquivo</button><button class="bt p" id="tq-ir">🔳 Fazer o QR</button><button class="bt" data-fechar>Fechar</button></div><p id="tq-st" class="mu"></p>', (w) => {
      $('#tq-abrir', w).onclick = () => $('#tq-arq', w).click();
      $('#tq-arq', w).onchange = async (e) => { const f = e.target.files[0]; if (f) { $('#tq-txt', w).value = await f.text(); $('#tq-st', w).textContent = f.name + ' · ' + f.size + ' bytes'; } };
      $('#tq-ir', w).onclick = () => { const t = $('#tq-txt', w).value; if (!t.trim()) return; if (t.length > 60000) { $('#tq-st', w).textContent = '⚠ Grande demais para QR (dá muitos quadrados). Para isso use ⬇ Baixar ou ⇅ Exportar.'; return; } mostrarQR(t, 'Seu texto'); };
    });
  }
  let fluxo = null, rodando = false;
  function pararCamera() { rodando = false; if (fluxo) { fluxo.getTracks().forEach((t) => t.stop()); fluxo = null; } }
  async function lerQR() {
    modal('<h2>📷 Ler QR Code</h2><p class="mu">Aponte para o QR Code de um comando ou de um item do Colecionador.</p><video id="cam" playsinline muted></video><p id="cam-st" class="mu"></p><div class="linha"><label class="bt">🖼 Ler de um print<input type="file" id="cam-img" accept="image/*" multiple hidden></label><button class="bt" data-fechar>Fechar</button></div>');
    $('#cam-img').onchange = async (e) => { for (const f of e.target.files) { try { const t = await lerDeImagem(f); if (!t) { $('#cam-st').textContent = '⚠ Não achei QR em ' + f.name; continue; } if (await juntar(t)) continue; pararCamera(); return recebido(t); } catch (err) { $('#cam-st').textContent = '⚠ ' + err.message; } } };
    try {
      fluxo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const v = $('#cam'); v.srcObject = fluxo; await v.play(); rodando = true;
      let detectar;
      if ('BarcodeDetector' in window) { const bd = new window.BarcodeDetector({ formats: ['qr_code'] }); detectar = async () => { const r = await bd.detect(v); return r[0] && r[0].rawValue; }; }
      else {
        await carregar('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js'); const c = document.createElement('canvas'), g = c.getContext('2d', { willReadFrequently: true });
        detectar = async () => { c.width = v.videoWidth; c.height = v.videoHeight; if (!c.width) return null; g.drawImage(v, 0, 0); const img = g.getImageData(0, 0, c.width, c.height); const r = window.jsQR(img.data, c.width, c.height); return r && r.data; };
      }
      const laco = async () => { if (!rodando) return; try { const t = await detectar(); if (t) { if (await juntar(t)) { if (rodando) setTimeout(laco, 250); return; } pararCamera(); return recebido(t); } } catch {} setTimeout(laco, 300); };
      laco();
    } catch (e) { $('#cam-st').textContent = '⚠ Não consegui abrir a câmera: ' + e.message + '. Permita a câmera para este app.'; }
  }
  // QR em sequência: guarda cada pedaço até ter todos (em qualquer ordem)
  let seq = null;
  async function juntar(t) {
    const m = /^CQR1\|(\w+)\|(\d+)\|(\d+)\|([\s\S]*)$/.exec(t); if (!m) return false;
    const [, id, i, n] = m; if (!seq || seq.id !== id) seq = { id, n: +n, partes: {} };
    seq.partes[+i] = m[4];
    const tem = Object.keys(seq.partes).length;
    const st = $('#cam-st'); if (st) st.innerHTML = '✅ Li <b>' + tem + ' de ' + seq.n + '</b>. ' + (tem < seq.n ? 'Vá para o próximo QR…' : 'Juntando…');
    if (tem < seq.n) return true; // continua lendo
    pararCamera();
    const z = Array.from({ length: seq.n }, (_, k) => seq.partes[k + 1]).join(''); seq = null;
    try { recebido(await descompactar(z)); } catch (e) { modal('<h2>⚠ Não consegui juntar</h2><p>' + esc(e.message) + '</p><div class="linha"><button class="bt p" data-fechar>Fechar</button></div>'); }
    return true;
  }
  // 🖼 ler QR de um print/foto (sem câmera)
  async function lerDeImagem(f) {
    const img = await createImageBitmap(f);
    if ('BarcodeDetector' in window) { const r = await new window.BarcodeDetector({ formats: ['qr_code'] }).detect(img); if (r[0]) return r[0].rawValue; }
    await carregar('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js');
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const r = window.jsQR(g.getImageData(0, 0, c.width, c.height).data, c.width, c.height); return r && r.data;
  }
  function recebido(t) {
    let obj = null; try { obj = JSON.parse(t); } catch {}
    if (obj && (obj.colecionador || obj.itens)) return importarObj(obj);
    modal('<h2>📷 Li isto:</h2><div class="cmd"><code>' + esc(t) + '</code></div><div class="linha"><button class="bt p" id="r-copiar">📋 Copiar</button><button class="bt" id="r-guardar">💾 Guardar como comando novo</button><button class="bt" id="r-baixar">⬇ Baixar como arquivo</button><button class="bt" data-fechar>Fechar</button></div>', (w) => {
      $('#r-copiar', w).onclick = () => copiar(t);
      $('#r-baixar', w).onclick = async () => { const nome = (await new Promise((ok) => ok(prompt('Nome do arquivo:', /<html/i.test(t) ? 'codigo.html' : /^\s*(import|def |#!.*python)/m.test(t) ? 'codigo.py' : 'codigo.txt')))) || 'codigo.txt'; baixar(nome, t, 'text/plain'); };
      $('#r-guardar', w).onclick = () => editar({ id: '', titulo: 'Comando lido pelo QR', onde: 'qualquer', explica: '', passos: [{ txt: 'Rodar:', cmd: t }], tags: [] });
    });
  }

  // ---------- editar / novo ----------
  function editar(i) {
    const novo = !i || !i.id; i = i || { titulo: '', onde: 'termux', explica: '', passos: [], tags: [] };
    const passosTxt = (i.passos || []).map((p) => (p.txt ? '# ' + p.txt + '\n' : '') + (p.cmd || '')).join('\n').replace(/\n+$/, '');
    modal('<h2>' + (novo ? '＋ Novo' : '✏️ Editar') + '</h2>' +
      '<label class="cp">Nome (o que faz)</label><input id="e-titulo" value="' + esc(i.titulo) + '" placeholder="Ex.: Ligar a voz no celular">' +
      '<label class="cp">Onde roda</label><select id="e-onde">' + Object.entries(ONDE).map(([k, n]) => '<option value="' + k + '"' + (i.onde === k ? ' selected' : '') + '>' + n + '</option>').join('') + '</select>' +
      '<label class="cp">Explicação simples (para lembrar depois)</label><textarea id="e-explica" style="font-family:inherit;min-height:70px">' + esc(i.explica) + '</textarea>' +
      '<label class="cp">Comandos — um por linha. Linha começando com # vira a explicação do passo</label><textarea id="e-passos" placeholder="# Instalar a peça da voz:&#10;pip install edge-tts&#10;# Ligar:&#10;python voz-francisco.py">' + esc(passosTxt) + '</textarea>' +
      '<label class="cp">Cuidado (opcional)</label><input id="e-cuidado" value="' + esc(i.cuidado || '') + '">' +
      '<details' + (i.arquivo ? ' open' : '') + '><summary class="cp">📄 Guardar um arquivo junto (.py, .sh, .bat…)</summary><label class="cp">Nome do arquivo</label><input id="e-anome" value="' + esc(i.arquivo ? i.arquivo.nome : '') + '" placeholder="programa.py"><label class="cp">Conteúdo</label><textarea id="e-aconteudo">' + esc(i.arquivo ? i.arquivo.conteudo : '') + '</textarea><div class="linha"><button class="bt mini" id="e-abrir">⤒ Abrir um arquivo do aparelho</button><input type="file" id="e-arq" hidden></div></details>' +
      '<label class="cp">Etiquetas (separadas por vírgula)</label><input id="e-tags" value="' + esc((i.tags || []).join(', ')) + '" placeholder="voz, python">' +
      '<div class="linha"><button class="bt p" id="e-salvar">💾 Salvar</button><button class="bt" data-fechar>Cancelar</button></div>', (w) => {
      $('#e-abrir', w).onclick = () => $('#e-arq', w).click();
      $('#e-arq', w).onchange = async (ev) => { const f = ev.target.files[0]; if (!f) return; $('#e-anome', w).value = f.name; $('#e-aconteudo', w).value = await f.text(); };
      $('#e-salvar', w).onclick = () => {
        const passos = []; let txt = '';
        $('#e-passos', w).value.split('\n').forEach((l) => { if (/^\s*#/.test(l)) { if (txt) passos.push({ txt }); txt = l.replace(/^\s*#\s?/, ''); } else if (l.trim()) { passos.push(txt ? { txt, cmd: l } : { txt: '', cmd: l }); txt = ''; } });
        if (txt) passos.push({ txt });
        const r = Object.assign({}, i, {
          id: i.id || 'meu-' + Date.now().toString(36), titulo: $('#e-titulo', w).value.trim() || 'Sem nome', onde: $('#e-onde', w).value,
          explica: $('#e-explica', w).value.trim(), passos, cuidado: $('#e-cuidado', w).value.trim(), tags: $('#e-tags', w).value.split(',').map((t) => t.trim()).filter(Boolean),
        });
        const an = $('#e-anome', w).value.trim(), ac = $('#e-aconteudo', w).value; if (an && ac) r.arquivo = { nome: an, conteudo: ac }; else delete r.arquivo;
        if (!r.cuidado) delete r.cuidado;
        if (r.origem === 'claude') r.editado = true; else r.origem = 'meu';
        const k = D.itens.findIndex((x) => x.id === r.id); if (k >= 0) D.itens[k] = r; else D.itens.push(r);
        if (gravar(D)) { aberto = r.id; fechar(); pintar(); aviso('💾 Guardado.'); }
      };
    });
  }

  // ---------- exportar / importar ----------
  function pacote(itens) { return { colecionador: 1, quando: new Date().toISOString(), itens }; }
  function importarObj(obj) {
    const l = Array.isArray(obj.itens) ? obj.itens : []; let n = 0, a = 0;
    l.forEach((it) => {
      if (!it || !it.id || !it.titulo) return; it.passos = Array.isArray(it.passos) ? it.passos : [];
      const k = D.itens.findIndex((x) => x.id === it.id);
      if (k < 0) { D.itens.push(it); n++; } else if (!D.itens[k].editado || it.origem !== 'claude') { D.itens[k] = it; a++; }
      D.escondidos = D.escondidos.filter((x) => x !== it.id);
    });
    gravar(D); fechar(); pintar(); aviso('⤒ ' + n + ' novo(s) e ' + a + ' atualizado(s).');
  }
  function menu() {
    const meus = D.itens.filter((i) => i.origem !== 'claude' || i.editado);
    modal('<h2>⇅ Guardar e trazer</h2>' +
      '<p class="mu">Leve tudo para outro aparelho, guarde um backup, ou abra um pacote que o Claude fez para você.</p>' +
      '<div class="linha"><button class="bt p" id="m-imp">⤒ Abrir um pacote (.json)</button><input type="file" id="m-arq" accept=".json,application/json" hidden></div>' +
      '<div class="linha"><button class="bt" id="m-exp-todos">⤓ Baixar tudo (' + D.itens.length + ')</button><button class="bt" id="m-exp-meus">⤓ Baixar só os meus (' + meus.length + ')</button></div>' +
      '<div class="linha"><button class="bt" id="m-colar">📋 Colar um pacote copiado</button></div>' +
      (D.escondidos.length ? '<div class="linha"><button class="bt" id="m-volta">↺ Mostrar de novo os ' + D.escondidos.length + ' que escondi</button></div>' : '') +
      '<p class="mu">Os itens do Claude se atualizam sozinhos quando chega versão nova. Os que você editou ficam do seu jeito.</p>' +
      '<div class="linha"><button class="bt" data-fechar>Fechar</button></div>', (w) => {
      $('#m-imp', w).onclick = () => $('#m-arq', w).click();
      $('#m-arq', w).onchange = async (e) => { const f = e.target.files[0]; if (!f) return; try { importarObj(JSON.parse(await f.text())); } catch { aviso('⚠ Este arquivo não é um pacote do Colecionador.'); } };
      $('#m-exp-todos', w).onclick = () => baixar('colecionador-tudo.json', JSON.stringify(pacote(D.itens), null, 1), 'application/json');
      $('#m-exp-meus', w).onclick = () => baixar('colecionador-meus.json', JSON.stringify(pacote(meus), null, 1), 'application/json');
      $('#m-colar', w).onclick = () => modal('<h2>📋 Colar pacote</h2><textarea id="c-txt" placeholder="Cole aqui o pacote (começa com {)"></textarea><div class="linha"><button class="bt p" id="c-ok">Trazer</button><button class="bt" data-fechar>Cancelar</button></div>', (w2) => {
        $('#c-ok', w2).onclick = () => { try { importarObj(JSON.parse($('#c-txt', w2).value)); } catch { aviso('⚠ Não reconheci o pacote.'); } };
      });
      const v = $('#m-volta', w); if (v) v.onclick = () => { D.escondidos = []; gravar(D); fechar(); pintar(); };
    });
  }

  // ---------- cliques ----------
  $('#filtros').addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (b) { filtro = b.dataset.f; pintar(); } });
  $('#busca').addEventListener('input', pintar);
  $('#bt-novo').onclick = () => editar(null);
  $('#bt-ler').onclick = lerQR;
  $('#bt-qr').onclick = textoParaQR;
  $('#bt-menu').onclick = menu;
  $('#lista').addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const el = b.closest('[data-id]'), i = D.itens.find((x) => x.id === el.dataset.id); if (!i) return;
    const a = b.dataset.a, p = b.dataset.k != null ? i.passos[+b.dataset.k] : null;
    if (a === 'abrir') { aberto = aberto === i.id ? null : i.id; pintar(); if (aberto) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30); }
    if (a === 'copiar' && p) copiar(p.cmd);
    if (a === 'qr' && p) mostrarQR(p.cmd, i.titulo);
    if (a === 'termux') copiar(cmdTermux(i.arquivo)).then(() => aviso('📋 Copiado! Cole no Termux e aperte Enter: o ' + i.arquivo.nome + ' nasce na pasta atual.'));
    if (a === 'ps') copiar(cmdPS(i.arquivo)).then(() => aviso('📋 Copiado! Cole no PowerShell e aperte Enter: o ' + i.arquivo.nome + ' nasce na pasta atual.'));
    if (a === 'baixar') baixar(i.arquivo.nome, i.arquivo.conteudo);
    if (a === 'ver') modal('<h2>📄 ' + esc(i.arquivo.nome) + '</h2><div class="cmd"><code>' + esc(i.arquivo.conteudo) + '</code></div><div class="linha"><button class="bt p" id="v-copiar">📋 Copiar o conteúdo</button><button class="bt" data-fechar>Fechar</button></div>', (w) => { $('#v-copiar', w).onclick = () => copiar(i.arquivo.conteudo); });
    if (a === 'fav') { D.favoritos = D.favoritos.includes(i.id) ? D.favoritos.filter((x) => x !== i.id) : D.favoritos.concat(i.id); gravar(D); pintar(); }
    if (a === 'editar') editar(i);
    if (a === 'passar') { const t = JSON.stringify(pacote([i])); if (t.length <= 60000) mostrarQR(t, 'Passar "' + i.titulo + '"'); else { baixar('colecionador-' + i.id + '.json', t, 'application/json'); aviso('Grande demais para QR: baixei o arquivo. Abra no outro aparelho em ⇅ → Abrir um pacote.'); } }
    if (a === 'apagar') {
      if (i.origem === 'claude') { if (confirm('Esconder "' + i.titulo + '"? (Dá para mostrar de novo em ⇅)')) { D.escondidos.push(i.id); gravar(D); aberto = null; pintar(); } }
      else if (confirm('Apagar "' + i.titulo + '"? Não dá para desfazer.')) { D.itens = D.itens.filter((x) => x !== i); gravar(D); aberto = null; pintar(); }
    }
  });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
  window.__colecionador = { D: () => D, cmdTermux, cmdPS };
  pintar();
})();
