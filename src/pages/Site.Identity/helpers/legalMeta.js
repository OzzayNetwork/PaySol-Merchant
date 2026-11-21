// ---------------------------------------------------------------
// Settings › Legal & Terms (10 Nov 2026): looks and words shared by the page,
// its modals and the document picker. Data comes from src/api/legal.js.
// ---------------------------------------------------------------
import { format, parseISO, isValid } from 'date-fns'

/** Each document's icon (outline idle, filled when chosen) and colours. Unknown keys get the file look. */
export const DOC_LOOK = {
  terms: { icon: 'ri:scales-3-line', iconActive: 'ri:scales-3-fill', tint: '#E8F0FE', fg: '#2164F3' },
  privacy: { icon: 'ri:shield-user-line', iconActive: 'ri:shield-user-fill', tint: '#E3F5EC', fg: '#1E7F45' },
  refund: { icon: 'ri:refund-2-line', iconActive: 'ri:refund-2-fill', tint: '#FEF3E2', fg: '#B4620A' },
  dpa: { icon: 'ri:lock-line', iconActive: 'ri:lock-fill', tint: '#F3E8FD', fg: '#7B4FC9' },
}
export const lookOf = (key) => DOC_LOOK[key] ?? { icon: 'ri:file-text-line', iconActive: 'ri:file-text-fill', tint: '#EFF2F7', fg: '#495057' }

/** A version's state (from the API's `state`): pill colours and the timeline dot. */
export const STATE_LOOK = {
  current: { label: 'Published', bg: '#E3F5EC', fg: '#1E7F45', dot: '#34C38F' },
  scheduled: { label: 'Scheduled', bg: '#FEF3E2', fg: '#8A5500', dot: '#F1B44C' },
  draft: { label: 'Draft', bg: '#EFF2F7', fg: '#495057', dot: '#ADB5BD' },
  replaced: { label: 'Replaced', bg: '#EFF2F7', fg: '#6C7083', dot: '#CED4DA' },
  cancelled: { label: 'Cancelled', bg: 'rgba(244,106,106,.14)', fg: '#B42318', dot: '#F46A6A' },
}
export const stateOf = (s) => STATE_LOOK[s] ?? STATE_LOOK.draft

/** Who a version applies to. */
export const GROUPS = ['owners', 'staff', 'admins']
export const GROUP_LABEL = { owners: 'Business owners', staff: 'Business staff with a login', admins: 'PaySol admins' }
export const GROUP_SHORT = { owners: 'owners', staff: 'staff', admins: 'admins' }

/** How an acceptance was given. */
export const METHOD_LABEL = {
  activation: 'Account activation',
  sign_in_prompt: 'Pop-up at sign-in',
  console_prompt: 'Console pop-up',
  paper: 'Signed paper',
}

// ---- Dates ----
const toDate = (v) => {
  if (!v) return null
  const d = typeof v === 'string' ? parseISO(v) : new Date(v)
  return isValid(d) ? d : null
}
/** "10 Dec 2026" */
export const day = (v) => (toDate(v) ? format(toDate(v), 'd MMM yyyy') : '')
/** "10 Dec 2026, 09:12" */
export const dayTime = (v) => (toDate(v) ? format(toDate(v), 'd MMM yyyy, HH:mm') : '')
/** YYYY-MM-DD for a date input */
export const inputDay = (v) => (toDate(v) ? format(toDate(v), 'yyyy-MM-dd') : '')

/** "Business owners and PaySol admins" */
export const audienceWords = (list = []) => {
  const words = list.map((g) => GROUP_LABEL[g] ?? g)
  if (words.length < 2) return words[0] ?? 'nobody'
  return `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}`
}

export const initialsOf = (name = '') => String(name).trim().split(/\s+/).map((x) => x[0] ?? '').join('').slice(0, 2).toUpperCase() || '?'

/** Avatar colours, picked from the name so a person keeps theirs between pages. */
const TINTS = [['#E8F0FE', '#2164F3'], ['#E3F5EC', '#1E7F45'], ['#F3E8FD', '#7B4FC9'], ['#FEF3E2', '#B4620A'], ['#E6F6F8', '#0F7C8A']]
export const tintOf = (name = '') => {
  let h = 0
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return TINTS[h % TINTS.length]
}

/**
 * The document's status for the dropdown and the pill beside it:
 * { label, bg, fg, short } — e.g. "v4 scheduled" / "v3 · v4 from 10 Dec 2026".
 */
export function docStatus(doc, requireReview = true) {
  if (!doc) return { label: '', bg: '', fg: '', short: '' }
  const c = doc.current, s = doc.scheduled, d = doc.draft
  const draftNote = d ? ` · draft v${d.version}` : ''
  if (s) {
    return { label: `v${s.version} scheduled`, ...pick('scheduled'), short: `${c ? `v${c.version} · ` : ''}v${s.version} from ${day(s.effective_at)}` }
  }
  if (c && !doc.requires_acceptance) return { label: 'Notice only', bg: '#E6F6F8', fg: '#0F7C8A', short: `v${c.version} · shown, not accepted${draftNote}` }
  if (c) return { label: 'Published', ...pick('current'), short: `v${c.version}${doc.requires_acceptance ? ' · acceptance required' : ''}${draftNote}` }
  if (d) {
    const blocked = (d.placeholders?.length ?? 0) > 0 || (requireReview && !d.reviewed_at)
    return blocked
      ? { label: 'Needs work', bg: '#FEF3E2', fg: '#8A5500', short: `Draft v${d.version} · not published` }
      : { label: 'Ready to publish', ...pick('draft'), short: `Draft v${d.version} · not published` }
  }
  return { label: 'Empty', ...pick('draft'), short: 'No version yet' }
}
const pick = (state) => ({ bg: stateOf(state).bg, fg: stateOf(state).fg })

/** Why a draft can't be published yet (empty list = it can). */
export function publishBlockers(doc, requireReview = true) {
  const d = doc?.draft
  if (!d) return ['There is no draft to publish.']
  const out = []
  if (doc.scheduled) out.push(`Version ${doc.scheduled.version} is already scheduled. Cancel it first.`)
  if (d.placeholders?.length) out.push(`Fill ${d.placeholders.length} ${d.placeholders.length === 1 ? 'placeholder' : 'placeholders'} first.`)
  if (requireReview && !d.reviewed_at) out.push("Record a lawyer's review first.")
  return out
}

// ---- Document text ----
// The body is simple Markdown (headings, paragraphs, "- " lists, **bold**, a
// "---" rule). Everything is escaped first, so nothing in the text can become
// markup; then the few patterns become tags and [PLACEHOLDERS] are marked.
const PLACEHOLDER = /\[[A-Z][A-Z0-9 _\-/]{1,60}\]/g
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const inline = (s) => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(PLACEHOLDER, (m) => `<mark class="legal-ph">${m}</mark>`)

export function renderLegal(body = '') {
  const out = []
  let para = []
  let list = []
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = [] } }
  const flushList = () => { if (list.length) { out.push(`<ul>${list.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`); list = [] } }
  for (const raw of String(body).split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) { flushPara(); flushList(); continue }
    const h = line.match(/^(#{1,3})\s+(.*)$/)
    if (h) { flushPara(); flushList(); out.push(`<h${h[1].length + 2}>${inline(h[2])}</h${h[1].length + 2}>`); continue }
    if (/^-{3,}$/.test(line)) { flushPara(); flushList(); out.push('<hr>'); continue }
    const li = line.match(/^[-*•]\s+(.*)$/)
    if (li) { flushPara(); list.push(li[1]); continue }
    flushList(); para.push(line)
  }
  flushPara(); flushList()
  return out.join('')
}

/** Every placeholder in a text, in order, without repeats (the backend's rule). */
export const placeholdersIn = (body = '') => [...new Set(String(body).match(PLACEHOLDER) ?? [])]
