# Innovate.ia — Design System v1

Sistema de componentes UI unificados para toda la app. **Fuente única de verdad** para la identidad visual.

## Reglas de oro

1. **Nunca hardcodear colores, radios o font sizes.** Usar los tokens.
2. **1 `<Button variant="primary">` por pantalla.** El resto `secondary`, `ghost` o `danger`.
3. **Los warnings son `warning` (naranja), no `danger`.** Rojo solo para acciones destructivas y errores críticos.
4. **Usar `<StatCard>` para toda métrica.** No crear cards custom.
5. **Usar `<TabBar>` para toda navegación de tabs.** No mezclar underline/pills/etc.
6. **Usar `<Banner>` para todo aviso.** No crear divs con fondos de color custom.
7. **Usar `<Chip>` para toda etiqueta/estado/tag.**
8. **Usar `<EmptyState>` para toda lista/sección sin data.** No crear placeholders custom.
9. **Usar `<Skeleton>` para loading parcial.** `<Splash>` solo para carga full-page.
10. **Emojis solo en contextos humanos** (welcome, empty states, descripciones amigables). En acciones van iconos o nada.
11. **`<IconButton>` siempre lleva `ariaLabel`.** El `title` solo no alcanza para screen readers.

## Tokens

```js
import { COLORS, RADIUS, SHADOW, SPACING, FONT, FONT_SIZE, FONT_WEIGHT } from '@/theme/tokens'
```

### Paleta semántica

| Token | Uso |
|---|---|
| `COLORS.brand` | Acción primaria, acentos brand |
| `COLORS.success` | Estados activos, confirmaciones |
| `COLORS.info` | Métricas neutras, links informativos |
| `COLORS.warning` | Advertencias, configuración pendiente |
| `COLORS.danger` | Errores críticos, destructivo |
| `COLORS.crypto` | Solo botón cripto (BTC) |
| `COLORS.ai` | Solo features IA generativa |

### Compatibilidad legacy

Las páginas viejas usan `const C = { gold, goldDim, green, red, blue, ... }`.
`COLORS` incluye aliases para migración drop-in:

```js
// Antes:
const C = { bg:'#080B12', gold:'#D4A843', green:'#4ade80', ... }

// Después:
import { COLORS as C } from '@/theme/tokens'
// C.gold, C.green, C.red siguen funcionando
```

## Componentes

### Button

```jsx
import { Button, IconButton } from '@/components/ui'

<Button variant="primary" onClick={save}>Guardar</Button>
<Button variant="secondary" icon="📋">Copiar URL</Button>
<Button variant="danger" size="sm">Eliminar</Button>
<Button variant="crypto">₿</Button>
<Button variant="ai" icon="✨">Diseñar con IA</Button>

{/* IconButton SIEMPRE con ariaLabel — el title solo no es accesible */}
<IconButton icon="🗑" ariaLabel="Eliminar registro" variant="danger" onClick={del}/>
<IconButton icon="📋" ariaLabel="Copiar al portapapeles" onClick={copy}/>
```

Accesibilidad (S13):
- `:focus-visible` outline visible para usuarios con teclado
- `aria-busy` cuando `loading=true`
- Iconos decorativos marcados `aria-hidden`

### StatCard

```jsx
import { StatCard, StatGrid } from '@/components/ui'

<StatGrid>
  <StatCard label="Clientes activos" value="11" icon="👥" accent="info"/>
  <StatCard label="Ventas hoy" value="$28.000" accent="success" trend={[2,4,3,8,12]}/>
  <StatCard label="Videos IA" locked ctaText="Cargar créditos" onCta={goToBilling}/>
</StatGrid>
```

### TabBar

```jsx
import { TabBar, SegmentedControl } from '@/components/ui'

<TabBar
  value={tab}
  onChange={setTab}
  tabs={[
    { id: 'general',   label: 'General',   icon: '⚙️' },
    { id: 'billetera', label: 'Billetera', icon: '💳', badge: 2 },
  ]}
/>

<SegmentedControl
  value={view}
  onChange={setView}
  options={[
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'list',      label: 'Lista',     icon: '📋' },
  ]}
/>
```

### Banner

```jsx
import { Banner } from '@/components/ui'

<Banner variant="warning" title="Meta Pixel no configurado"
  cta="Configurar ahora" onCtaClick={goToConfig}>
  Las ventas se registran pero no se envían a Meta.
</Banner>

<Banner variant="tip" title="Cómo usarla:" size="sm">
  Pegá esta URL en tu landing y en tu WhatsApp Business.
</Banner>
```

### Chip

```jsx
import { Chip } from '@/components/ui'

<Chip variant="status" color="success">Activo</Chip>
<Chip variant="status" color="warning">Trial</Chip>
<Chip variant="tag" color="success" icon="💳">MP</Chip>
<Chip variant="count" color="info">3</Chip>
<Chip variant="check" color="success">WA</Chip>
<Chip variant="check" color="muted">Billetera</Chip>
```

### Section / Card / PageHeader

```jsx
import { PageContainer, PageHeader, SectionHeader, Card } from '@/components/ui'

<PageContainer>
  <PageHeader
    title="Clientes"
    subtitle="Gestión de tus clientes. Cada cliente tiene su propia línea..."
    actions={
      <>
        <SegmentedControl value={view} onChange={setView} options={[...]}/>
        <Button variant="primary" icon="+">Nuevo cliente</Button>
      </>
    }
  />

  <StatGrid>...</StatGrid>

  <SectionHeader title="Últimos registros" subtitle="7 días" right={<Chip>12</Chip>}/>

  <Card padding={20} hoverable accent="success">
    ...
  </Card>
</PageContainer>
```

### EmptyState (nuevo en S13)

Reemplaza los múltiples "no hay X todavía" custom que cada página armaba a mano.

```jsx
import { EmptyState } from '@/components/ui'

{/* Default (md) — para secciones del dashboard / listas estándar */}
<EmptyState
  icon="📭"
  title="Sin conversaciones todavía"
  description="Cuando un cliente te escriba va a aparecer acá."
  cta="Conectar WhatsApp"
  onCtaClick={() => navigate('/conectar-whatsapp')}
/>

{/* Compacto — inline en una card chica, sin CTA */}
<EmptyState size="sm" title="Sin resultados" description="Probá otro filtro." />

{/* Grande — para páginas vacías (primera vez del user) */}
<EmptyState
  size="lg"
  icon="🎯"
  title="Empezá tu primera campaña"
  description="Las campañas te ayudan a reactivar leads automáticamente."
  cta="Nueva campaña"
  secondaryCta="Ver tutorial"
  onCtaClick={createCampaign}
  onSecondaryCtaClick={openTutorial}
/>
```

A11y: `role="status"` + `aria-live="polite"` para que screen readers anuncien cuando aparece. Icono decorativo marcado `aria-hidden`.

### Loading: Skeleton + Spinner (nuevo en S13)

Reemplaza el `⏳` emoji-as-spinner y los placeholders pulsantes custom de cada lista.

```jsx
import { Skeleton, SkeletonText, SkeletonCard, Spinner } from '@/components/ui'

{/* Skeleton base — placeholder pulsante */}
<Skeleton width="100%" height={20} />
<Skeleton width={120} height={36} radius="md" />
<Skeleton circle size={48} />

{/* SkeletonText — N líneas, la última es más corta */}
<SkeletonText lines={3} />

{/* SkeletonCard — avatar + título + 2 líneas (para items de lista) */}
{loading
  ? [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
  : items.map(item => <Card key={item.id}>...</Card>)
}

{/* Spinner — ring rotatorio, reemplaza ⏳ */}
<Spinner size={16} />
<Spinner size={32} color={COLORS.brand} />
```

A11y: `Skeleton` solo es `aria-hidden` (decorativo). `SkeletonText`/`SkeletonCard` envuelven en `role="status"` + `aria-label`. `Spinner` es `role="status"` con label configurable.

Las animaciones se inyectan UNA SOLA VEZ via `<style>` al primer mount — sin dependencia de Tailwind ni CSS global.

## Patrón de migración por pantalla

1. Cambiar `const C = {...}` → `import { COLORS as C } from '@/theme/tokens'`
   (Backward-compatible — todo sigue funcionando)
2. Reemplazar header custom por `<PageHeader>`
3. Reemplazar stat cards custom por `<StatGrid> + <StatCard>`
4. Reemplazar tabs custom por `<TabBar>`
5. Reemplazar banners/avisos custom por `<Banner>`
6. Reemplazar botones custom por `<Button variant>`
7. Reemplazar chips/pills custom por `<Chip variant>`
8. Reemplazar empty states custom por `<EmptyState>`
9. Reemplazar loaders / skeletons custom por `<Skeleton>` / `<Spinner>`
10. Verificar consistencia visual con el resto de la app
