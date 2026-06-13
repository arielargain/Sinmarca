// Design System Innovate.ia v1 — UI components
// Import todos desde acá: import { Button, StatCard, TabBar, ... } from '@/components/ui'

export { default as Button, IconButton } from './Button'
export { default as StatCard, StatGrid } from './StatCard'
export { default as TabBar, SegmentedControl } from './TabBar'
export { default as Banner } from './Banner'
export { default as Chip } from './Chip'
export { PageHeader, SectionHeader, Card, PageContainer } from './Section'

// 16/05/2026 (S13): nuevos componentes
export { default as EmptyState } from './EmptyState'
export { Skeleton, SkeletonText, SkeletonCard, Spinner } from './Loading'

// Re-export de tokens para cuando se necesiten colores sueltos
export { COLORS, RADIUS, SHADOW, SPACING, FONT, FONT_SIZE, FONT_WEIGHT, TRANSITION, Z } from '../../theme/tokens'
