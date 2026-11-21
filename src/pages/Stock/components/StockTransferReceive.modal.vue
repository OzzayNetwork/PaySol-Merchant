<template>
  <div
    class="modal fade"
    id="stockTransferReceiveModal"
    ref="modalEl"
    tabindex="-1"
    aria-labelledby="stockTransferReceiveModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content border">
        <!-- Header -->
        <div class="modal-header border-bottom py-3">
          <div class="d-flex align-items-center gap-2">
            <div class="avatar-xs d-flex align-items-center justify-content-center rounded-circle bg-success-subtle text-success">
              <i class="bx bx-check-shield fs-5"></i>
            </div>
            <div>
              <h5 class="modal-title font-size-16 mb-0" id="stockTransferReceiveModalLabel">
                Receive &amp; Accept Transfer
              </h5>
              <p class="text-muted fs-12 mb-0">
                Verify items received from {{ transfer?.source_branch?.name || 'origin branch' }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
            :disabled="saving"
          ></button>
        </div>

        <form @submit.prevent="handleSubmit">
          <div class="modal-body p-4">
            <!-- Transfer summary header -->
            <div v-if="transfer" class="section-card border rounded-3 p-3 bg-light-subtle mb-4">
              <div class="row g-2 align-items-center">
                <div class="col-sm-6">
                  <div class="fs-11 text-muted text-uppercase fw-semibold">Transfer Number</div>
                  <div class="fw-bold font-monospace fs-14 text-dark">{{ transfer.transfer_number }}</div>
                  <div class="fs-12 text-muted mt-1">
                    Dispatched from: <strong>{{ transfer.source_branch?.name }}</strong>
                  </div>
                </div>
                <div class="col-sm-6 text-sm-end">
                  <span class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 fs-12 fw-semibold">
                    <i class="bx bx-time align-middle me-1"></i>In Transit
                  </span>
                  <div class="fs-11 text-muted mt-1">
                    Destination: <strong>{{ transfer.destination_branch?.name }}</strong>
                  </div>
                </div>
              </div>
            </div>

            <!-- Items checklist -->
            <div class="mb-4">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <h6 class="fs-13 fw-bold text-uppercase text-dark mb-0">Verify Physical Quantities</h6>
                <button
                  type="button"
                  class="btn btn-sm btn-link text-primary p-0 fs-12 text-decoration-none"
                  @click="acceptAllSentQuantities"
                >
                  <i class="bx bx-check-double me-1"></i>Accept all as sent
                </button>
              </div>

              <!-- Activity Day Box Style Table -->
              <div class="activity-day-box bg-white overflow-hidden">
                <div class="table-responsive">
                  <table class="table align-middle mb-0 transfer-check-table">
                    <thead>
                      <tr>
                        <th style="width: 40px;" class="text-center">#</th>
                        <th style="min-width: 260px;">Product</th>
                        <th style="width: 120px;" class="text-end">Sent Qty</th>
                        <th style="width: 150px;" class="text-end">Actual Received</th>
                        <th style="width: 110px;" class="text-center">Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(it, idx) in itemsList" :key="it.id || idx" class="check-row">
                        <td class="text-center text-muted font-size-12 fw-medium">
                          {{ idx + 1 }}
                        </td>
                        <td class="p-2">
                          <div class="fw-semibold text-dark fs-13">{{ it.product_name }}</div>
                          <small v-if="it.barcode" class="text-muted font-monospace fs-11">
                            {{ it.barcode }}
                          </small>
                        </td>
                        <td class="text-end font-monospace fw-bold fs-13 px-3 text-muted">
                          {{ it.quantity_sent }} {{ it.unit || 'pcs' }}
                        </td>
                        <td class="p-2">
                          <div class="input-group">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              class="form-control text-end fw-semibold"
                              v-model.number="it.quantity_received"
                              required
                            />
                            <span class="input-group-text px-2 text-muted fs-11">
                              {{ it.unit || 'pcs' }}
                            </span>
                          </div>
                        </td>
                        <td class="text-center">
                          <span
                            v-if="Number(it.quantity_received) === Number(it.quantity_sent)"
                            class="badge bg-success-subtle text-success fs-11"
                          >
                            Match
                          </span>
                          <span
                            v-else-if="Number(it.quantity_received) < Number(it.quantity_sent)"
                            class="badge bg-danger-subtle text-danger fs-11 font-monospace"
                          >
                            {{ (Number(it.quantity_received) - Number(it.quantity_sent)).toFixed(2) }}
                          </span>
                          <span
                            v-else
                            class="badge bg-primary-subtle text-primary fs-11 font-monospace"
                          >
                            +{{ (Number(it.quantity_received) - Number(it.quantity_sent)).toFixed(2) }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Notes -->
            <div class="mb-0">
              <label class="form-label fs-12 fw-semibold text-dark mb-1">Receiving Remarks / Discrepancy Notes</label>
              <textarea
                class="form-control"
                rows="2"
                placeholder="e.g. Received in good order; 1 piece broken during transit..."
                v-model="notes"
                maxlength="500"
              ></textarea>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer border-top bg-light py-2">
            <button
              type="button"
              class="btn btn-white waves-effect"
              data-bs-dismiss="modal"
              :disabled="saving"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-success d-inline-flex align-items-center gap-2"
              :disabled="saving"
            >
              <span v-if="saving" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <i v-else class="bx bx-check-double fs-5"></i>
              <span>Confirm &amp; Intake to Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import StockAPI from "@/api/stock";

const emit = defineEmits(["saved", "error"]);

const modalEl = ref(null);
const transfer = ref(null);
const itemsList = ref([]);
const notes = ref("");
const saving = ref(false);

function acceptAllSentQuantities() {
  itemsList.value.forEach((it) => {
    it.quantity_received = it.quantity_sent;
  });
}

function open(st) {
  transfer.value = st;
  notes.value = "";
  saving.value = false;

  // Clone items with default quantity_received = quantity_sent
  if (st.items && Array.isArray(st.items)) {
    itemsList.value = st.items.map((it) => ({
      ...it,
      quantity_received: it.quantity_received !== null ? it.quantity_received : it.quantity_sent,
    }));
  } else {
    itemsList.value = [];
  }

  if (window.bootstrap?.Modal) {
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl.value);
    modal.show();
  }
}

async function handleSubmit() {
  if (!transfer.value) return;

  saving.value = true;
  try {
    const receivedMap = {};
    itemsList.value.forEach((it) => {
      receivedMap[it.tenant_product_id] = Number(it.quantity_received);
    });

    const payload = {
      notes: notes.value?.trim() || undefined,
      received_items: receivedMap,
    };

    const { data } = await StockAPI.receiveTransfer(transfer.value.id, payload);

    if (window.bootstrap?.Modal) {
      const modal = window.bootstrap.Modal.getInstance(modalEl.value);
      modal?.hide();
    }

    emit("saved", {
      result: data,
      message: data.message || "Stock transfer successfully received.",
    });
  } catch (err) {
    console.error("Error receiving transfer:", err);
    emit("error", err.response?.data?.message || "Failed to receive transfer.");
  } finally {
    saving.value = false;
  }
}

defineExpose({ open });
</script>

<style scoped>
.section-card {
  background-color: #FAFBFD;
  border: 1px solid #E9EBEF !important;
  border-radius: 8px;
}

.activity-day-box {
  border: 1px solid #E9EBEF;
  border-radius: 8px;
  overflow: hidden;
  background-color: #ffffff;
}

.transfer-check-table {
  width: 100%;
  border-collapse: collapse;
}

.transfer-check-table thead th {
  background-color: #FAFBFD;
  color: #5B6B8C;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid #E9EBEF !important;
  padding: 10px 10px;
}

.transfer-check-table tbody tr {
  border-top: 1px solid #EFF2F7;
  background-color: #ffffff;
}

.transfer-check-table tbody tr:hover {
  background-color: #FAFBFD;
}

.transfer-check-table .form-control,
.transfer-check-table .input-group-text,
.transfer-check-table .input-group {
  height: 36px !important;
  min-height: 36px !important;
  max-height: 36px !important;
  font-size: 13px !important;
}
</style>
