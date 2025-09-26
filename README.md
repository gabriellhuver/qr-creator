# 🚀 Gerador de QR Codes em Lote

Um gerador de QR codes em lote com interface web moderna, desenvolvido em JavaScript puro.

## ✨ Funcionalidades

- **Múltiplas formas de entrada**: Área de texto ou upload de arquivos (TXT/CSV)
- **Configurações personalizáveis**: Tamanho, margem, nível de correção de erro
- **Processamento otimizado**: Gera todos os QR codes simultaneamente
- **Geração de ZIP**: Download automático de todos os QR codes
- **Nomes inteligentes**: Usa o próprio conteúdo como nome do arquivo
- **Interface responsiva**: Funciona em desktop e mobile

## 🚀 Como usar

### 1. Iniciar o servidor local
```bash
python3 -m http.server 8000
```

### 2. Acessar a aplicação
Abra o navegador em: `http://localhost:8000`

### 3. Inserir códigos
- **Área de texto**: Cole sua lista (um código por linha)
- **Upload de arquivo**: Selecione arquivo TXT ou CSV

### 4. Configurar opções
- **Tamanho**: 64px a 1024px (padrão: 256px)
- **Margem**: 0 a 20 (padrão: 4)
- **Nível de correção**: L/M/Q/H (padrão: M)
- **Padrão do nome**: conteúdo + índice ou hash

### 5. Gerar e baixar
- Clique em "🚀 Gerar QR Codes"
- Aguarde o processamento
- Baixe o arquivo ZIP

## 📁 Estrutura de arquivos

```
qr-creator/
├── index.html          # Interface principal
├── styles.css          # Estilos CSS
├── script.js           # Lógica JavaScript
├── qrcode.min.js       # Biblioteca QR Code
├── jszip.min.js        # Biblioteca ZIP
├── teste_codigos.txt   # Arquivo de exemplo
└── README.md           # Este arquivo
```

## 🎯 Exemplos de uso

### Códigos de rastreamento
```
BR123456789BR
BR987654321BR
BR555666777BR
```

### URLs
```
https://exemplo.com/produto1
https://exemplo.com/produto2
https://exemplo.com/produto3
```

### Arquivo CSV
```csv
codigo,descricao
BR123456789BR,Produto A
BR987654321BR,Produto B
```

## ⚙️ Tecnologias

- **HTML5**: Estrutura semântica
- **CSS3**: Design moderno e responsivo
- **JavaScript ES6+**: Lógica da aplicação
- **QRCode.js**: Geração de QR codes
- **JSZip**: Criação de arquivos ZIP

## 🔧 Configurações avançadas

### Níveis de correção de erro
- **L (Baixo ~7%)**: Para ambientes limpos
- **M (Médio ~15%)**: Uso geral (padrão)
- **Q (Alto ~25%)**: Ambientes com interferência
- **H (Muito Alto ~30%)**: Máxima robustez

### Padrões de nome
- **conteudo_{index}**: `BR123456789BR_0001.png`
- **conteudo_{hash}**: `BR123456789BR_a1b2c3d4.png`

## 📱 Compatibilidade

- ✅ Chrome, Firefox, Safari, Edge
- ✅ Desktop e mobile
- ✅ Windows, macOS, Linux

## 🐛 Solução de problemas

### Erro "Can't find variable: QRCode"
- Recarregue a página (F5)
- Verifique se todos os arquivos estão no diretório

### Arquivo ZIP não baixa
- Verifique se o navegador permite downloads
- Tente em modo incógnito

### Processamento lento
- Use nível de correção menor
- Reduza o tamanho dos QR codes

## 📄 Licença

Projeto livre para uso pessoal e comercial.

---

**Desenvolvido com ❤️ para facilitar a geração de QR codes em massa**
