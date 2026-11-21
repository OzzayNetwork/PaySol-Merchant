<script setup>
// ---------------------------------------------------------------
// Integration settings reference for the shared component gallery.
//
// This example makes no API calls and stores no credentials. It shows the
// monitoring, balance-alert, and secret-rotation controls expected in Manage.
// ---------------------------------------------------------------

// Components
import { computed, reactive, ref } from 'vue'

// Reference data
const providers = [
    {
        value: 'daraja',
        label: 'Safaricom Daraja',
        fields: [
            { key: 'consumerKey', label: 'Consumer key' },
            { key: 'consumerSecret', label: 'Consumer secret' },
            { key: 'shortCode', label: 'Business short code' },
            { key: 'passkey', label: 'Passkey' },
        ],
    },
    {
        value: 'sms',
        label: "Africa's Talking SMS",
        fields: [
            { key: 'smsUsername', label: 'Username' },
            { key: 'smsApiKey', label: 'API key' },
        ],
        balance: { label: 'SMS credits', available: 1420, warning: 500, critical: 150 },
    },
    {
        value: 'email',
        label: 'Transactional email',
        fields: [
            { key: 'emailApiKey', label: 'Email API key' },
            { key: 'senderAddress', label: 'Verified sender address' },
        ],
        balance: { label: 'Email sends', available: 1600, warning: 500, critical: 150 },
    },
    {
        value: 'maps',
        label: 'Google Maps Platform',
        fields: [{ key: 'mapsApiKey', label: 'Google Maps API key' }],
    },
    {
        value: 'etims',
        label: 'KRA eTIMS',
        fields: [
            { key: 'taxpayerPin', label: 'Taxpayer PIN' },
            { key: 'communicationKey', label: 'Communication key' },
        ],
    },
]

// Page state
const selectedProvider = ref('daraja')
const visibleCredentials = ref({})
const referenceMessage = ref('')

// Form state
const settings = reactive({
    credentials: {
        consumerKey: '',
        consumerSecret: '',
        shortCode: '',
        passkey: '',
        smsUsername: '',
        smsApiKey: '',
        emailApiKey: '',
        senderAddress: '',
        mapsApiKey: '',
        taxpayerPin: '',
        communicationKey: '',
    },
    frequencyMinutes: '60',
    checkType: 'reachability',
    slowResponseMs: 1000,
    failureTimeoutMs: 5000,
    availabilityThreshold: 99,
    consecutiveFailures: 2,
    balanceAlertsEnabled: true,
    balanceWarning: 500,
    balanceCritical: 150,
})

// Derived provider fields keep the example adaptable to services with or without balances.
const provider = computed(() => providers.find((item) => item.value === selectedProvider.value))
const supportsBalanceAlerts = computed(() => Boolean(provider.value?.balance))

// ---- Reference actions ----
function toggleCredentialVisibility(key) {
    visibleCredentials.value[key] = !visibleCredentials.value[key]
}

function previewCredentialUpdate() {
    const hasReplacement = provider.value.fields.some((field) => settings.credentials[field.key].trim())
    if (!hasReplacement) {
        referenceMessage.value = 'Enter a replacement value to preview the credential update.'
        return
    }

    provider.value.fields.forEach((field) => {
        settings.credentials[field.key] = ''
        visibleCredentials.value[field.key] = false
    })
    referenceMessage.value = 'Preview only. No credentials were sent or stored; connect this action to the secured backend to enable rotation.'
}

function previewMonitoringSave() {
    if (settings.failureTimeoutMs <= settings.slowResponseMs) {
        referenceMessage.value = 'The failure timeout must be greater than the slow-response threshold.'
        return
    }

    if (supportsBalanceAlerts.value && settings.balanceCritical > settings.balanceWarning) {
        referenceMessage.value = 'The critical balance must be at or below the warning threshold.'
        return
    }

    referenceMessage.value = 'Monitoring settings example saved locally on this page only.'
}
</script>

<template>
    <div class="card">
        <!-- Reference heading: identify the Manage surface and its safe preview behavior. -->
        <div class="card-header bg-white d-flex flex-wrap justify-content-between align-items-start gap-2">
            <div>
                <h2 class="h5 mb-1">Integration monitoring &amp; credentials</h2>
                <p class="small text-muted mb-1">Reference for the Integrations page’s Manage action.</p>
                <code>src/components/ReferenceIntegrationSettings.vue · API-free</code>
            </div>
            <span class="badge bg-light text-muted border" title="This reference does not call providers">Preview only</span>
        </div>

        <div class="card-body">
            <!-- Provider selector: different services require different access values. -->
            <div class="mb-4">
                <label for="reference-integration-provider" class="form-label" title="Choose which provider's settings to preview">Integration</label>
                <select id="reference-integration-provider" v-model="selectedProvider" class="form-select" title="Choose an integration to view its credential and balance settings">
                    <option v-for="item in providers" :key="item.value" :value="item.value">{{ item.label }}</option>
                </select>
            </div>

            <!-- Monitoring rules: frequency, latency, failure, and alert conditions. -->
            <section class="mb-4">
                <h3 class="h6 text-black mb-1">Availability checks &amp; alert rules</h3>
                <p class="small text-muted mb-3">Define when checks run and which results should raise an alert.</p>
                <div class="row g-3">
                    <div class="col-12 col-md-6">
                        <label for="reference-check-frequency" class="form-label" title="How often the scheduled provider check runs">Automatic test frequency</label>
                        <select id="reference-check-frequency" v-model="settings.frequencyMinutes" class="form-select" title="Choose how often to check this integration">
                            <option value="5">Every 5 minutes</option>
                            <option value="15">Every 15 minutes</option>
                            <option value="30">Every 30 minutes</option>
                            <option value="60">Every hour</option>
                        </select>
                    </div>
                    <div class="col-12 col-md-6">
                        <label for="reference-check-type" class="form-label" title="Reachability confirms response; end-to-end checks validate a service action">Test type</label>
                        <select id="reference-check-type" v-model="settings.checkType" class="form-select" title="Choose a lightweight ping or a provider-specific transaction check">
                            <option value="reachability">Availability / reachability</option>
                            <option value="transaction">End-to-end service check</option>
                        </select>
                    </div>
                    <div class="col-12 col-md-6">
                        <label for="reference-slow-response" class="form-label" title="Successful requests slower than this value are degraded">Slow response alert (ms)</label>
                        <input id="reference-slow-response" v-model.number="settings.slowResponseMs" class="form-control" type="number" min="100" step="50" title="Raise a warning after this response time">
                    </div>
                    <div class="col-12 col-md-6">
                        <label for="reference-failure-timeout" class="form-label" title="No response before this limit counts as a failed check">Failure timeout (ms)</label>
                        <input id="reference-failure-timeout" v-model.number="settings.failureTimeoutMs" class="form-control" type="number" min="250" step="100" title="Mark the integration unavailable after this timeout">
                    </div>
                    <div class="col-12 col-md-6">
                        <label for="reference-availability-target" class="form-label" title="Alert when rolling availability falls below this target">Alert below availability (%)</label>
                        <input id="reference-availability-target" v-model.number="settings.availabilityThreshold" class="form-control" type="number" min="0" max="100" step="0.1" title="Set the minimum rolling availability target">
                    </div>
                    <div class="col-12 col-md-6">
                        <label for="reference-consecutive-failures" class="form-label" title="Require repeated failures before sending an outage alert">Consecutive failures before alert</label>
                        <input id="reference-consecutive-failures" v-model.number="settings.consecutiveFailures" class="form-control" type="number" min="1" max="20" title="Set how many failed checks trigger an outage alert">
                    </div>
                </div>
            </section>

            <!-- Balance thresholds: shown only for services that expose a consumable balance. -->
            <section v-if="supportsBalanceAlerts" class="border rounded p-3 mb-4">
                <h3 class="h6 text-black mb-1">{{ provider.balance.label }} alerts</h3>
                <p class="small text-muted mb-3" title="Sample balance only; a live page reads the provider balance securely">Current available: {{ provider.balance.available.toLocaleString() }} {{ provider.balance.label.toLowerCase() }}</p>
                <div class="form-check form-switch mb-3">
                    <input id="reference-balance-alerts-enabled" v-model="settings.balanceAlertsEnabled" class="form-check-input" type="checkbox" role="switch" title="Turn low-balance alerts on or off">
                    <label class="form-check-label" for="reference-balance-alerts-enabled">Enable low-balance alerts</label>
                </div>
                <div class="row g-3">
                    <div class="col-12 col-md-6">
                        <label for="reference-balance-warning" class="form-label" title="Send an early warning at or below this balance">Warning threshold</label>
                        <input id="reference-balance-warning" v-model.number="settings.balanceWarning" class="form-control" type="number" min="0" :title="`Warn when ${provider.balance.label.toLowerCase()} reach this level`">
                    </div>
                    <div class="col-12 col-md-6">
                        <label for="reference-balance-critical" class="form-label" title="Escalate when remaining balance risks interrupting service">Critical threshold</label>
                        <input id="reference-balance-critical" v-model.number="settings.balanceCritical" class="form-control" type="number" min="0" :title="`Mark ${provider.balance.label.toLowerCase()} critical at this level`">
                    </div>
                </div>
            </section>

            <!-- Credential rotation: masked fields accept replacements only; current secrets never appear. -->
            <section class="border-top pt-4">
                <div class="mb-3">
                    <h3 class="h6 text-black mb-1">Credentials &amp; API access</h3>
                    <p class="small text-muted mb-0">Current values stay masked. Enter only the replacement values that need rotation.</p>
                </div>
                <div class="row g-3">
                    <div v-for="field in provider.fields" :key="field.key" class="col-12 col-md-6">
                        <label :for="`reference-credential-${field.key}`" class="form-label" :title="`Replace the ${field.label.toLowerCase()} for ${provider.label}`">{{ field.label }}</label>
                        <div class="input-group">
                            <input :id="`reference-credential-${field.key}`" v-model="settings.credentials[field.key]" :type="visibleCredentials[field.key] ? 'text' : 'password'" class="form-control" autocomplete="new-password" spellcheck="false" :placeholder="`Enter replacement ${field.label.toLowerCase()}`" :title="`New ${field.label.toLowerCase()}; the existing secret is not displayed`">
                            <button type="button" class="btn btn-white" :title="visibleCredentials[field.key] ? `Hide ${field.label}` : `Show ${field.label}`" :aria-label="visibleCredentials[field.key] ? `Hide ${field.label}` : `Show ${field.label}`" @click="toggleCredentialVisibility(field.key)">
                                {{ visibleCredentials[field.key] ? 'Hide' : 'Show' }}
                            </button>
                        </div>
                    </div>
                </div>
                <div class="alert alert-light border small mt-3 mb-0" role="note">
                    This reference does not send or persist credentials. A production update should use a permission-checked backend and server-side secret storage; never store provider secrets in browser storage or logs.
                </div>
                <button type="button" class="btn btn-primary mt-3" title="Preview credential rotation; no secrets are sent" @click="previewCredentialUpdate">Preview credential update</button>
            </section>

            <!-- Example save action: validates rules locally without making a request. -->
            <div class="d-flex justify-content-end mt-4">
                <button type="button" class="btn btn-white me-2" title="Clear the local example message" @click="referenceMessage = ''">Clear message</button>
                <button type="button" class="btn btn-primary" title="Save this monitoring example locally only" @click="previewMonitoringSave">Save monitoring example</button>
            </div>
            <p v-if="referenceMessage" class="small text-muted mt-3 mb-0" role="status" aria-live="polite">{{ referenceMessage }}</p>
        </div>
    </div>
</template>
