<script setup>
// ---------------------------------------------------------------
// TrendCompareChart — one line over time against the same line for the
// period before (dashed, grey), in Highcharts. Built for the Overview cards'
// chart, usable by any page that compares two periods.
//
// Smooth by design: the chart is created once and then moved to new data
// (setData + redraw with an animation), so picking another card or range
// glides instead of flashing a new chart. It follows its container's width
// (ResizeObserver), so a panel opening beside it reflows it too.
//
// points: [{ label, value, previous }]  (value / previous may be null: a gap)
// `step` draws counts that change in jumps (businesses live) as steps.
// No API calls. Shown on /test-page.
// ---------------------------------------------------------------

// Components
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import Highcharts from 'highcharts'

const props = defineProps({
    points: { type: Array, default: () => [] },
    name: { type: String, default: 'This period' },
    previousName: { type: String, default: 'The period before' },
    compare: { type: Boolean, default: true },              // draw the dashed line
    step: { type: Boolean, default: false },                // stepped line for counts
    color: { type: String, default: '#556ee6' },
    height: { type: Number, default: 260 },
    format: { type: Function, default: (n) => Math.round(n).toLocaleString('en-KE') },        // tooltip
    axisFormat: { type: Function, default: (n) => Math.round(n).toLocaleString('en-KE') },    // y axis
})

// Chart state
const el = ref(null)
let chart = null
let resizer = null
const ANIM = { duration: 450, easing: 'easeOutQuad' }

// ---- Build the series from the points ----
function seriesData() {
    const cur = props.points.map((p) => (p.value === null || p.value === undefined ? null : Number(p.value)))
    const prev = props.points.map((p) => (p.previous === null || p.previous === undefined ? null : Number(p.previous)))
    return { cur, prev, labels: props.points.map((p) => p.label) }
}

function hexToRgba(hex, a) {
    const h = hex.replace('#', '')
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

// ---- Create once ----
function create() {
    const { cur, prev, labels } = seriesData()
    const fmt = props.format
    const axisFmt = props.axisFormat
    chart = Highcharts.chart(el.value, {
        chart: { height: props.height, backgroundColor: 'transparent', spacing: [10, 4, 6, 0], style: { fontFamily: 'inherit' }, animation: ANIM },
        title: { text: null },
        credits: { enabled: false },
        legend: { align: 'right', verticalAlign: 'top', floating: false, itemStyle: { fontSize: '12px', fontWeight: '500', color: '#495057' }, symbolRadius: 0 },
        xAxis: {
            categories: labels,
            lineWidth: 0,
            tickLength: 0,
            // One line per label; when they crowd, Highcharts shows every other one
            labels: { style: { color: '#74788d', fontSize: '11px', whiteSpace: 'nowrap', textOverflow: 'none' }, autoRotation: false },
            // As many labels as fit (one per ~64 px), evenly spaced; worked out
            // again on every redraw and resize, so a narrow chart never overlaps
            tickPositioner() {
                const n = this.categories?.length || 0
                const fit = Math.max(2, Math.floor((this.len || 600) / 64))
                const step = Math.max(1, Math.ceil(n / fit))
                const out = []
                for (let i = 0; i < n; i += step) out.push(i)
                return out
            },
            crosshair: { color: '#e3e7ee', width: 1 },
        },
        yAxis: {
            title: { text: null },
            gridLineColor: '#eef0f4',
            gridLineDashStyle: 'Dash',
            min: 0,
            softMin: 0,
            allowDecimals: false,
            labels: { style: { color: '#74788d', fontSize: '11px' }, formatter() { return axisFmt(this.value) } },
        },
        tooltip: {
            shared: true,
            useHTML: true,
            backgroundColor: '#ffffff',
            borderColor: '#e3e7ee',
            borderRadius: 6,
            shadow: { color: 'rgba(15,34,58,.08)', offsetX: 0, offsetY: 4, width: 12 },
            padding: 10,
            formatter() {
                const rows = this.points.map((p) => `<div style="display:flex;justify-content:space-between;gap:16px;font-size:12px">
                    <span style="color:#74788d"><span style="display:inline-block;width:8px;height:8px;background:${p.series.color};margin-right:6px"></span>${p.series.name}</span>
                    <b style="color:#343a40">${p.y === null ? '—' : fmt(p.y)}</b></div>`).join('')
                return `<div style="font-size:11px;color:#74788d;margin-bottom:4px">${this.x}</div>${rows}`
            },
        },
        plotOptions: {
            series: { animation: { duration: 600 }, marker: { enabled: false, states: { hover: { enabled: true, radius: 4 } } }, connectNulls: false, states: { inactive: { opacity: 1 } } },
        },
        series: [
            {
                type: 'area', name: props.name, data: cur, color: props.color, lineWidth: 2.5, step: props.step ? 'left' : undefined,
                fillColor: { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, hexToRgba(props.color, 0.22)], [1, hexToRgba(props.color, 0.01)]] },
            },
            {
                type: 'line', name: props.previousName, data: prev, color: '#b9bfcc', lineWidth: 1.5, dashStyle: 'ShortDash',
                step: props.step ? 'left' : undefined, visible: props.compare, showInLegend: props.compare,
            },
        ],
    })
}

// ---- Move to new data without rebuilding (the smooth part) ----
function update() {
    if (!chart) return
    const { cur, prev, labels } = seriesData()
    chart.xAxis[0].setCategories(labels, false)
    chart.series[0].update({ name: props.name, color: props.color, step: props.step ? 'left' : undefined,
        fillColor: { linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 }, stops: [[0, hexToRgba(props.color, 0.22)], [1, hexToRgba(props.color, 0.01)]] } }, false)
    chart.series[1].update({ name: props.previousName, step: props.step ? 'left' : undefined, visible: props.compare, showInLegend: props.compare }, false)
    // Same number of points: values glide; a different count: Highcharts re-lays the line
    chart.series[0].setData(cur, false, ANIM, cur.length === chart.series[0].points.length)
    chart.series[1].setData(prev, false, ANIM, prev.length === chart.series[1].points.length)
    chart.yAxis[0].update({ labels: { formatter() { return props.axisFormat(this.value) } } }, false)
    chart.redraw(ANIM)
}

// ---- Lifecycle ----
onMounted(() => {
    create()
    // Follow the container's width (a side panel opening, the sidebar collapsing)
    resizer = new ResizeObserver(() => chart?.reflow())
    resizer.observe(el.value)
})

watch(() => [props.points, props.name, props.previousName, props.compare, props.step, props.color, props.format, props.axisFormat], update, { deep: true })

onBeforeUnmount(() => {
    resizer?.disconnect()
    chart?.destroy()
    chart = null
})
</script>

<template>
    <!-- The chart draws into this box -->
    <div ref="el" class="w-100" :style="{ height: `${height}px` }" role="img" :aria-label="`${name} chart`"></div>
</template>
