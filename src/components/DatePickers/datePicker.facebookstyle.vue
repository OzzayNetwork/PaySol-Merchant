<template>
    <div class="fb-wrapper" ref="wrapper">

        <!-- Trigger: a page header's white button with the calendar icon (variant="header",
             the Overview), shorter as the screen narrows and only the icon on phones -->
        <button v-if="variant === 'header'" type="button" class="trigger btn btn-white header-btn d-flex align-items-center justify-content-center gap-2 flex-nowrap"
            aria-haspopup="dialog" :aria-expanded="showDropdown" title="Choose dates" :aria-label="`Dates: ${label}`" @click="toggleDropdown">
            <Icon :icon="showDropdown ? 'ri:calendar-fill' : 'ri:calendar-line'" class="fs-4 d-flex" />
            <span class="d-none d-lg-inline fw-semibold text-truncate">{{ label }}</span>
            <span class="d-none d-sm-inline d-lg-none fw-semibold text-nowrap">{{ rangeLabel }}</span>
            <i class="mdi mdi-chevron-down d-none d-sm-inline"></i>
        </button>
        <!-- Trigger: a toolbar's light button (default; Messages, Activity Log, Change History) -->
        <button v-else type="button" class="trigger d-flex align-items-center fw-semibold btn btn-light waves-effect gap-2 fb-date-btn" @click="toggleDropdown">
            <i class="mdi mdi-calendar-range text-muted fs-4 align-middle"></i>
            <span class="text-black">{{ label }}</span>
            <i class="mdi mdi-chevron-down fs-4 text-muted"></i>
        </button>

        <!-- On phones the sheet goes on <body>: inside the page wrapper, "fixed" is placed
             against the wrapper and the sheet opened below the screen -->
        <Teleport to="body" :disabled="!isPhone">
        <!-- Phones: a dimmed backdrop behind the sheet; a tap on it closes -->
        <div v-if="showDropdown" class="fb-backdrop d-sm-none" @click="showDropdown = false"></div>

        <!-- Dropdown: under the button, opening leftwards when there is no room on the right;
             a sheet along the bottom of the screen on phones -->
        <div v-if="showDropdown" ref="panel" class="dropdown" :style="isPhone ? null : { left: `${panelLeft}px` }" role="dialog" aria-label="Choose dates">

            <!-- Presets -->
            <div v-if="!showCalendar" class="fw-semibold">
                <div v-for="p in presets" :key="p.label" class="preset" @click="selectPreset(p)">
                    <span>{{ p.label }}</span>
                    <span class="radio" :class="{ active: isActive(p) }"></span>
                </div>

                <div class="preset custom" @click="openCustom">
                    Custom →
                </div>
            </div>

            <!-- Calendar -->
            <div v-else class="calendar-panel">
                <VueDatePicker 
                    v-model="tempDate" 
                    range 
                    inline 
                    :enable-time-picker="enableTime" 
                    :auto-apply="true"
                    :range-hover="true" 
                    @update:model-value="onInternalUpdate"
                    
                />

                <div class="actions d-flex flex-column  justify-end px-3 pb-3">
                    <div class="range-preview w-100 text-right mb-3 small text-muted fw-normal">
                        {{ previewLabel }}
                    </div>

                    <div class="buttons w-100 text-right display-flex justify-content-end gap-3">
                        <button @click="showCalendar = false" class="btn btn-link text-black waves-effect fw-normal px-3">Back</button>
                        <button class="apply btn btn-primary fw-normal px-4" @click="applyCustom">Apply</button>
                    </div>
                </div>
            </div>

        </div>
        </Teleport>

    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { Icon } from '@iconify/vue';
import { subDays } from 'date-fns';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

const props = defineProps({
  dateFrom: Date,
  dateTo: Date,
  customRangeTitle: {
    type: String,
    default: "Custom"
  },
  // 'light' (toolbar button) or 'header' (white button with the calendar icon, as on the Overview)
  variant: {
    type: String,
    default: "light"
  }
})
//alert("dateFrom: " + props.dateFrom + ", dateTo: " + props.dateTo)

const emit = defineEmits(["update:dateFrom", "update:dateTo"])

function onDateFromChange(val) {
  emit("update:dateFrom", val)
}

function onDateToChange(val) {
  emit("update:dateTo", val)
}

// 🔥 CONFIG (clock optional)
const enableTime = ref(false);

const wrapper = ref(null);
const showDropdown = ref(false);
const showCalendar = ref(false);

const date = ref([props.dateFrom||subDays(new Date(), 29), props.dateTo||new Date()]);
const tempDate = ref(null);
const selectedPreset = ref(props.customRangeTitle);
const dateRaw = ref(date.value.map(d => d.toISOString()));

const presets = [
    { label: "Today", value: [new Date(), new Date()] },
    { label: "Last 7 days", value: [subDays(new Date(), 6), new Date()] },
    { label: "Last 14 days", value: [subDays(new Date(), 13), new Date()] },
    { label: "Last 28 days", value: [subDays(new Date(), 27), new Date()] },
    { label: "Last 30 days", value: [subDays(new Date(), 29), new Date()] },
    { label: "Last 60 days", value: [subDays(new Date(), 59), new Date()] },
    { label: "Last 90 days", value: [subDays(new Date(), 89), new Date()] }
];

const previewLabel = computed(() => {
    if (!tempDate.value || tempDate.value.length === 0) {
        return "Select date range";
    }

    const [start, end] = tempDate.value;
    return formatRange(start, end);
});

// Phones (below Bootstrap's sm): the panel is a sheet on <body>
const PHONE = '(max-width: 575.98px)';
const isPhone = ref(typeof window !== 'undefined' && window.matchMedia(PHONE).matches);
const panel = ref(null);
let phoneQuery = null;
const onPhoneChange = (e) => { isPhone.value = e.matches; };

// Where the panel starts, relative to the button, so it stays on the screen with a 12px
// margin: under the button when it fits, slid left as far as needed near the right edge,
// never past the left edge (a button near either edge, on any width)
const panelLeft = ref(0);
const PANEL_WIDTH = 300;
const EDGE = 12;

// Toggle
function toggleDropdown() {
    showDropdown.value = !showDropdown.value;
    showCalendar.value = false;
    if (showDropdown.value && wrapper.value) {
        const box = wrapper.value.getBoundingClientRect();
        const width = Math.min(PANEL_WIDTH, window.innerWidth - EDGE * 2);
        let left = 0;
        if (box.left + width > window.innerWidth - EDGE) left = window.innerWidth - EDGE - width - box.left;
        if (box.left + left < EDGE) left = EDGE - box.left;
        panelLeft.value = Math.round(left);
    }
}

// The range alone ("Oct 11 – Nov 9"), for the header button on tablets
const rangeLabel = computed(() => (date.value ? formatRange(date.value[0], date.value[1]) : "Select date"));

// Preset select
function selectPreset(p) {
    date.value = p.value;
    selectedPreset.value = p.label;

    // Emit updated dates
    emit("update:dateFrom", date.value[0]);
    emit("update:dateTo", date.value[1]);

    showDropdown.value = false;
    console.log("Selected date range:", date.value);
}

// Open custom (FIXED)
function openCustom() {
    tempDate.value = [...date.value];
    selectedPreset.value = "Custom";
    showCalendar.value = true;
}

// Apply custom (FIXED)
// Apply custom
function applyCustom() {
    if (!tempDate.value || tempDate.value.length < 2) return;

    date.value = tempDate.value;

    // Emit updated dates
    emit("update:dateFrom", date.value[0]);
    emit("update:dateTo", date.value[1]);

    showDropdown.value = false;
    showCalendar.value = false;
}

// Active state: the preset whose dates are the current range (9 Nov 2026: it used to
// follow only the last click, so on load, with "Last 30 days" in the label, no dot was filled)
function isActive(p) {
    if (!date.value?.[0] || !date.value?.[1]) return false;
    return p.value[0].toDateString() === date.value[0].toDateString()
        && p.value[1].toDateString() === date.value[1].toDateString();
}

// Label logic (FIXED for "Custom")
const label = computed(() => {
    if (!date.value) return "Select date";

    const [start, end] = date.value;

    const matchedPreset = presets.find(p =>
        p.value[0].toDateString() === start.toDateString() &&
        p.value[1].toDateString() === end.toDateString()
    );

    const rangeText = formatRange(start, end);

    if (matchedPreset) {
        return `${matchedPreset.label}: ${rangeText}`;
    }

    return `Custom: ${rangeText}`;
});

// ✅ Click outside (FIXED properly)
function handleClickOutside(e) {
    if (!wrapper.value) return;

    // The panel may be on <body> (phones), so a click in it is not "outside" either;
    // the backdrop closes it with its own click
    if (!wrapper.value.contains(e.target) && !panel.value?.contains(e.target) && !e.target.closest?.('.fb-backdrop')) {
        showDropdown.value = false;
        showCalendar.value = false;
    }
}

function formatRange(start, end) {
    const currentYear = new Date().getFullYear();

    const format = (date, includeYear = false) => {
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            ...(includeYear && { year: "numeric" })
        });
    };

    if (!start) return "Select date range";

    // Only start selected
    if (!end) {
        return `${format(start)} – …`;
    }

    const sameYear = start.getFullYear() === end.getFullYear();
    const isCurrentYear = start.getFullYear() === currentYear;

    // Same year
    if (sameYear) {
        if (isCurrentYear) {
            return `${format(start)} – ${format(end)}`;
        } else {
            return `${format(start)} – ${format(end, true)}`;
        }
    }

    // Different years
    return `${format(start, true)} – ${format(end, true)}`;
}



onMounted(() => {
    document.addEventListener("mousedown", handleClickOutside);
    // Follow the screen across the phone breakpoint (rotating, resizing)
    phoneQuery = window.matchMedia(PHONE);
    phoneQuery.addEventListener("change", onPhoneChange);
});

onBeforeUnmount(() => {
    document.removeEventListener("mousedown", handleClickOutside);
    phoneQuery?.removeEventListener("change", onPhoneChange);
});
</script>
<style scoped>
.fb-wrapper {
    position: relative;
    width: auto;
}

/* ❌ you had invalid CSS here */
.dp__action_buttons {
    display: none;
}

.dp__menu {
    border: none;
    font-size: 45px;
}

.trigger {    
    cursor: pointer;   
}

.fb-date-btn {
    border: 1px solid #ced4da !important;
    background-color: #f8f9fa;
    min-height: 40px;
    padding: 0.47rem 0.85rem;
    border-radius: 0.25rem;
}

.fb-date-btn:hover {
    background-color: #eff2f7;
    border-color: #b0b8c1 !important;
}

.dropdown {
    position: absolute;
    top: 50px;
    width: 300px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 10px;
    z-index: 1050;
}

.preset {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    cursor: pointer;
}

.preset:hover {
    background: #f0f2f5;
}

.radio {
    width: 16px;
    height: 16px;
    border: 2px solid #ccc;
    border-radius: 50%;
}

.radio.active {
    border-color: #1877f2;
    background: #1877f2;
}

.custom {
    border-top: 1px solid #eee;
    margin-top: 8px;
}

.calendar-panel {
    padding-top: 0px;
}

.actions {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
}

.apply {
    background: #1877f2;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
}

.actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 10px;
}

.range-preview {
    font-size: 13px;
    color: #65676b;
}

.buttons {
    display: flex;
    gap: 8px;
}

.range-preview {
    font-weight: 500;
    color: #050505;
}

/* 9 Nov 2026: responsive. Never wider than the screen; placed on screen by `panelLeft` */
.dropdown {
    max-width: calc(100vw - 24px);
}
/* The header button sits in a page title row: the panel starts just under it */
.header-btn ~ .dropdown {
    top: calc(100% + 8px);
}
.fb-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, .35);
    z-index: 1049;
}

/* Phones: a sheet along the bottom of the screen, scrolling when the calendar is taller than it */
@media (max-width: 575.98px) {
    .dropdown {
        position: fixed;
        left: 12px;
        right: 12px;
        top: auto;
        bottom: 12px;
        width: auto;
        max-width: none;
        max-height: 80vh;
        overflow-y: auto;
        z-index: 1050;
        box-shadow: 0 -4px 24px rgba(0, 0, 0, .18);
    }
    /* The range calendar uses the sheet's width */
    .calendar-panel :deep(.dp__main),
    .calendar-panel :deep(.dp__menu) {
        width: 100%;
    }
    .calendar-panel :deep(.dp__instance_calendar) {
        width: 100%;
    }
}
</style>
