# Design System: WhatsApp Sender

Este documento detalha a identidade visual, princípios de design e a arquitetura de interface do **WhatsApp Sender**, uma plataforma premium para automação de mensageria.

## 1. Visão Geral e Identidade
O WhatsApp Sender foi projetado para transmitir **confiança, eficiência e sofisticação**. O design foge do aspecto "ferramenta básica" e abraça uma estética de **Software as a Service (SaaS) Premium**, utilizando técnicas modernas de UI como Glassmorphism, Micro-interações dinâmicas e uma paleta de cores vibrante baseada no espectro OKLCH.

### Pilares do Design:
- **Premium**: Acabamentos refinados, sombras suaves e tipografia marcante.
- **Vivo**: A interface reage ao usuário com animações fluidas e estados de feedback em tempo real.
- **Focado**: Interface limpa que prioriza a tarefa principal (envio de mensagens) sem distrações.

---

## 2. Paleta de Cores (OKLCH)
Utilizamos o sistema de cores **OKLCH** para garantir uniformidade visual, acessibilidade e cores mais ricas que o sistema RGB/HSL tradicional.

### Cores Base (Light Mode)
- **Primary**: `oklch(0.205 0 0)` (Cinza Profundo/Quase Preto para contraste máximo)
- **Accent/WhatsApp**: Gradients baseados em `#25D366` (Emerald) para conexão imediata com a marca WhatsApp.
- **Background**: `oklch(1 0 0)` (Branco Puro para limpeza)
- **Success**: `oklch(0.627 0.265 145)` (Verde Vibrante)
- **Warning**: `oklch(0.769 0.188 70)` (Âmbar)

### Cores Base (Dark Mode)
- **Background**: `oklch(0.145 0 0)` (Preto Suave)
- **Card**: `oklch(0.205 0 0)` (Cinza Escuro)
- **Primary (Text)**: `oklch(0.922 0 0)` (Cinza Muito Claro)

---

## 3. Tipografia
A tipografia é um dos pilares da nossa estética premium.

- **Geist Sans**: Fonte principal para interface (UI), oferecendo uma leitura moderna e técnica.
- **Roboto**: Utilizada em pesos específicos para corpo de texto e legibilidade em blocos maiores.
- **Geist Mono**: Reservada para dados, logs e identificadores únicos.

### Hierarquia Visual:
- **Headlines (H1/H2)**: Pesos `extrabold` ou `black`, tracking apertado (`tight`).
- **Status/Tags**: Versalete (Uppercase) com tracking espaçado (`tracking-widest`) para um visual de "dashboard profissional".

---

## 4. Componentes e Layout

### Glassmorphism & Profundidade
- **Cards**: Bordas sutis com opacidade (`border-border/50`) e blur de fundo (`backdrop-blur-sm`).
- **Shadows**: Sombras de múltiplos níveis para criar hierarquia espacial.

### Interatividade (Micro-interações)
- **Hover Effects**: Botões e cards possuem escalas suaves (`scale: 1.02`) e mudanças de brilho.
- **Feedback de Clique**: Uso de `whileTap={{ scale: 0.98 }}` via Framer Motion para sensação tátil.
- **Skeleton States**: Transições suaves entre estados de carregamento e conteúdo real.

---

## 5. Animações e Movimento
O movimento não é apenas decorativo, ele guia o usuário através do fluxo.

- **Wizard Stepper**: Transições horizontais entre passos (Público -> Mensagem -> Envio).
- **Hero Animation**: Animação de "transformação" (Device para WhatsApp) que comunica a proposta de valor.
- **Live Metrics**: Contadores pulsantes e barras de progresso animadas que refletem o status real dos disparos.
- **Text Splitting**: Efeitos de entrada de texto letra por letra para manchetes de impacto.

---

## 6. Elementos Visuais Específicos

### WhatsApp Mockup
Uma representação fiel da interface do WhatsApp dentro da plataforma, permitindo ao usuário ver exatamente como sua mensagem (texto + mídia) será renderizada no destinatário antes do envio.

### Iconografia
Utilizamos o set **Lucide React**, personalizado com strokes mais finos para manter a elegibilidade sem poluir o visual.

---

## 7. Estratégia Responsiva
- **Desktop (Electron)**: Otimizado para uma experiência de janelas flutuantes com scrollbars customizadas e layouts de grid flexíveis.
- **Mobile**: Uso extensivo de *Sheets (Bottom Drawers)* para previews e configurações de formulário, garantindo que a experiência seja nativa em telas menores.

---

## 8. Tokens de Design (Tailwind 4)
Os tokens são centralizados no `globals.css` utilizando variáveis CSS, permitindo a troca dinâmica de temas e manutenção facilitada.

```css
:root {
  --radius: 0.625rem;
  --primary: oklch(0.205 0 0);
  /* ... outros tokens */
}
```

---
*Documento gerado para servir como fonte da verdade para o desenvolvimento de UI/UX do projeto.*
