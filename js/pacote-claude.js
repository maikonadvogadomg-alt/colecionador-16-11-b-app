/* Colecionador — pacote do Claude (gerado). Vem atualizado a cada versão; o que você editou fica do seu jeito. */
window.PACOTE_CLAUDE = {
"versao": "16/11-A",
"itens": [
{
"id": "t-armazenamento",
"titulo": "Deixar o Termux ver os arquivos do celular",
"onde": "termux",
"explica": "O Termux fica num \"quarto fechado\" (sandbox) e, de começo, não enxerga a pasta Download. Este comando abre a porta. Faça uma vez só.",
"passos": [
{
"txt": "Rode e toque em PERMITIR no aviso que aparecer:",
"cmd": "termux-setup-storage"
}
],
"tags": [
"pasta",
"permissão"
],
"origem": "claude",
"v": 1
},
{
"id": "t-download",
"titulo": "Entrar na pasta Download do celular",
"onde": "termux",
"explica": "Leva o Termux até a pasta onde caem os arquivos que você baixa. Precisa ter feito o \"Deixar o Termux ver os arquivos\" antes.",
"passos": [
{
"txt": "Entrar na pasta:",
"cmd": "cd ~/storage/downloads"
},
{
"txt": "Ver o que tem nela:",
"cmd": "ls"
}
],
"tags": [
"pasta"
],
"origem": "claude",
"v": 1
},
{
"id": "t-atualizar",
"titulo": "Atualizar o Termux",
"onde": "termux",
"explica": "Bom fazer antes de instalar qualquer coisa. Se perguntar algo, aperte Enter.",
"passos": [
{
"txt": "Atualizar tudo:",
"cmd": "pkg update && pkg upgrade -y"
}
],
"tags": [],
"origem": "claude",
"v": 1
},
{
"id": "t-python",
"titulo": "Instalar o Python no Termux",
"onde": "termux",
"explica": "O Python é o \"cozinheiro\" que lê os arquivos .py (as \"receitas\"). Instale uma vez só.",
"passos": [
{
"txt": "Instalar:",
"cmd": "pkg install python"
}
],
"tags": [
"python"
],
"origem": "claude",
"v": 1
},
{
"id": "t-voz",
"titulo": "Ligar a voz Francisco no celular",
"onde": "termux",
"explica": "A voz grátis do jurídico antigo. O programinha precisa ficar aberto no Termux enquanto você usa a voz nos apps (⚙️ → Voz → 🗣 Francisco).",
"passos": [
{
"txt": "Uma vez só — instalar a peça da voz:",
"cmd": "pip install edge-tts"
},
{
"txt": "Uma vez só — criar o arquivo da voz (use o botão \"📱 Criar pelo Termux\" do item \"voz-francisco.py\") ou baixe ele para a pasta Download."
},
{
"txt": "Para o Android não desligar o Termux quando a tela apaga:",
"cmd": "termux-wake-lock"
},
{
"txt": "Ligar a voz (na pasta onde está o arquivo):",
"cmd": "python voz-francisco.py"
}
],
"tags": [
"voz",
"python"
],
"origem": "claude",
"v": 1,
"cuidado": "Se o pip der erro, rode antes: pkg install clang"
},
{
"id": "f-voz",
"titulo": "voz-francisco.py (o programinha da voz)",
"onde": "qualquer",
"explica": "O arquivo da voz Francisco. No PC, dê dois cliques nele (precisa do Python e do pip install edge-tts). No celular, crie pelo Termux com o botão abaixo.",
"passos": [],
"tags": [
"voz",
"arquivo"
],
"origem": "claude",
"v": 1,
"arquivo": {
"nome": "voz-francisco.py",
"conteudo": "#!/usr/bin/env python3\n# -*- coding: utf-8 -*-\n\"\"\"\n🗣 Voz Francisco — servidorzinho de voz GRÁTIS (a mesma voz do jurídico antigo).\n\nUsa o leitor de voz do Microsoft Edge (pacote edge-tts), que é grátis e não pede chave.\nOs seus apps (Assistente Jurídico, Meu Chat…) mandam o texto para cá e recebem o áudio.\n\nCOMO LIGAR\n  No celular (Termux), uma vez só:\n      pkg install python\n      pip install edge-tts\n  Depois, sempre que quiser a voz:\n      python voz-francisco.py\n\n  No computador (Windows), uma vez só: instale o Python (python.org, marque \"Add to PATH\") e rode\n      pip install edge-tts\n  Depois:\n      python voz-francisco.py\n\n  Deixe a janela aberta. No app: ⚙️ Config → Voz → \"Francisco (grátis)\" → 🧪 Testar.\n\nPrecisa de internet (a voz é feita no servidor da Microsoft). Só aceita pedidos deste aparelho.\n\"\"\"\nimport asyncio, json, sys, threading\nfrom http.server import ThreadingHTTPServer, BaseHTTPRequestHandler\nfrom urllib.parse import urlparse, parse_qs\n\nPORTA = 7790\nVOZ_PADRAO = \"pt-BR-FranciscoNeural\"\nRESERVAS = [\"pt-BR-AntonioNeural\", \"pt-BR-FranciscaNeural\", \"pt-BR-ThalitaNeural\"]\n\ntry:\n    import edge_tts\nexcept ImportError:\n    print(\"\\n⚠ Falta o pacote da voz. Rode antes:\\n    pip install edge-tts\\n\")\n    sys.exit(1)\n\n_vozes = None\n\n\nasync def _listar():\n    global _vozes\n    if _vozes is None:\n        todas = await edge_tts.list_voices()\n        _vozes = [v[\"ShortName\"] for v in todas if v.get(\"Locale\", \"\").startswith(\"pt-\")]\n    return _vozes\n\n\nasync def _falar(texto, voz, velocidade, tom):\n    tentativas = [voz] + [v for v in RESERVAS if v != voz]\n    ultimo = None\n    for v in tentativas:\n        try:\n            com = edge_tts.Communicate(texto, v, rate=velocidade, pitch=tom)\n            partes = []\n            async for pedaco in com.stream():\n                if pedaco[\"type\"] == \"audio\":\n                    partes.append(pedaco[\"data\"])\n            if partes:\n                return b\"\".join(partes), v\n        except Exception as e:  # voz que não existe, internet caiu…\n            ultimo = e\n    raise RuntimeError(\"não consegui gerar a voz: %s\" % ultimo)\n\n\nclass Voz(BaseHTTPRequestHandler):\n    def _cabecalhos(self, codigo, tipo):\n        self.send_response(codigo)\n        self.send_header(\"Content-Type\", tipo)\n        self.send_header(\"Access-Control-Allow-Origin\", \"*\")\n        self.send_header(\"Access-Control-Allow-Headers\", \"*\")\n        self.send_header(\"Access-Control-Allow-Methods\", \"GET, POST, OPTIONS\")\n        self.send_header(\"Access-Control-Allow-Private-Network\", \"true\")\n        self.send_header(\"Cache-Control\", \"no-store\")\n        self.end_headers()\n\n    def do_OPTIONS(self):\n        self._cabecalhos(204, \"text/plain\")\n\n    def _json(self, codigo, obj):\n        self._cabecalhos(codigo, \"application/json; charset=utf-8\")\n        self.wfile.write(json.dumps(obj, ensure_ascii=False).encode(\"utf-8\"))\n\n    def _pedido(self):\n        u = urlparse(self.path)\n        q = {k: v[0] for k, v in parse_qs(u.query).items()}\n        if self.command == \"POST\":\n            n = int(self.headers.get(\"Content-Length\") or 0)\n            if n:\n                try:\n                    q.update(json.loads(self.rfile.read(n).decode(\"utf-8\")))\n                except Exception:\n                    pass\n        return u.path, q\n\n    def do_GET(self):\n        self._tratar()\n\n    def do_POST(self):\n        self._tratar()\n\n    def _tratar(self):\n        caminho, q = self._pedido()\n        try:\n            if caminho in (\"/\", \"/ping\"):\n                return self._json(200, {\"ok\": True, \"app\": \"voz-francisco\", \"versao\": 1, \"voz\": VOZ_PADRAO})\n            if caminho == \"/vozes\":\n                return self._json(200, {\"vozes\": asyncio.run(_listar())})\n            if caminho == \"/falar\":\n                texto = (q.get(\"texto\") or \"\").strip()[:3000]\n                if not texto:\n                    return self._json(400, {\"erro\": \"sem texto\"})\n                audio, usada = asyncio.run(_falar(texto, q.get(\"voz\") or VOZ_PADRAO, q.get(\"velocidade\") or \"+15%\", q.get(\"tom\") or \"-5Hz\"))\n                self._cabecalhos(200, \"audio/mpeg\")\n                self.wfile.write(audio)\n                return\n            self._json(404, {\"erro\": \"não existe\"})\n        except Exception as e:\n            self._json(500, {\"erro\": str(e)})\n\n    def log_message(self, *a):\n        pass  # sem poluir a tela\n\n\nif __name__ == \"__main__\":\n    srv = ThreadingHTTPServer((\"127.0.0.1\", PORTA), Voz)\n    print(\"🗣 Voz Francisco ligada em http://127.0.0.1:%d\" % PORTA)\n    print(\"   Deixe esta janela aberta. Para desligar: Ctrl+C.\")\n    try:\n        srv.serve_forever()\n    except KeyboardInterrupt:\n        print(\"\\nDesligada.\")\n"
}
},
{
"id": "t-ollama",
"titulo": "Ollama no celular (só modelo pequeno)",
"onde": "termux",
"explica": "O celular só aguenta modelo pequeno. O gemma3:4b é o meio-termo; o gemma3:1b é o mais rápido.",
"passos": [
{
"txt": "Instalar (uma vez):",
"cmd": "pkg install ollama"
},
{
"txt": "Ligar:",
"cmd": "ollama serve &"
},
{
"txt": "Baixar o modelo médio:",
"cmd": "ollama pull gemma3:4b"
},
{
"txt": "Ou o mais rápido:",
"cmd": "ollama pull gemma3:1b"
}
],
"tags": [
"ollama",
"ia"
],
"origem": "claude",
"v": 1
},
{
"id": "t-ollama-limpar",
"titulo": "Apagar os modelos grandes do celular",
"onde": "termux",
"explica": "Libera espaço. Apaga TODOS os modelos do Ollama do celular (os do PC continuam).",
"passos": [
{
"txt": "Ver quais tem:",
"cmd": "ollama list"
},
{
"txt": "Apagar todos:",
"cmd": "ollama list | tail -n +2 | awk '{print $1}' | xargs -n1 ollama rm"
},
{
"txt": "Tirar o Ollama de vez (opcional):",
"cmd": "pkg uninstall ollama"
}
],
"tags": [
"ollama",
"limpeza"
],
"origem": "claude",
"v": 1,
"cuidado": "Apaga os modelos do celular. Depois baixe de novo só o que quiser.",
"perigo": true
},
{
"id": "t-diag",
"titulo": "Diagnóstico do celular",
"onde": "termux",
"explica": "Mostra armazenamento, memória, pastas grandes, arquivos enormes e apps importantes desligados (WebView, Google). Salva o relatório em Download/diagnostico-celular.txt.",
"passos": [
{
"txt": "Crie o arquivo diag.sh pelo botão \"📱 Criar pelo Termux\" do item \"diag.sh\" e depois rode:",
"cmd": "bash diag.sh"
}
],
"tags": [
"celular",
"diagnóstico"
],
"origem": "claude",
"v": 1
},
{
"id": "f-diag",
"titulo": "diag.sh (o script do diagnóstico)",
"onde": "termux",
"explica": "O script do diagnóstico do celular. Só lê: não apaga nada.",
"passos": [],
"tags": [
"celular",
"arquivo"
],
"origem": "claude",
"v": 1,
"arquivo": {
"nome": "diag.sh",
"conteudo": "#!/data/data/com.termux/files/usr/bin/bash\n# 🩺 Diagnóstico do celular (Termux) — só OLHA, não apaga nada.\nS=\"$HOME/storage/shared\"; R=\"$S/Download/diagnostico-celular.txt\"\n[ -d \"$S\" ] || { echo \"⚠ Primeiro rode: termux-setup-storage  (toque em Permitir) e rode este comando de novo.\"; exit 1; }\nt(){ echo; echo \"=== $1 ===\"; }\ntam(){ du -sh \"$1\" 2>/dev/null | cut -f1; }\n{\necho \"🩺 DIAGNÓSTICO DO CELULAR — $(date '+%d/%m/%Y %H:%M')\"\necho \"Aparelho: $(getprop ro.product.brand 2>/dev/null) $(getprop ro.product.model 2>/dev/null) · Android $(getprop ro.build.version.release 2>/dev/null)\"\nt \"ESPAÇO\"\ndf -h \"$S\" 2>/dev/null | tail -1 | awk '{print \"Total: \"$2\"  · Usado: \"$3\"  · Livre: \"$4\"  · (\"$5\" cheio)\"}'\nL=$(df -k \"$S\" 2>/dev/null | tail -1 | awk '{print $4}')\nif [ -n \"$L\" ] && [ \"$L\" -lt 2097152 ]; then echo \"🔴 MENOS DE 2 GB LIVRES: o Android dá erro em tudo assim. Precisa liberar espaço.\"; else echo \"🟢 Espaço livre suficiente.\"; fi\nt \"MEMÓRIA\"\nawk '/MemTotal/{t=$2}/MemAvailable/{a=$2}END{printf \"Total: %.1f GB · Livre agora: %.1f GB\\n\",t/1048576,a/1048576}' /proc/meminfo 2>/dev/null\nt \"O QUE MAIS OCUPA (pastas principais)\"\nfor d in \"$S\"/*/ \"$S\"/Android/media/*/; do [ -d \"$d\" ] && printf \"%s\\t%s\\n\" \"$(du -sk \"$d\" 2>/dev/null | cut -f1)\" \"${d#$S/}\"; done | sort -rn | head -15 | awk -F'\\t' '{printf \"%8.1f GB  %s\\n\",$1/1048576,$2}'\nt \"PASTAS IMPORTANTES PARA COPIAR (antes de formatar)\"\nfor d in DCIM Pictures Download Documents Movies Music Recordings WhatsApp Android/media/com.whatsapp Telegram Android/media/org.telegram.messenger; do [ -d \"$S/$d\" ] && echo \"📁 $d — $(tam \"$S/$d\")\"; done\nt \"ARQUIVOS GRANDES (mais de 300 MB)\"\nfind \"$S\" -type f -size +300M 2>/dev/null | head -20 | while read -r f; do echo \"$(tam \"$f\")  ${f#$S/}\"; done\nt \"PEÇAS DO SISTEMA QUE OS APPS PRECISAM\"\nD=$( (cmd package list packages -d 2>/dev/null || pm list packages -d 2>/dev/null) | sed 's/package://')\nA=$( (cmd package list packages 2>/dev/null || pm list packages 2>/dev/null) | sed 's/package://')\nif [ -z \"$A\" ]; then echo \"(Este Android não deixa o Termux listar os apps. Confira à mão: Configurações → Apps → Mostrar sistema.)\"; else\nfor p in \"com.google.android.webview:Android System WebView\" \"com.android.chrome:Chrome\" \"com.google.android.gms:Google Play Services\" \"com.android.vending:Google Play Store\" \"com.google.android.gsf:Google Services Framework\"; do\n  n=\"${p%%:*}\"; r=\"${p#*:}\"\n  if echo \"$D\" | grep -qx \"$n\"; then echo \"🔴 DESATIVADO: $r  → Configurações → Apps → Mostrar sistema → $r → Ativar\"\n  elif echo \"$A\" | grep -qx \"$n\"; then echo \"🟢 ok: $r\"; else echo \"⚪ não encontrado: $r\"; fi\ndone\nQ=$(echo \"$D\" | grep -c . ); echo \"Apps desativados no total: $Q\"\n[ \"$Q\" -gt 0 ] && echo \"$D\" | head -40 | sed 's/^/   - /'\nfi\nt \"O QUE FAZER\"\necho \"1) Se aparecer 🔴 DESATIVADO acima: reative (principalmente o WebView e o Play Services) e reinicie.\"\necho \"2) Se estiver com menos de 2 GB livres: copie as PASTAS IMPORTANTES para o computador/HD (cabo USB → Transferência de arquivos) e só depois apague do celular.\"\necho \"3) Só formate depois de copiar tudo e conferir no computador que as fotos/documentos abrem.\"\n} 2>&1 | tee \"$R\"\necho; echo \"💾 Relatório guardado em: Download/diagnostico-celular.txt (mande para o Claude).\"\n"
}
},
{
"id": "pc-pip-aviso",
"titulo": "O vermelho do pip com \"23\" e \"24\" não é erro",
"onde": "pc",
"explica": "Quando o pip mostra em vermelho \"A new release of pip is available: 23 -> 24\", é só o aviso de que existe versão nova dele. Pode ignorar. Se quiser atualizar:",
"passos": [
{
"txt": "Atualizar o pip (opcional):",
"cmd": "python -m pip install --upgrade pip"
}
],
"tags": [
"python"
],
"origem": "claude",
"v": 1
},
{
"id": "pc-voz",
"titulo": "Ligar a voz Francisco no PC (sem os programas)",
"onde": "pc",
"explica": "Nos programas do PC (Mini SK, Laboratório e Assistente Jurídico .exe) a voz já vem dentro. Isto é só para usar no navegador sem eles.",
"passos": [
{
"txt": "Uma vez só:",
"cmd": "pip install edge-tts"
},
{
"txt": "Ligar (ou dois cliques no arquivo):",
"cmd": "python voz-francisco.py"
}
],
"tags": [
"voz",
"python"
],
"origem": "claude",
"v": 1
},
{
"id": "pc-ollama-liberar",
"titulo": "Liberar o Ollama para os apps do navegador",
"onde": "pc",
"explica": "Sem isso, os apps abertos no navegador não conseguem falar com o Ollama. Rode no PowerShell, feche o Ollama (ícone perto do relógio → Quit) e abra de novo.",
"passos": [
{
"txt": "Liberar:",
"cmd": "setx OLLAMA_ORIGINS \"*\""
},
{
"txt": "Mais memória de conversa:",
"cmd": "setx OLLAMA_CONTEXT_LENGTH 16384"
}
],
"tags": [
"ollama"
],
"origem": "claude",
"v": 1
},
{
"id": "pc-ollama-modelos",
"titulo": "Modelos do Ollama no PC",
"onde": "pc",
"explica": "Com placa NVIDIA, o qwen2.5:7b costuma ir bem. Se ficar lento, use o 3b.",
"passos": [
{
"txt": "Baixar o bom:",
"cmd": "ollama pull qwen2.5:7b"
},
{
"txt": "Baixar o mais rápido:",
"cmd": "ollama pull qwen2.5:3b"
},
{
"txt": "Ver os que tem:",
"cmd": "ollama list"
},
{
"txt": "Apagar um (troque o nome):",
"cmd": "ollama rm qwen2.5:7b"
}
],
"tags": [
"ollama",
"ia"
],
"origem": "claude",
"v": 1
},
{
"id": "pc-defender",
"titulo": "O antivírus apagou meu arquivo",
"onde": "pc",
"explica": "A Segurança do Windows apaga arquivos .py, .exe e .bat que ela não conhece.",
"passos": [
{
"txt": "Para devolver: Segurança do Windows → Proteção contra vírus e ameaças → Histórico de proteção → toque no item → Ações → Permitir (ou Restaurar)."
},
{
"txt": "Para não mexer nos seus projetos: Proteção contra vírus → Gerenciar configurações → Exclusões → Adicionar exclusão → Pasta → escolha C:\\Mini-SK (só essa pasta)."
}
],
"tags": [
"windows",
"antivírus"
],
"origem": "claude",
"v": 1
},
{
"id": "pc-powershell",
"titulo": "Abrir o PowerShell numa pasta",
"onde": "pc",
"explica": "Para rodar comandos dentro de uma pasta (ex.: a do scrcpy).",
"passos": [
{
"txt": "Abra a pasta no Explorador, clique na barra de endereço, apague o que tem, digite powershell e aperte Enter."
}
],
"tags": [
"windows"
],
"origem": "claude",
"v": 1
},
{
"id": "pc-montar",
"titulo": "Juntar ferramentas HTML num app só (montar.py)",
"onde": "qualquer",
"explica": "Junta várias ferramentas HTML num app só, como o Caça-Bug. Coloque os HTML na pasta \"fontes\", ajuste a receita.json e rode.",
"passos": [
{
"txt": "Na pasta do montar.py:",
"cmd": "python montar.py"
}
],
"tags": [
"python",
"montar"
],
"origem": "claude",
"v": 1
},
{
"id": "f-montar",
"titulo": "montar.py",
"onde": "qualquer",
"explica": "O programinha que monta o app com as suas ferramentas.",
"passos": [],
"tags": [
"montar",
"arquivo"
],
"origem": "claude",
"v": 1,
"arquivo": {
"nome": "montar.py",
"conteudo": "# -*- coding: utf-8 -*-\n\"\"\"\nMONTAR — a \"receita do bolo\" do Caça-Bug, para qualquer app.\n\nPega ferramentas que são UM HTML cada (do jeito que vieram, sem mexer nelas)\ne transforma cada uma num arquivo .js que guarda o HTML inteiro dentro dele.\nO app (index.html) carrega esses .js e abre cada ferramenta numa \"janelinha\"\n(iframe srcdoc). Assim:\n  - funciona abrindo o index.html direto (sem servidor), no APK e sem internet;\n  - o app pode ENTREGAR o projeto para a ferramenta e PEGAR o relatório dela\n    (pela \"tomada\" window.__hub, que este script coloca no fim de cada HTML).\n\nCOMO USAR (no PC, na pasta do app):\n  1. Ponha os HTML originais na pasta  fontes/\n  2. Escreva a lista em  receita.json  (exemplo no guia)\n  3. Rode:   python montar.py\n  4. Ele cria  ferramentas/<nome>.js  e  ferramentas/ordem.txt\n     e mostra as linhas <script> para colar no index.html.\nNada nos originais é mudado. Para atualizar uma ferramenta: troque o HTML em\nfontes/ e rode de novo.\n\"\"\"\nimport json, os, sys\n# no Windows (terminal do Mini SK) o Python escreve em outra 'língua' de letras: força UTF-8 para os ✅ não quebrarem\ntry:\n    sys.stdout.reconfigure(encoding='utf-8', errors='replace')\nexcept Exception:\n    pass\n\nPASTA = os.path.dirname(os.path.abspath(__file__))\nRECEITA = os.path.join(PASTA, 'receita.json')\nFONTES = os.path.join(PASTA, 'fontes')\nSAIDA = os.path.join(PASTA, 'ferramentas')\nNOME_LISTA = 'CB_FERRAMENTAS'   # o nome da \"lista\" que o app lê (no Caça-Bug é este)\n\n# bibliotecas da internet -> cópia local (para funcionar sem internet e no APK)\nLIBS_LOCAIS = [\n    ('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'lib/jszip.min.js'),\n    ('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js', 'lib/jszip.min.js'),\n    ('https://cdnjs.cloudflare.com/ajax/libs/jsdiff/5.2.0/diff.min.js', 'lib/diff.min.js'),\n]\n\ndef ler(caminho):\n    with open(caminho, encoding='utf-8', errors='replace') as f:\n        return f.read()\n\ndef no_fim_do_body(html, extra):\n    i = html.lower().rfind('</body>')\n    return html[:i] + extra + html[i:] if i >= 0 else html + extra\n\ndef main():\n    if not os.path.exists(RECEITA):\n        sys.exit('Falta o receita.json (veja o exemplo no guia).')\n    receita = json.loads(ler(RECEITA))\n    os.makedirs(SAIDA, exist_ok=True)\n    ordem, scripts = [], []\n    for item in receita:\n        origem = os.path.join(FONTES, item['fonte'])\n        if not os.path.exists(origem):\n            print('⚠ não achei', origem, '— pulei'); continue\n        html = ler(origem)\n        for de, para in LIBS_LOCAIS:\n            html = html.replace(de, para)\n        # a \"tomada\": como o app conversa com a ferramenta\n        #   abrir  = código JS que recebe o arquivo f (um .zip/.pdf...) e carrega na ferramenta\n        #   relatorio = código JS que devolve o texto do resultado\n        partes = []\n        if item.get('abrir'):\n            partes.append('abrir:function(f,slot){return (' + item['abrir'] + ');}')\n        if item.get('relatorio'):\n            partes.append('relatorio:function(){try{return (' + item['relatorio'] + ');}catch(e){return \"\";}}')\n        if partes:\n            html = no_fim_do_body(html, '<script>window.__hub={' + ','.join(partes) + '};</script>')\n        ficha = {\n            'id': item['id'], 'nome': item['nome'], 'icone': item.get('icone', '🧰'),\n            'desc': item.get('desc', ''), 'alimenta': bool(item.get('abrir')), 'html': html,\n        }\n        js = ('/* Ferramenta gerada pelo montar.py a partir de fontes/' + item['fonte'] + ' (não edite aqui). */\\n'\n              '(window.' + NOME_LISTA + ' = window.' + NOME_LISTA + ' || []).push('\n              + json.dumps(ficha, ensure_ascii=False).replace('</script', '<\\\\/script') + ');\\n')\n        nome_js = item['id'] + '.js'\n        with open(os.path.join(SAIDA, nome_js), 'w', encoding='utf-8') as f:\n            f.write(js)\n        ordem.append(item['id'])\n        scripts.append('<script src=\"ferramentas/' + nome_js + '\"></script>')\n        print('✅', item['nome'], '→ ferramentas/' + nome_js, '(' + str(len(js) // 1024) + ' KB)')\n    with open(os.path.join(SAIDA, 'ordem.txt'), 'w', encoding='utf-8') as f:\n        f.write('\\n'.join(ordem) + '\\n')\n    print('\\nCole estas linhas no index.html (antes do js/40-ferramentas.js):')\n    print('\\n'.join(scripts))\n\nif __name__ == '__main__':\n    main()\n"
}
},
{
"id": "f-receita",
"titulo": "receita.json (lista do montar)",
"onde": "qualquer",
"explica": "A lista de ferramentas que o montar.py junta. Edite para escolher as suas.",
"passos": [],
"tags": [
"montar",
"arquivo"
],
"origem": "claude",
"v": 1,
"arquivo": {
"nome": "receita.json",
"conteudo": "[\n  {\n    \"fonte\": \"cirurgiao.html\",\n    \"id\": \"cirurgiao\", \"nome\": \"Cirurgião\", \"icone\": \"🩻\",\n    \"desc\": \"Marcas do Replit, bugs, dependências, chaves\",\n    \"abrir\": \"carregarFiles([f])\",\n    \"relatorio\": \"relatorio(itensFiltrados())\"\n  },\n  {\n    \"fonte\": \"limpador-processos.html\",\n    \"id\": \"limpador\", \"nome\": \"Limpador de Processos\", \"icone\": \"🧹\",\n    \"desc\": \"Limpa, separa e resume processo com IA\"\n  }\n]\n"
}
},
{
"id": "adb-preparar",
"titulo": "Preparar o celular para o adb e o scrcpy",
"onde": "adb",
"explica": "O adb conversa com o celular pelo cabo. O scrcpy mostra e controla a tela do celular no PC (bom para o celular de tela quebrada).",
"passos": [
{
"txt": "No celular: Configurações → Sobre o telefone → toque 7 vezes em \"Número da versão\"."
},
{
"txt": "Depois: Sistema → Opções do desenvolvedor → ligue a Depuração USB."
},
{
"txt": "No PC: baixe o scrcpy em github.com/Genymobile/scrcpy (Releases, versão win64), extraia e abra o PowerShell nessa pasta."
},
{
"txt": "Ligue o cabo e aceite \"Permitir depuração USB\" no celular."
}
],
"tags": [
"celular",
"adb"
],
"origem": "claude",
"v": 1
},
{
"id": "adb-ver",
"titulo": "Ver se o celular apareceu no adb",
"onde": "adb",
"explica": "Deve aparecer um código e a palavra \"device\". Se aparecer \"unauthorized\", aceite o aviso no celular.",
"passos": [
{
"txt": "No PowerShell, na pasta do scrcpy:",
"cmd": ".\\adb devices"
}
],
"tags": [
"adb"
],
"origem": "claude",
"v": 1
},
{
"id": "adb-tela",
"titulo": "Usar o celular pelo PC (scrcpy)",
"onde": "adb",
"explica": "Abre a tela do celular numa janela do PC, com mouse e teclado.",
"passos": [
{
"txt": "Pelo cabo:",
"cmd": ".\\scrcpy"
},
{
"txt": "Sem cabo (com o cabo ligado da 1ª vez):",
"cmd": ".\\adb tcpip 5555"
},
{
"txt": "Depois, pelo Wi-Fi (troque pelo IP do celular, em Configurações → Sobre → Status):",
"cmd": ".\\adb connect 192.168.0.10:5555"
},
{
"txt": "E abra:",
"cmd": ".\\scrcpy"
}
],
"tags": [
"adb",
"celular"
],
"origem": "claude",
"v": 1
},
{
"id": "adb-desligados",
"titulo": "Ver os apps desligados no celular",
"onde": "adb",
"explica": "Lista os apps do sistema que estão desligados (ex.: Google Play Services, WebView).",
"passos": [
{
"txt": "Listar:",
"cmd": ".\\adb shell pm list packages -d"
}
],
"tags": [
"adb",
"celular"
],
"origem": "claude",
"v": 1
},
{
"id": "adb-religar",
"titulo": "Religar o Google e os apps desligados (sem formatar)",
"onde": "adb",
"explica": "Religa tudo que foi desligado no usuário principal. Não apaga nada seu. Alguns apps que você tirou de propósito podem voltar.",
"passos": [
{
"txt": "Religar os desligados:",
"cmd": ".\\adb shell \"for p in $(pm list packages -d | cut -d: -f2); do pm enable $p; done\""
},
{
"txt": "Devolver os apps do sistema removidos do seu usuário:",
"cmd": ".\\adb shell \"for p in $(pm list packages -u | cut -d: -f2); do cmd package install-existing $p >/dev/null 2>&1; done\""
},
{
"txt": "Reiniciar o celular:",
"cmd": ".\\adb reboot"
}
],
"tags": [
"adb",
"celular",
"google"
],
"origem": "claude",
"v": 1,
"cuidado": "Faça o backup pelo cabo antes, por segurança."
},
{
"id": "b-cabo",
"titulo": "Backup do celular pelo cabo (antes de formatar)",
"onde": "qualquer",
"explica": "O jeito mais seguro de copiar tudo.",
"passos": [
{
"txt": "Ligue o cabo. No celular, aceite \"Permitir acesso aos dados\" e escolha \"Transferência de arquivos\"."
},
{
"txt": "No PC, abra o Explorador: o celular aparece como um disco."
},
{
"txt": "Arraste para uma pasta no HD: Download, Documents, DCIM, Pictures, Android/media/com.whatsapp e as pastas dos seus projetos."
},
{
"txt": "Abra alguns arquivos no PC para conferir. Só depois pense em formatar."
}
],
"tags": [
"backup",
"celular"
],
"origem": "claude",
"v": 1,
"cuidado": "Nunca formate antes de conferir o backup."
},
{
"id": "r-zip",
"titulo": "Baixar um projeto inteiro do Replit (zip)",
"onde": "replit",
"explica": "No Shell do Replit. Cria o versao.zip sem as pastas pesadas. Depois baixe o arquivo pela lista de arquivos.",
"passos": [
{
"txt": "Criar o zip:",
"cmd": "zip -r versao.zip . -x \"node_modules/*\" \".cache/*\""
}
],
"tags": [
"replit",
"backup"
],
"origem": "claude",
"v": 1,
"cuidado": "Tire o .env e o local.config.json antes de mandar para alguém (têm suas chaves)."
},
{
"id": "fx-medir",
"titulo": "Ver o que está enchendo o computador (só olha)",
"onde": "pc",
"explica": "Mede as pastas que mais costumam encher o disco C: o resto do Google Drive, OneDrive, Downloads, Documentos, a Lixeira, o Ollama, o lixo temporário. NÃO apaga nada. Demora uns minutos. Depois tire um print e mande para o Claude.",
"passos": [
{
"txt": "Abrir o PowerShell como administrador: menu Iniciar → digite PowerShell → botão direito → Executar como administrador → Sim."
},
{
"txt": "Cole tudo de uma vez e aperte Enter:",
"cmd": "$L=$env:LOCALAPPDATA; $U=$env:USERPROFILE\n$lista = \"$L\\Google\\DriveFS\",\"$U\\Meu Drive\",\"$U\\My Drive\",\"$U\\OneDrive\",\"$U\\Downloads\",\"$U\\Documents\",\"$U\\Desktop\",\"$U\\Pictures\",\"$U\\Videos\",\"$U\\.ollama\",\"$L\\Temp\",\"$L\\Microsoft\\Windows\\INetCache\",\"C:\\Mini-SK\",\"C:\\Windows.old\",'C:\\$Recycle.Bin'\nforeach ($x in $lista) { if (Test-Path $x) { $s = (Get-ChildItem $x -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum; \"{0:N1} GB  -  {1}\" -f ($s/1GB), $x } }\nGet-ChildItem C:\\ -Force -File -ErrorAction SilentlyContinue | Where-Object Length -gt 1GB | ForEach-Object { \"{0:N1} GB  -  {1}\" -f ($_.Length/1GB), $_.FullName }\n$d = Get-PSDrive C; \"LIVRE: {0:N1} GB de {1:N1} GB\" -f ($d.Free/1GB), (($d.Used+$d.Free)/1GB)"
}
],
"tags": [
"espaço",
"diagnóstico",
"faxina"
],
"origem": "claude",
"v": 1
},
{
"id": "fx-drive-perdidos",
"titulo": "Procurar arquivos perdidos do Google Drive (achados e perdidos)",
"onde": "pc",
"explica": "Mesmo depois de desinstalar, o Google Drive deixa uma pasta escondida (DriveFS). Lá dentro pode existir a \"lost_and_found\": arquivos que ele NÃO conseguiu mandar para a nuvem — às vezes são exatamente os que sumiram. Este comando só mostra o que tem lá.",
"passos": [
{
"txt": "Jeito fácil: aperte Windows + R, cole isto e aperte Enter. Entre na pasta de número comprido e procure lost_and_found:",
"cmd": "%LOCALAPPDATA%\\Google\\DriveFS"
},
{
"txt": "Ou pelo PowerShell (lista os arquivos que estão lá):",
"cmd": "Get-ChildItem \"$env:LOCALAPPDATA\\Google\\DriveFS\" -Recurse -Force -Directory -Filter lost_and_found -ErrorAction SilentlyContinue | ForEach-Object { \"== \" + $_.FullName; Get-ChildItem $_.FullName -Recurse -File -Force -ErrorAction SilentlyContinue | Select-Object -First 60 Name, @{n='MB';e={[math]::Round($_.Length/1MB,1)}} | Format-Table -AutoSize }"
},
{
"txt": "Se achar arquivos seus: copie para a Área de Trabalho ou para o HD externo antes de qualquer limpeza."
}
],
"tags": [
"recuperar",
"google drive",
"faxina"
],
"origem": "claude",
"v": 1,
"cuidado": "NÃO apague a pasta DriveFS antes de olhar a lost_and_found."
},
{
"id": "fx-hd-nao-aparece",
"titulo": "O HD externo não aparece no computador",
"onde": "pc",
"explica": "Mostra se o Windows está enxergando o HD (às vezes ele aparece, mas sem letra, e por isso não abre). Só olha. Tire print e mande para o Claude.",
"passos": [
{
"txt": "Ligue o HD. Abra o Gerenciamento de Disco (ou aperte Windows + X → Gerenciamento de Disco):",
"cmd": "diskmgmt.msc"
},
{
"txt": "Abrir o PowerShell como administrador: menu Iniciar → digite PowerShell → botão direito → Executar como administrador → Sim."
},
{
"txt": "Ou liste os discos pelo PowerShell:",
"cmd": "Get-Disk | Format-Table Number, FriendlyName, BusType, @{n=\"GB\";e={[math]::Round($_.Size/1GB)}}, OperationalStatus, PartitionStyle -AutoSize; Get-Volume | Format-Table DriveLetter, FileSystemLabel, FileSystem, @{n=\"GB\";e={[math]::Round($_.Size/1GB)}}, HealthStatus -AutoSize"
},
{
"txt": "Se não aparecer em lugar nenhum: troque de porta USB (a de trás, se tiver) e de cabo, e rode de novo."
}
],
"tags": [
"hd externo",
"usb",
"faxina"
],
"origem": "claude",
"v": 1,
"cuidado": "NÃO formate o HD antes de falar com o Claude: formatar apaga o que está nele."
},
{
"id": "fx-limpeza-windows",
"titulo": "Limpeza de Disco do Windows (segura)",
"onde": "pc",
"explica": "A limpeza oficial do Windows. Apaga só lixo do sistema (atualizações velhas, temporários, relatórios de erro). Às vezes libera muitos GB.",
"passos": [
{
"txt": "Abrir a Limpeza de Disco (aperte Windows + R, cole e Enter):",
"cmd": "cleanmgr /d C:"
},
{
"txt": "Na janela: clique em \"Limpar arquivos do sistema\" (pede o Sim de administrador), marque tudo e clique OK."
},
{
"txt": "Outro caminho: Configurações → Sistema → Armazenamento → Arquivos temporários."
}
],
"tags": [
"espaço",
"windows",
"faxina"
],
"origem": "claude",
"v": 1
},
{
"id": "fx-lixeira",
"titulo": "Esvaziar a Lixeira (apaga de vez)",
"onde": "pc",
"explica": "Arquivo apagado vai para a Lixeira e CONTINUA ocupando espaço. Esvaziar devolve o espaço. Antes, abra a Lixeira e veja se não tem arquivo de cliente para restaurar (botão direito → Restaurar).",
"passos": [
{
"txt": "Jeito fácil: botão direito no ícone da Lixeira → Esvaziar Lixeira."
},
{
"txt": "Abrir o PowerShell como administrador: menu Iniciar → digite PowerShell → botão direito → Executar como administrador → Sim."
},
{
"txt": "Ou pelo PowerShell:",
"cmd": "Clear-RecycleBin -Force"
}
],
"tags": [
"espaço",
"lixeira",
"faxina"
],
"origem": "claude",
"v": 1,
"cuidado": "Não tem volta. Olhe a Lixeira antes.",
"perigo": true
},
{
"id": "fx-onedrive",
"titulo": "Os risquinhos verdes e as nuvenzinhas (OneDrive)",
"onde": "pc",
"explica": "Os ícones com risquinho verde ou nuvem nos arquivos são do OneDrive (Microsoft). Risquinho verde = o arquivo está no computador. Nuvem azul = o arquivo está SÓ na internet (não está no computador). Ele também faz aparecer \"Downloads\", \"Documentos\" e \"Área de Trabalho\" em dois lugares.",
"passos": [
{
"txt": "Ver o que o OneDrive está fazendo: clique na nuvenzinha perto do relógio e tire um print para o Claude."
},
{
"txt": "Desinstalar o OneDrive (os arquivos do computador continuam; os de nuvem azul ficam só na internet): Configurações → Aplicativos → Microsoft OneDrive → Desinstalar. Ou pelo PowerShell:",
"cmd": "winget uninstall Microsoft.OneDrive"
}
],
"tags": [
"onedrive",
"nuvem",
"faxina"
],
"origem": "claude",
"v": 1,
"cuidado": "Antes de desinstalar, o Claude te ajuda a trazer para o computador o que estiver com nuvem azul (só na internet)."
},
{
"id": "fx-ollama-pc",
"titulo": "Ver e apagar modelos do Ollama no PC",
"onde": "pc",
"explica": "Cada modelo do Ollama ocupa de 2 a 8 GB. Veja quais tem e apague os que não usa.",
"passos": [
{
"txt": "Ver os modelos e o tamanho:",
"cmd": "ollama list"
},
{
"txt": "Apagar um (troque pelo nome que apareceu):",
"cmd": "ollama rm gemma3:12b"
}
],
"tags": [
"ollama",
"espaço",
"faxina"
],
"origem": "claude",
"v": 1
},
{
"id": "fx-cel-espaco",
"titulo": "Celular: o que mais ocupa espaço",
"onde": "termux",
"explica": "Mostra as 15 pastas mais pesadas do armazenamento do celular. Só olha. Precisa ter feito o \"Deixar o Termux ver os arquivos\" antes.",
"passos": [
{
"txt": "Rodar:",
"cmd": "du -sh ~/storage/shared/* 2>/dev/null | sort -h | tail -15"
},
{
"txt": "Os maiores arquivos do Download (mais de 20 MB):",
"cmd": "find ~/storage/shared/Download -type f -size +20M -exec du -h {} + 2>/dev/null | sort -h | tail -20"
},
{
"txt": "Os modelos do Ollama do celular (cada um tem GBs):",
"cmd": "ollama list"
}
],
"tags": [
"celular",
"espaço",
"faxina"
],
"origem": "claude",
"v": 1
},
{
"id": "fx-cel-repetidos",
"titulo": "Celular: achar arquivos repetidos no Download",
"onde": "termux",
"explica": "Lista as cópias iguaizinhas na pasta Download. Só mostra — não apaga.",
"passos": [
{
"txt": "Rodar:",
"cmd": "cd ~/storage/shared/Download && find . -type f -size +100k -exec md5sum {} + 2>/dev/null | sort | awk '{ if ($1==a) { print \"REPETIDO: \" $2 } a=$1 }'"
}
],
"tags": [
"celular",
"repetidos",
"faxina"
],
"origem": "claude",
"v": 1
},
{
"id": "a-desativar-app",
"titulo": "Desligar um app do celular sem apagar (ex.: YouTube)",
"onde": "adb",
"explica": "Pelo cabo USB, com o adb. O app some da tela mas NÃO é apagado: dá para ligar de novo com o comando de baixo. Troque o nome do pacote pelo do app (veja com 'pm list packages').",
"passos": [
{
"txt": "Ver os pacotes do Google no celular:",
"cmd": ".\\adb shell pm list packages google"
},
{
"txt": "Desligar (exemplo: YouTube):",
"cmd": ".\\adb shell pm disable-user --user 0 com.google.android.youtube"
},
{
"txt": "Ligar de volta:",
"cmd": ".\\adb shell pm enable com.google.android.youtube"
}
],
"tags": [
"adb",
"celular",
"apps"
],
"origem": "claude",
"v": 1
},
{
"id": "a-copiar-celular-hd",
"titulo": "Copiar a memória do celular para o HD (backup pelo cabo)",
"onde": "adb",
"explica": "Copia a pasta do celular (/sdcard) inteira para o HD. Troque E: pela letra do seu HD. Não apaga nada do celular.",
"passos": [
{
"txt": "Conferir se o celular aparece:",
"cmd": ".\\adb devices"
},
{
"txt": "Copiar tudo para o HD:",
"cmd": ".\\adb pull /sdcard/ \"E:\\Backup celular\""
}
],
"tags": [
"adb",
"backup",
"HD"
],
"origem": "claude",
"v": 1
},
{
"id": "t-wake-unlock",
"titulo": "Deixar o Android fechar o Termux de novo (depois de terminar)",
"onde": "termux",
"explica": "O termux-wake-lock segura o Termux ligado (gasta mais bateria). Quando terminar, este solta.",
"passos": [
{
"txt": "Soltar:",
"cmd": "termux-wake-unlock"
}
],
"tags": [
"bateria",
"termux"
],
"origem": "claude",
"v": 1
},
{
"id": "t-pip-list",
"titulo": "Ver o que está instalado no Python",
"onde": "termux",
"explica": "Mostra os pacotes do Python (pip). Serve no Termux e no PC.",
"passos": [
{
"txt": "Ver a versão do Python:",
"cmd": "python --version"
},
{
"txt": "Listar os pacotes:",
"cmd": "pip list"
}
],
"tags": [
"python",
"verificar"
],
"origem": "claude",
"v": 1
}
]
};
