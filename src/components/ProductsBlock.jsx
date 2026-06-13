import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import {
  Button, Banner, COLORS as C, RADIUS, FONT_SIZE, FONT_WEIGHT, TRANSITION,
} from './ui'

/**
 * ProductsBlock — catálogo universal para TODOS los identities.
 *
 * - casino/profesional/marketing: servicios, paquetes, turnos
 * - tienda: productos físicos y digitales
 * Todos pueden tener delivery_link → el bot lo envía automáticamente post-pago.
 *
 * RPCs: list/upsert/delete_my_(sub_)tenant_product
 * Nuevos campos: product_type, delivery_link, delivery_message
 */

const PRODUCT_BUCKET = 'products'

const IDENTITY_CONFIG = {
  casino:      { icon: '🎰', label: 'Servicios / Paquetes', noun: 'servicio', btnLabel: '+ Nuevo servicio' },
  tienda:      { icon: '🛒', label: 'Catálogo de productos', noun: 'producto', btnLabel: '+ Nuevo producto' },
  marketing:   { icon: '📣', label: 'Servicios / Paquetes', noun: 'servicio', btnLabel: '+ Nuevo servicio' },
  profesional: { icon: '👔', label: 'Servicios / Turnos',   noun: 'servicio', btnLabel: '+ Nuevo servicio' },
}

const PRODUCT_TYPE_LABELS = {
  physical: { icon: '📦', label: 'Físico (envío)' },
  digital:  { icon: '🔗', label: 'Digital (link automático)' },
  service:  { icon: '🤝', label: 'Servicio / Consultoría' },
  slot:     { icon: '📅', label: 'Turno / Reserva' },
}

export default function ProductsBlock({ tenant, subTenant, onChanged }) {
  const entity = tenant || subTenant
  if (!entity?.id) return null

  const isSub     = !!subTenant
  const identity  = entity.identity || 'casino'
  const iCfg      = IDENTITY_CONFIG[identity] || IDENTITY_CONFIG.casino

  const [products, setProducts]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)
  const [authUid, setAuthUid]             = useState(null)
  const [editing, setEditing]             = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const rpc = isSub ? 'list_my_sub_tenant_products' : 'list_my_tenant_products'
      const { data, error: e } = await supabase.rpc(rpc, { p_only_active: false })
      if (e) throw e
      setProducts(data || [])
    } catch (e) {
      setError(e.message || 'No se pudieron cargar los productos.')
    } finally {
      setLoading(false)
    }
  }, [isSub])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data?.user?.id) setAuthUid(data.user.id) })
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const ownerOf = products.find(p => p.owner_user_id)
  const isOwner = !ownerOf || (authUid && ownerOf.owner_user_id === authUid)

  async function handleSave(form) {
    const rpc = isSub ? 'upsert_my_sub_tenant_product' : 'upsert_my_tenant_product'
    const args = {
      p_id:               form.id || null,
      p_name:             form.name,
      p_description:      form.description || null,
      p_price_ars:        parseInt(form.price_ars, 10),
      p_image_url:        form.image_url || null,
      p_image_path:       form.image_path || null,
      p_stock:            form.stock_unlimited ? null : parseInt(form.stock || 0, 10),
      p_active:           form.active !== false,
      p_sort_order:       parseInt(form.sort_order || 0, 10),
      p_product_type:     form.product_type || 'physical',
      p_delivery_link:    form.delivery_link?.trim() || null,
      p_delivery_message: form.delivery_message?.trim() || null,
    }
    if (isSub) args.p_sub_tenant_id = subTenant?.id
    const { data, error: e } = await supabase.rpc(rpc, args)
    if (e) throw e
    setEditing(null)
    await fetchProducts()
    if (onChanged) await onChanged(data)
  }

  async function handleDelete(id) {
    const rpc = isSub ? 'delete_my_sub_tenant_product' : 'delete_my_tenant_product'
    const { error: e } = await supabase.rpc(rpc, { p_id: id })
    if (e) throw e
    setConfirmDelete(null)
    await fetchProducts()
    if (onChanged) await onChanged()
  }

  async function toggleActive(p) {
    try {
      const rpc = isSub ? 'upsert_my_sub_tenant_product' : 'upsert_my_tenant_product'
      const args = { p_id: p.id, p_active: !p.active }
      if (isSub) args.p_sub_tenant_id = subTenant?.id
      const { error: e } = await supabase.rpc(rpc, args)
      if (e) throw e
      await fetchProducts()
    } catch (e) { setError(e.message) }
  }

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg, padding: 20, marginBottom: 18 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{iCfg.icon}</span> {iCfg.label}
          </h3>
          <p style={{ margin: '6px 0 0', fontSize: FONT_SIZE.sm, color: C.muted, lineHeight: 1.5 }}>
            El bot muestra el catálogo, genera el link de pago y entrega activos digitales automáticamente al pago confirmado.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setEditing('new')}
          disabled={loading || !isOwner} title={!isOwner ? 'Solo el owner puede editar' : undefined}>
          {iCfg.btnLabel}
        </Button>
      </div>

      {/* Info digital */}
      <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(56,189,248,0.06)',
        border: '1px solid rgba(56,189,248,0.2)', borderRadius: RADIUS.md }}>
        <p style={{ margin: 0, fontSize: FONT_SIZE.xs, color: '#38bdf8', lineHeight: 1.6 }}>
          <strong>💡 Activos digitales:</strong> si cargás un link en el campo "Link de entrega", el bot lo envía
          automáticamente al cliente cuando el pago es confirmado por Mercado Pago. Funciona para cursos, PDFs,
          grupos de WA, software, credenciales, etc.
        </p>
      </div>

      {error && <Banner variant="danger" size="sm" title="Error">{error}</Banner>}

      {!isOwner && (
        <div style={{ marginBottom: 12 }}>
          <Banner variant="warning" size="sm" title="Configurado por otro usuario">
            Los productos fueron creados por otro miembro. Pediles que te transfieran la edición.
          </Banner>
        </div>
      )}

      {loading && <div style={{ color: C.muted, fontSize: FONT_SIZE.sm, padding: '14px 0' }}>Cargando…</div>}

      {!loading && products.length === 0 && (
        <div style={{ padding: '24px 14px', border: `1px dashed ${C.border}`, borderRadius: RADIUS.md,
          textAlign: 'center', color: C.muted, fontSize: FONT_SIZE.sm }}>
          Todavía no cargaste {iCfg.noun}s. Tocá <strong>{iCfg.btnLabel}</strong> para empezar.
        </div>
      )}

      {!loading && products.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 12 }}>
          {products.map(p => (
            <ProductCard key={p.id} product={p} canEdit={isOwner}
              onEdit={() => setEditing(p)} onDelete={() => setConfirmDelete(p)}
              onToggleActive={() => toggleActive(p)} />
          ))}
        </div>
      )}

      {editing && (
        <ProductEditModal
          product={editing === 'new' ? null : editing}
          isSub={isSub} tenantId={tenant?.id} subTenantId={subTenant?.id}
          identity={identity} noun={iCfg.noun}
          onClose={() => setEditing(null)} onSave={handleSave} />
      )}

      {confirmDelete && (
        <DeleteConfirmModal product={confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete.id)} />
      )}
    </div>
  )
}

// ── ProductCard ───────────────────────────────────────────────
function ProductCard({ product, canEdit, onEdit, onDelete, onToggleActive }) {
  const stockLabel = product.stock === null ? 'Stock ∞' : product.stock === 0 ? 'Sin stock' : `Stock: ${product.stock}`
  const stockColor = product.stock === 0 ? C.danger : product.stock === null ? C.muted : C.success
  const typeInfo = PRODUCT_TYPE_LABELS[product.product_type] || PRODUCT_TYPE_LABELS.physical
  const hasDelivery = !!product.delivery_link

  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, padding: 12,
      display: 'flex', flexDirection: 'column', gap: 8, opacity: product.active ? 1 : 0.55 }}>
      {/* Imagen */}
      <div style={{ aspectRatio: '4/3', background: '#0b0d12', borderRadius: RADIUS.sm, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}` }}>
        {product.image_url
          ? <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: 32, opacity: 0.3 }}>{typeInfo.icon}</span>}
      </div>

      {/* Badges de tipo */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99,
          background: 'rgba(212,168,67,0.12)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.25)',
          fontFamily: 'monospace' }}>
          {typeInfo.icon} {typeInfo.label}
        </span>
        {hasDelivery && (
          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99,
            background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)',
            fontFamily: 'monospace' }}>
            🔗 Link automático
          </span>
        )}
      </div>

      <div style={{ fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold, color: C.text, lineHeight: 1.3,
        overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {product.name}
      </div>

      <div style={{ fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: C.brand }}>
        ${(product.price_ars || 0).toLocaleString('es-AR')}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: FONT_SIZE.xs, color: stockColor, fontWeight: FONT_WEIGHT.bold }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: stockColor, display: 'inline-block' }} />
        {stockLabel}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <button type="button" onClick={onToggleActive} disabled={!canEdit} style={{
          flex: 1, background: product.active ? `${C.success}1a` : `${C.muted}1a`,
          color: product.active ? C.success : C.muted,
          border: `1px solid ${product.active ? C.success : C.muted}40`,
          borderRadius: RADIUS.sm, padding: '6px 8px', fontSize: FONT_SIZE.xs,
          cursor: canEdit ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
          fontWeight: FONT_WEIGHT.bold, transition: `all ${TRANSITION.fast}` }}>
          {product.active ? 'Activo' : 'Inactivo'}
        </button>
        <button type="button" onClick={onEdit} disabled={!canEdit} title="Editar" style={{
          background: 'transparent', color: C.text, border: `1px solid ${C.border}`,
          borderRadius: RADIUS.sm, padding: '6px 10px', fontSize: FONT_SIZE.sm,
          cursor: canEdit ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>✏️</button>
        <button type="button" onClick={onDelete} disabled={!canEdit} title="Borrar" style={{
          background: 'transparent', color: C.danger, border: `1px solid ${C.border}`,
          borderRadius: RADIUS.sm, padding: '6px 10px', fontSize: FONT_SIZE.sm,
          cursor: canEdit ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>🗑</button>
      </div>
    </div>
  )
}

// ── ProductEditModal ──────────────────────────────────────────
function ProductEditModal({ product, isSub, tenantId, subTenantId, identity, noun, onClose, onSave }) {
  const isNew = !product
  const [form, setForm] = useState(() => ({
    id:               product?.id || null,
    name:             product?.name || '',
    description:      product?.description || '',
    price_ars:        product?.price_ars ?? '',
    image_url:        product?.image_url || '',
    image_path:       product?.image_path || '',
    stock:            product?.stock ?? '',
    stock_unlimited:  product ? product.stock === null : true,
    active:           product?.active !== false,
    sort_order:       product?.sort_order ?? 0,
    product_type:     product?.product_type || (identity === 'tienda' ? 'physical' : 'service'),
    delivery_link:    product?.delivery_link || '',
    delivery_message: product?.delivery_message || '',
  }))
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [error, setError]           = useState(null)
  const fileInputRef = useRef(null)

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const isDigital = form.product_type === 'digital'

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('La imagen es demasiado grande (máx 5 MB).'); return }
    setUploading(true); setError(null)
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const uuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      const path = isSub ? `sub/${subTenantId}/${uuid}.${ext}` : `${tenantId}/${uuid}.${ext}`
      const { error: upErr } = await supabase.storage.from(PRODUCT_BUCKET).upload(path, file, { contentType: file.type || `image/${ext}`, upsert: false })
      if (upErr) throw upErr
      const { data: pub } = supabase.storage.from(PRODUCT_BUCKET).getPublicUrl(path)
      if (form.image_path && form.image_path !== path) {
        supabase.storage.from(PRODUCT_BUCKET).remove([form.image_path]).catch(() => {})
      }
      setForm(f => ({ ...f, image_url: pub.publicUrl, image_path: path }))
    } catch (e) {
      setError(e.message || 'No se pudo subir la imagen.')
    } finally { setUploading(false) }
  }

  async function submit() {
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return }
    const price = parseInt(form.price_ars, 10)
    if (!price || price <= 0) { setError('El precio debe ser mayor a 0.'); return }
    if (isDigital && !form.delivery_link?.trim()) {
      setError('Para productos digitales el link de entrega es obligatorio.'); return
    }
    if (form.delivery_link?.trim() && !/^https?:\/\//i.test(form.delivery_link.trim())) {
      setError('El link de entrega debe empezar con http:// o https://'); return
    }
    setSubmitting(true); setError(null)
    try { await onSave(form) }
    catch (e) { setError(e.message || 'No se pudo guardar.'); setSubmitting(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflow: 'auto' }}
      onMouseDown={e => { if (e.target === e.currentTarget && !submitting) onClose() }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg, padding: 22,
        maxWidth: 560, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>

        <h3 style={{ margin: '0 0 16px', fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: C.text }}>
          {isNew ? `Nuevo ${noun}` : `Editar ${noun}`}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Tipo de producto */}
          <Field label="Tipo">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {Object.entries(PRODUCT_TYPE_LABELS).map(([key, { icon, label }]) => (
                <button key={key} type="button" onClick={() => update('product_type', key)} style={{
                  padding: '8px 10px', borderRadius: RADIUS.sm, fontSize: FONT_SIZE.xs, cursor: 'pointer',
                  background: form.product_type === key ? 'rgba(212,168,67,0.12)' : C.bg,
                  border: `1px solid ${form.product_type === key ? '#D4A843' : C.border}`,
                  color: form.product_type === key ? '#D4A843' : C.muted,
                  fontFamily: 'inherit', textAlign: 'left', transition: `all ${TRANSITION.fast}` }}>
                  {icon} {label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Nombre *">
            <Input value={form.name} onChange={e => update('name', e.target.value)}
              placeholder={identity === 'casino' ? 'Pack 500 fichas' : identity === 'profesional' ? 'Consultoría inicial 1h' : 'Producto'} autoFocus />
          </Field>

          <Field label="Descripción">
            <textarea value={form.description} onChange={e => update('description', e.target.value)}
              placeholder="Descripción breve para el bot y la landing…" rows={3} style={inputStyle} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Precio ARS *">
              <Input type="number" min="1" value={form.price_ars}
                onChange={e => update('price_ars', e.target.value)} placeholder="15000" />
            </Field>
            <Field label="Orden">
              <Input type="number" value={form.sort_order} onChange={e => update('sort_order', e.target.value)} />
            </Field>
          </div>

          {/* Stock */}
          <Field label="Stock">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: FONT_SIZE.sm, color: C.text, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.stock_unlimited}
                  onChange={e => update('stock_unlimited', e.target.checked)} />
                Stock ilimitado
              </label>
              <Input type="number" min="0" value={form.stock_unlimited ? '' : form.stock}
                onChange={e => update('stock', e.target.value)}
                disabled={form.stock_unlimited} placeholder="0"
                style={{ flex: 1, minWidth: 100 }} />
            </div>
          </Field>

          {/* Entrega digital — siempre visible pero requerido si type=digital */}
          <div style={{ padding: '12px 14px', background: isDigital ? 'rgba(56,189,248,0.06)' : 'rgba(78,81,104,0.08)',
            border: `1px solid ${isDigital ? 'rgba(56,189,248,0.25)' : C.border}`,
            borderRadius: RADIUS.md }}>
            <p style={{ margin: '0 0 10px', fontSize: 10, fontWeight: FONT_WEIGHT.bold, color: isDigital ? '#38bdf8' : C.muted,
              textTransform: 'uppercase', letterSpacing: '.08em' }}>
              🔗 Entrega automática post-pago {isDigital ? '(requerido)' : '(opcional)'}
            </p>
            <Field label={`Link de entrega${isDigital ? ' *' : ''}`}>
              <Input value={form.delivery_link}
                onChange={e => update('delivery_link', e.target.value)}
                placeholder="https://drive.google.com/... o https://chat.whatsapp.com/..." />
            </Field>
            <div style={{ marginTop: 8 }}>
              <Field label="Mensaje personalizado (opcional)">
                <textarea value={form.delivery_message}
                  onChange={e => update('delivery_message', e.target.value)}
                  placeholder={`¡Gracias por tu compra! Aquí tenés tu acceso:\n\n{link}\n\n¡Cualquier consulta escribinos!`}
                  rows={3} style={inputStyle} />
              </Field>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: FONT_SIZE.xs, color: C.muted, lineHeight: 1.5 }}>
              Si dejás el mensaje vacío, el bot usa un texto por defecto. Podés usar <code style={{ background: C.bg, padding: '1px 5px', borderRadius: 4 }}>{'{link}'}</code> para insertar la URL en cualquier posición del mensaje.
            </p>
          </div>

          {/* Imagen */}
          <Field label="Imagen">
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {form.image_url
                ? <img src={form.image_url} alt="preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: RADIUS.sm, border: `1px solid ${C.border}` }} />
                : <div style={{ width: 80, height: 80, background: C.bg, border: `1px dashed ${C.border}`, borderRadius: RADIUS.sm,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, opacity: 0.4 }}>📦</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 180 }}>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading || submitting}>
                  {uploading ? 'Subiendo…' : '📷 Subir imagen'}
                </Button>
                {form.image_url && (
                  <button type="button" onClick={() => setForm(f => ({ ...f, image_url: '', image_path: '' }))}
                    style={{ background: 'transparent', border: 'none', color: C.danger, fontSize: FONT_SIZE.xs, cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                    Quitar imagen
                  </button>
                )}
              </div>
            </div>
          </Field>

          <Field label="Estado">
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: FONT_SIZE.sm, color: C.text, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.active} onChange={e => update('active', e.target.checked)} />
              Activo (visible en la landing y en el bot)
            </label>
          </Field>

          {error && <Banner variant="danger" size="sm">{error}</Banner>}
        </div>

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button variant="success" onClick={submit} disabled={submitting || uploading}>
            {submitting ? 'Guardando…' : isNew ? `Crear ${noun}` : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── DeleteConfirmModal ────────────────────────────────────────
function DeleteConfirmModal({ product, onClose, onConfirm }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState(null)
  async function go() {
    setSubmitting(true); setError(null)
    try { await onConfirm() }
    catch (e) { setError(e.message || 'No se pudo borrar.'); setSubmitting(false) }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onMouseDown={e => { if (e.target === e.currentTarget && !submitting) onClose() }}>
      <div style={{ background: C.card, border: `1px solid ${C.danger}`, borderRadius: RADIUS.lg, padding: 22, maxWidth: 440, width: '100%' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: C.danger }}>🗑 Borrar</h3>
        <p style={{ margin: '0 0 14px', color: C.text, fontSize: FONT_SIZE.sm, lineHeight: 1.5 }}>
          Vas a borrar <strong>{product.name}</strong>. Esta acción no se puede deshacer.
        </p>
        {error && <Banner variant="danger" size="sm">{error}</Banner>}
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancelar</Button>
          <Button variant="danger" onClick={go} disabled={submitting}>{submitting ? 'Borrando…' : 'Sí, borrar'}</Button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────
const inputStyle = {
  width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: RADIUS.md,
  padding: '9px 11px', color: C.text, fontSize: FONT_SIZE.md, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box', transition: `border-color ${TRANSITION.fast}`,
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: FONT_WEIGHT.bold, color: C.muted,
        textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 5 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Input({ style: extra, ...rest }) {
  return <input style={{ ...inputStyle, ...extra }} {...rest} />
}
