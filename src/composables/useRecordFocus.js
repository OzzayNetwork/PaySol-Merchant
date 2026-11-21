// ---------------------------------------------------------------
// useRecordFocus — brings a record picked somewhere else (the global
// search) into a list page that opens its records in a side panel
// (Leads, Business Registry, Product Catalogue).
//
// The link carries three things in the query, so refresh, Back / Forward
// and a shared link all work:
//   ?q=<text>     the name the admin saw; it goes into the page's own
//                 search box, so the list shows the record and the admin
//                 can carry on searching as usual
//   ?open=<id>    the record itself, by its id: the details panel opens on
//                 exactly that record, even when two share a name or the
//                 record sits on a later page of the list
//   ?do=<action>  a one-off action ("add", "compose"…), read once and then
//                 removed from the address, so a refresh doesn't repeat it
//
// `open` stays in the address while the panel is open and is removed when
// the panel closes (q stays, so the list keeps the search).
//
// Usage in a page:
//   const focus = useRecordFocus({ searchQuery, asideId: 'leadDetailsAside',
//                                  reload: () => getLeads(), rows: leads, open: openDetails })
//   focus.applySearch()                 // before the first fetch
//   await getLeads(); focus.openFocused()
//   const action = focus.takeAction()   // e.g. 'add'
//   <tr :class="{ 'record-focused': focus.isFocused(row) }">
// ---------------------------------------------------------------
import { ref, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Ids that are whole numbers go back as numbers, so they compare equal to the API's
const asId = (v) => (/^\d+$/.test(String(v)) ? Number(v) : String(v))

export function useRecordFocus({ searchQuery, asideId, reload, rows, open }) {
    const route = useRoute()
    const router = useRouter()

    // The record brought in (kept after the panel closes, so its row stays marked)
    const focusId = ref(route.query.open != null ? String(route.query.open) : null)

    /** Put the carried text in the page's search box (call before the first fetch). */
    function applySearch() {
        const q = typeof route.query.q === 'string' ? route.query.q.trim() : ''
        if (q && searchQuery) searchQuery.value = q
    }

    /**
     * Open the carried record's panel. The row from the list is used when it
     * is loaded; otherwise just its id, and the panel loads the full record
     * itself (every one of these panels fetches by id).
     */
    function openFocused() {
        if (!focusId.value || !open) return
        const list = rows?.value || []
        const row = list.find((r) => String(r.id) === focusId.value)
        open(row || { id: asId(focusId.value) })
        listenForClose()
    }

    /** True for the row that was brought in (the page marks it). */
    const isFocused = (row) => !!focusId.value && String(row?.id) === focusId.value

    /** The one-off action asked for, if any; removed from the address once read. */
    function takeAction() {
        const action = typeof route.query.do === 'string' ? route.query.do : ''
        if (!action) return ''
        const query = { ...route.query }
        delete query.do
        router.replace({ path: route.path, query })
        return action
    }

    // ---- The panel closes: drop `open` from the address ----
    let asideEl = null
    function onHidden() {
        if (route.query.open == null) return
        const query = { ...route.query }
        delete query.open
        router.replace({ path: route.path, query })
    }
    function listenForClose() {
        const el = asideId ? document.getElementById(asideId) : null
        if (!el || el === asideEl) return
        asideEl?.removeEventListener('hidden.bs.offcanvas', onHidden)
        asideEl = el
        asideEl.addEventListener('hidden.bs.offcanvas', onHidden)
    }

    // ---- Another record picked while already on this page (the page is not re-created) ----
    watch(() => [route.query.open, route.query.q], async ([openId, q], [prevOpen, prevQ]) => {
        if (openId === prevOpen && q === prevQ) return
        if (openId == null) return                 // the panel was closed: nothing to do
        focusId.value = String(openId)
        if (q !== prevQ) {
            applySearch()
            if (reload) await reload()
        }
        openFocused()
    })

    onBeforeUnmount(() => asideEl?.removeEventListener('hidden.bs.offcanvas', onHidden))

    return { focusId, applySearch, openFocused, isFocused, takeAction }
}
