# Luan Barbosa Design System

> Design System oficial para aplicações web da **Luan Barbosa Advocacia Especializada**
> Baseado no Branding Book 2024

---

## Filosofia de Design

| Princípio | Descrição |
|-----------|-----------|
| **Clean & Professional** | Fundo cinza sutil com cards brancos elevados |
| **Minimalista** | Whitespace generoso, poucos elementos por tela |
| **Sofisticado** | Transições suaves, sombras sutis, cantos arredondados |
| **Premium** | Acentos dourados, tipografia moderna |

---

## Paleta de Cores

### Cores da Marca (Pantone)

| Nome | Hex | HSL | Pantone | Uso |
|------|-----|-----|---------|-----|
| **Primary** | `#2f3a44` | `207 18% 23%` | 432 C | Header, textos principais, elementos escuros |
| **Secondary** | `#424e5b` | `210 16% 30%` | 7545 C | Labels, textos secundários |
| **Navy** | `#1c3f53` | `202 49% 22%` | 302 C | Alternativa escura |
| **Slate** | `#325c71` | `200 35% 32%` | 7699 C | Links, elementos interativos |
| **Gold** | `#93784a` | `38 33% 43%` | 872 C | CTAs, destaques, acentos |

### Cores de Interface

| Nome | Hex | Uso |
|------|-----|-----|
| **Background** | `#f3f4f6` | Fundo da página (gray-100) |
| **Card** | `#ffffff` | Cards, superfícies elevadas |
| **Gold Light** | `#a8896a` | Hover do gold |
| **Gold Dark** | `#7d654a` | Active do gold |

### Escala de Cinzas

| Token | Hex | Uso |
|-------|-----|-----|
| `gray-50` | `#f9fafb` | Fundo de inputs, alternância de linhas |
| `gray-100` | `#f3f4f6` | Background principal |
| `gray-200` | `#e5e7eb` | Bordas, divisores |
| `gray-300` | `#d1d5db` | Bordas hover |
| `gray-400` | `#9ca3af` | Placeholders, textos desabilitados |
| `gray-500` | `#6b7280` | Textos muted, ícones |
| `gray-600` | `#4b5563` | Labels, textos secundários |
| `gray-700` | `#374151` | Textos em cards |

### Cores Semânticas

| Nome | Hex | Uso |
|------|-----|-----|
| **Success** | `#10b981` (emerald-500) | Confirmações, online status |
| **Warning** | `#f59e0b` (amber-500) | Alertas, offline status |
| **Error** | `#ef4444` (red-500) | Erros, validações |
| **Info** | `#3b82f6` (blue-500) | Informações, dano material |
| **Purple** | `#9333ea` (purple-600) | Dano moral |

---

## Tipografia

### Fontes

```css
font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

**CDN:**
```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### Escala Tipográfica

| Elemento | Tamanho | Peso | Letter-spacing | Uso |
|----------|---------|------|----------------|-----|
| **Display** | 48-56px | 600 | -0.02em | Valores em destaque |
| **H1** | 32-40px | 600 | -0.02em | Títulos de página |
| **H2** | 24-28px | 600 | -0.02em | Títulos de seção |
| **H3** | 18-20px | 600 | -0.01em | Títulos de card |
| **Body** | 14-16px | 400 | 0 | Texto corrido |
| **Body Small** | 13-14px | 400 | 0 | Descrições |
| **Caption** | 11-12px | 500 | 0.01em | Labels, badges |
| **Overline** | 10-11px | 600 | 0.05em | Categorias (uppercase) |

### Classes CSS

```css
.font-heading {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.font-body {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 400;
}
```

---

## Espaçamento

### Escala Base (4px)

| Token | Valor | Uso |
|-------|-------|-----|
| `space-1` | 4px | Gaps mínimos |
| `space-2` | 8px | Padding interno pequeno |
| `space-3` | 12px | Gaps entre elementos |
| `space-4` | 16px | Padding padrão |
| `space-5` | 20px | Padding de cards |
| `space-6` | 24px | Gaps entre seções |
| `space-8` | 32px | Margem entre cards |
| `space-10` | 40px | Seções principais |
| `space-12` | 48px | Header/Footer |

### Padrões de Layout

| Contexto | Padding | Gap |
|----------|---------|-----|
| **Card** | `py-5 px-6` (20px/24px) | - |
| **Card Header** | `py-4 px-6` | - |
| **Form Fields** | - | `space-y-4` (16px) |
| **Seções** | - | `space-y-8` (32px) |
| **Grid Colunas** | - | `gap-4` (16px) |
| **Buttons** | `px-6 py-3` | `gap-2` (8px) |

---

## Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `rounded-sm` | 4px | Badges pequenos |
| `rounded` | 6px | Inputs, selects |
| `rounded-md` | 8px | Botões pequenos |
| `rounded-lg` | 12px | Cards secundários |
| `rounded-xl` | 16px | Inputs, botões principais |
| `rounded-2xl` | 20px | Cards principais |
| `rounded-full` | 9999px | Pills, avatares, status |

---

## Sombras

### Elevação

```css
/* Nível 1 - Cards em repouso */
.shadow-soft {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08),
              0 4px 12px rgba(0, 0, 0, 0.05);
}

/* Nível 2 - Cards em hover */
.shadow-md {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -2px rgba(0, 0, 0, 0.1);
}

/* Nível 3 - Modais, dropdowns */
.shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
              0 4px 6px -4px rgba(0, 0, 0, 0.1);
}

/* Sombra dourada - CTAs */
.shadow-gold {
  box-shadow: 0 4px 20px rgba(147, 120, 74, 0.15);
}

.shadow-gold-hover {
  box-shadow: 0 6px 24px rgba(147, 120, 74, 0.25);
}
```

---

## Componentes

### Botões

#### Botão Gold (CTA Principal)

```css
.btn-gold {
  background-color: #93784a;
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 14px rgba(147, 120, 74, 0.25);
  transition: all 300ms ease-out;
}

.btn-gold:hover {
  background-color: #a8896a;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(147, 120, 74, 0.35);
}
```

**Tailwind:**
```html
<button class="bg-[#93784a] text-white font-semibold px-6 py-3 rounded-xl
               shadow-lg hover:bg-[#a8896a] hover:shadow-xl hover:-translate-y-0.5
               transition-all duration-300">
  Calcular
</button>
```

#### Botão Outline (Secundário)

```css
.btn-outline {
  background: white;
  border: 1px solid #e5e7eb;
  color: #4b5563;
  font-weight: 500;
  padding: 12px 24px;
  border-radius: 12px;
  transition: all 300ms;
}

.btn-outline:hover {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #2f3a44;
}
```

### Cards

#### Card Padrão

```css
.card {
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: all 300ms ease-out;
}

.card:hover {
  border-color: rgba(147, 120, 74, 0.2);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

**Tailwind:**
```html
<div class="bg-white rounded-2xl border border-gray-200/60 shadow-sm
            hover:shadow-md hover:border-[#93784a]/20 transition-all duration-300">
  <!-- conteúdo -->
</div>
```

### Inputs

```css
.input {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  color: #374151;
  transition: all 200ms;
}

.input:focus {
  background: white;
  border-color: #93784a;
  outline: none;
  box-shadow: 0 0 0 3px rgba(147, 120, 74, 0.15);
}

.input::placeholder {
  color: #9ca3af;
}
```

**Tailwind:**
```html
<input class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3
              text-gray-700 placeholder:text-gray-400
              focus:bg-white focus:border-[#93784a] focus:ring-2
              focus:ring-[rgba(147,120,74,0.15)] focus:outline-none
              transition-all duration-200" />
```

### Badges/Chips

```css
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: rgba(147, 120, 74, 0.1);
  border: 1px solid rgba(147, 120, 74, 0.2);
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  color: #93784a;
}
```

### Status Indicators

```html
<!-- Online -->
<span class="w-2 h-2 rounded-full bg-emerald-500"></span>

<!-- Offline -->
<span class="w-2 h-2 rounded-full bg-amber-500"></span>

<!-- Error -->
<span class="w-2 h-2 rounded-full bg-red-500"></span>
```

---

## Animações

### Transições Padrão

```css
/* Rápida - inputs, estados */
transition: all 200ms ease-out;

/* Normal - cards, botões */
transition: all 300ms ease-out;

/* Lenta - modais, páginas */
transition: all 500ms cubic-bezier(0.2, 0.8, 0.2, 1);
```

### Reveal Animation

```css
@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-reveal {
  animation: reveal 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  opacity: 0;
}
```

### Hover Lift

```css
.hover-lift {
  transition: all 300ms ease-out;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}
```

---

## Logo

### Uso

```html
<!-- Container escuro obrigatório -->
<div class="bg-[#2f3a44] px-8 py-4 rounded-2xl">
  <img src="/logo-lb.svg" alt="Luan Barbosa" class="w-48 h-auto" />
</div>
```

### Tamanhos

| Viewport | Largura |
|----------|---------|
| Mobile | `w-40` (160px) |
| Tablet | `w-48` (192px) |
| Desktop | `w-56` (224px) |

---

## Layout de Página

### Estrutura Base

```html
<div class="min-h-screen bg-[#f3f4f6]">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

    <!-- Header -->
    <header class="text-center pt-6 pb-8">
      <!-- Logo + Título -->
    </header>

    <!-- Cards/Seções -->
    <section class="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-6">
      <!-- Conteúdo -->
    </section>

    <!-- Ações -->
    <div class="flex gap-4">
      <button class="btn-gold flex-1">Ação Principal</button>
      <button class="btn-outline">Secundária</button>
    </div>

  </div>
</div>
```

---

## PDF Export Design

### Cores para jsPDF

```typescript
const COLORS = {
  primary: [47, 58, 68],      // #2f3a44
  gold: [147, 120, 74],       // #93784a
  white: [255, 255, 255],
  gray50: [249, 250, 251],    // #f9fafb
  gray200: [229, 231, 235],   // #e5e7eb
  gray500: [107, 114, 128],   // #6b7280
  gray700: [55, 65, 81],      // #374151
  blue500: [59, 130, 246],    // Material
  purple600: [147, 51, 234],  // Moral
  emerald: [5, 150, 105],     // BCB source
}
```

### Estrutura do PDF

1. **Header** - Fundo `primary`, texto branco
2. **Dados do Processo** - Card branco com borda
3. **Verbas** - Headers coloridos (azul/roxo) + cards cinza
4. **Subtotais** - Badges dourados
5. **Totais** - Box `primary`
6. **Fonte BCB** - Card emerald
7. **Rodapé** - Linha dourada + texto cinza

---

## Arquivos de Referência

| Arquivo | Descrição |
|---------|-----------|
| `src/index.css` | Variáveis CSS + componentes |
| `tailwind.config.js` | Configuração Tailwind |
| `src/services/pdf.ts` | Design tokens para PDF |
| `src/assets/logo-lb.svg` | Logo vetorial |

---

## Checklist de Implementação

- [ ] Importar fonte Plus Jakarta Sans
- [ ] Configurar variáveis CSS da paleta
- [ ] Definir cores no Tailwind config
- [ ] Criar classes de componentes (btn-gold, card, etc.)
- [ ] Usar background `#f3f4f6`
- [ ] Cards brancos com `rounded-2xl`
- [ ] Inputs com fundo `gray-50`
- [ ] CTAs com cor gold `#93784a`
- [ ] Transições de 300ms
- [ ] Logo sempre em container escuro

---

*Luan Barbosa Design System v1.0 - Janeiro 2025*
