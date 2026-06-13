// ─────────────────────────────────────────────────────────────────
// <Icon /> — wrapper sobre @phosphor-icons/react.
// Resuelve un emoji o un nombre semántico al Phosphor correspondiente.
// Si no encuentra match, hace fallback al emoji original como texto
// para que NUNCA rompa la UI.
//
// Uso:
//   <Icon e="🎨" size={16} />               ← por emoji
//   <Icon name="palette" size={16} />        ← por nombre
//   <Icon e="✅" color="#4ade80" weight="bold" />
//
// Estilo por defecto: weight="regular" (line medio, redondeado).
// Match con los iconos de Claude Desktop.
//
// 17/05/2026 — Agregados al MAP para que NO caigan al fallback emoji:
//   👔 → Briefcase  (identity profesional, header sidebar)
//   📒 → Notebook   (item Contactos)
//   📔 → Notebook
// ─────────────────────────────────────────────────────────────────
import {
  // Navigation
  SquaresFour, Users, ChatCircle, ChatCircleDots, ChatsCircle,
  Wallet, Ticket, Globe, DeviceMobile, Code, Lock,
  // Status
  CheckCircle, XCircle, Warning, WarningCircle, CheckSquare,
  Check, X, CircleDashed, Spinner,
  // Money & business
  CurrencyDollar, CurrencyCircleDollar, CreditCard, Receipt,
  ShoppingCart, ShoppingBag, Storefront, ChartLineUp, ChartBar,
  Buildings, Briefcase, Package, Tag,
  // Communication
  EnvelopeSimple, Phone, PhoneCall, Megaphone, Bell, BellSlash,
  PaperPlaneTilt, Microphone, ArrowsClockwise,
  // User & people
  User, UserCircle, UserPlus, UsersThree, UserSwitch,
  // System & tech
  Gear, GearSix, Wrench, Cpu, Robot, Brain, Lightning, Database,
  Plug, FloppyDisk, FileCode, Terminal, Desktop, Browsers,
  // Files & data
  File, FileText, Files, Folder, Image, Camera, FilmStrip,
  CloudArrowDown, CloudArrowUp, DownloadSimple, UploadSimple,
  ClipboardText, Notebook, BookOpen,
  // Visual & design
  Palette, PaintBrush, MagicWand, Sparkle, Star, Heart,
  // Actions & UI
  Plus, MagnifyingGlass, Trash, PencilSimple, Eye, EyeSlash,
  Copy, Link, ListBullets, ListChecks, FunnelSimple, SortAscending,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, CaretRight, CaretLeft,
  CaretUp, CaretDown, DotsThree, DotsThreeOutline,
  // Time & calendar
  Calendar, CalendarBlank, Clock, ClockCountdown, Hourglass,
  // Key & security
  Key, KeyReturn, ShieldCheck, ShieldStar,
  // Misc
  House, Crown, Trophy, Confetti, Fire, Target, Stack, GameController,
  Smiley, ThumbsUp, HandWaving, Detective, Money, Coins,
  PushPin, Bookmark, Flag, MapPin, GraduationCap, Student,
  Question, Info, Circle, CircleHalf, Power, SignOut, Eraser, Sliders,
  HardDrives, Pulse,
  // Light bulbs etc
  Lightbulb, EnvelopeOpen,
} from '@phosphor-icons/react'

// ─────────────────────────────────────────────────────────────────
// Mapeo emoji → Phosphor.
// Si un emoji no está mapeado, el wrapper hace fallback al emoji
// como texto (no rompe nada).
// ─────────────────────────────────────────────────────────────────
const MAP = {
  // ─── Navigation / Sidebar ─────────────────────────
  '▦':         SquaresFour,
  '👥':        Users,
  '👤':        User,
  '💬':        ChatCircle,
  '💰':        Wallet,
  '🎫':        Ticket,
  '🌐':        Globe,
  '📱':        DeviceMobile,
  '👨':        UserCircle,        // 👨‍💻 (after split)
  '🔒':        Lock,
  '🔐':        Lock,
  '🏠':        House,

  // ─── Status / Validación ──────────────────────────
  '✅':        CheckCircle,
  '❌':        XCircle,
  '⚠':        Warning,
  '⚠️':       Warning,
  '✓':         Check,
  '✕':         X,
  '✗':         X,
  '☑':         CheckSquare,
  '🟢':        Circle,
  '🔴':        Circle,
  '🟡':        Circle,
  '🔵':        Circle,
  '🟣':        Circle,
  '⚪':        Circle,
  '⚫':        Circle,

  // ─── Money & Sales ────────────────────────────────
  '💸':        CurrencyDollar,
  '💵':        Money,
  '💳':        CreditCard,
  '💎':        ShieldStar,
  '🛒':        ShoppingCart,
  '🛍':        ShoppingBag,
  '🏪':        Storefront,
  '🏢':        Buildings,
  '💼':        Briefcase,
  '👔':        Briefcase,         // 17/05/2026 — identity profesional (sidebar group header)
  '📦':        Package,
  '🏷':        Tag,
  '📈':        ChartLineUp,
  '📊':        ChartBar,
  '🎁':        Package,

  // ─── Communication ────────────────────────────────
  '📧':        EnvelopeSimple,
  '📨':        EnvelopeSimple,
  '📭':        EnvelopeOpen,
  '📞':        Phone,
  '📲':        DeviceMobile,
  '📣':        Megaphone,
  '📢':        Megaphone,
  '🔔':        Bell,
  '🔕':        BellSlash,
  '🔊':        Megaphone,
  '🎙':        Microphone,
  '🔁':        ArrowsClockwise,
  '🔄':        ArrowsClockwise,

  // ─── User / People ────────────────────────────────
  '🧑':        UserCircle,
  '👋':        HandWaving,
  '👍':        ThumbsUp,
  '😊':        Smiley,
  '😌':        Smiley,
  '🙈':        EyeSlash,

  // ─── System / Tech ────────────────────────────────
  '⚙':         Gear,
  '⚙️':       Gear,
  '🤖':        Robot,
  '🧠':        Brain,
  '⚡':        Lightning,
  '🚪':        SignOut,
  '💾':        FloppyDisk,
  '💻':        Desktop,
  '🖥':        Desktop,
  '🔌':        Plug,
  '🛡':        ShieldCheck,
  '🔑':        Key,
  '🗝':        Key,
  '🚀':        Lightning,
  '🔥':        Fire,
  '✨':        Sparkle,
  '✦':         Sparkle,
  '★':         Star,
  '🎯':        Target,
  '🧩':        Stack,
  '💡':        Lightbulb,
  '📡':        Pulse,

  // ─── Files & Data ─────────────────────────────────
  '📋':        ClipboardText,
  '📜':        FileText,
  '📝':        PencilSimple,
  '📄':        FileText,
  '📁':        Folder,
  '📥':        DownloadSimple,
  '📤':        UploadSimple,
  '📚':        BookOpen,
  '📖':        BookOpen,
  '📒':        Notebook,          // 17/05/2026 — item "Contactos"
  '📔':        Notebook,
  '🖼':        Image,
  '🎬':        FilmStrip,
  '🎵':        Microphone,

  // ─── Visual / Design ──────────────────────────────
  '🎨':        Palette,
  '🖌':        PaintBrush,
  '✍':         PencilSimple,
  '✏':         PencilSimple,
  '✎':         PencilSimple,
  '❤':         Heart,
  '❤️':       Heart,

  // ─── Actions & UI ─────────────────────────────────
  '➕':        Plus,
  '➖':        X,
  '➤':         CaretRight,
  '🔍':        MagnifyingGlass,
  '🗑':        Trash,
  '👁':        Eye,
  '🔗':        Link,
  '☰':         ListBullets,

  // ─── Time / Calendar ──────────────────────────────
  '📅':        Calendar,
  '📆':        Calendar,
  '🗓':        CalendarBlank,
  '💤':        ClockCountdown,

  // ─── Status alerts / Security ─────────────────────
  '🚨':        WarningCircle,
  '🚫':        WarningCircle,
  '⛔':        WarningCircle,
  '❓':        Question,
  '📛':        WarningCircle,
  '📌':        PushPin,

  // ─── Misc ─────────────────────────────────────────
  '🎰':        GameController,
  '🎩':        Crown,
  '🏆':        Trophy,
  '🎉':        Confetti,
  '🎓':        GraduationCap,
  '🏫':        Buildings,
  '⏰':        Clock,
  '⏲':         Clock,
  '⏲️':       Clock,
  '🎚':        Sliders,
  '🧪':        Sparkle,
  '⚖':         Pulse,
  '🎭':        Sparkle,
  '🚚':        Package,
}

// Aliases por nombre semántico (independiente del emoji).
const NAMED = {
  dashboard:    SquaresFour,
  clients:      Users,
  chats:        ChatCircle,
  revenue:      Wallet,
  support:      Ticket,
  landings:     Globe,
  lines:        DeviceMobile,
  developers:   Code,
  privacy:      Lock,
  settings:     Gear,
  health:       Pulse,
  test:         Sparkle,
  estado:       Sliders,
  acceso:       Key,
  logs:         ClipboardText,
  config:       Gear,
  ventas:       CurrencyDollar,
  back:         ArrowLeft,
  forward:      ArrowRight,
  close:        X,
  delete:       Trash,
  edit:         PencilSimple,
  search:       MagnifyingGlass,
  add:          Plus,
  more:         DotsThree,
  copy:         Copy,
  view:         Eye,
  hide:         EyeSlash,
  link:         Link,
  refresh:      ArrowsClockwise,
  spinner:      Spinner,
  menu:         ListBullets,
}

export default function Icon({ e, name, size = 14, weight = 'regular', color, style, className }) {
  // Limpia variation selector (\uFE0F)
  const cleanE = e ? String(e).replace(/\uFE0F/g, '').trim() : null

  let Cmp = null
  if (name && NAMED[name]) Cmp = NAMED[name]
  else if (cleanE && MAP[cleanE]) Cmp = MAP[cleanE]

  if (!Cmp) {
    // Fallback: render del emoji original como texto (no rompe nada)
    if (e) {
      return (
        <span
          className={className}
          style={{ fontSize: size, lineHeight: 1, display: 'inline-flex', alignItems: 'center', ...style }}
        >
          {e}
        </span>
      )
    }
    return null
  }

  return <Cmp size={size} weight={weight} color={color} style={style} className={className} />
}

// Atajos para no escribir <Icon e="..." /> en cada lugar
export const Ic = Icon
