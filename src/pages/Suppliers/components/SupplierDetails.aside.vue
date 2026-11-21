<template>
  <div
    class="offcanvas offcanvas-end"
    tabindex="-1"
    id="supplierDetailsAside"
    ref="asideEl"
    aria-labelledby="supplierDetailsAsideLabel"
    style="width: 540px; max-width: 95vw;"
  >
    <div class="offcanvas-header border-bottom py-3 bg-light">
      <div class="d-flex align-items-center gap-2">
        <div class="avatar-xs d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary">
          <Icon icon="ri:truck-line" class="fs-5" />
        </div>
        <div>
          <h5 class="offcanvas-title font-size-16 mb-0" id="supplierDetailsAsideLabel">
            Supplier Profile
          </h5>
          <span class="fs-12 text-muted">Vendor details &amp; delivery history</span>
        </div>
      </div>
      <button
        type="button"
        class="btn-close text-reset"
        data-bs-dismiss="offcanvas"
        aria-label="Close"
      ></button>
    </div>

    <div class="offcanvas-body p-0">
      <!-- Loading State: Panel Skeleton -->
      <div v-if="loading && !supplier" class="p-3" aria-busy="true">
        <!-- Vendor Header Card Skeleton -->
        <div class="card border shadow-none mb-3">
          <div class="card-body p-3">
            <div class="d-flex align-items-start gap-3">
              <SkeletonLoader width="48px" height="48px" rounded />
              <div class="flex-grow-1">
                <SkeletonLoader type="text" :lines="1" height="14px" width="60%" />
                <SkeletonLoader type="text" :lines="1" height="10px" width="40%" margin-top="8px" />
              </div>
            </div>
            <div class="row g-2 mt-3 pt-3 border-top">
              <div class="col-6"><SkeletonLoader height="32px" rounded /></div>
              <div class="col-6"><SkeletonLoader height="32px" rounded /></div>
            </div>
          </div>
        </div>

        <!-- KPI Skeleton -->
        <div class="row g-2 mb-3">
          <div class="col-6">
            <div class="card border shadow-none p-3 text-center">
              <SkeletonLoader type="text" :lines="1" height="10px" width="60%" />
              <SkeletonLoader type="text" :lines="1" height="20px" width="40%" margin-top="6px" />
            </div>
          </div>
          <div class="col-6">
            <div class="card border shadow-none p-3 text-center">
              <SkeletonLoader type="text" :lines="1" height="10px" width="60%" />
              <SkeletonLoader type="text" :lines="1" height="20px" width="70%" margin-top="6px" />
            </div>
          </div>
        </div>

        <!-- Deliveries List Skeleton -->
        <div class="card border shadow-none">
          <div class="card-header bg-light py-2 px-3">
            <SkeletonLoader type="text" :lines="1" height="10px" width="120px" />
          </div>
          <div class="p-3">
            <div v-for="i in 4" :key="`sk-d-${i}`" class="py-2 border-bottom">
              <SkeletonLoader type="text" :lines="2" height="11px" />
            </div>
          </div>
        </div>
      </div>

      <!-- Loaded Content -->
      <div v-else-if="supplier" class="p-3">
        <!-- Vendor Header Card -->
        <div class="card border shadow-none mb-3">
          <div class="card-body p-3">
            <div class="d-flex align-items-start gap-3">
              <div class="avatar-md flex-shrink-0">
                <span class="avatar-title rounded-circle fw-bold font-size-16 bg-primary text-white">
                  {{ initialsOf(supplier.name) }}
                </span>
              </div>
              <div class="min-w-0 flex-grow-1">
                <div class="d-flex align-items-center justify-content-between gap-2">
                  <h5 class="fw-bold text-dark fs-16 mb-1 text-truncate">{{ supplier.name }}</h5>
                  <span
                    class="badge rounded-pill font-size-12 px-2"
                    :class="supplier.is_active ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-muted'"
                  >
                    {{ supplier.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </div>

                <div class="d-flex flex-wrap gap-2 align-items-center mt-1">
                  <span v-if="supplier.payment_terms" class="badge bg-light text-secondary border font-size-12">
                    <Icon icon="ri:money-dollar-circle-line" class="me-1 align-middle" />
                    {{ supplier.payment_terms }}
                  </span>
                  <span v-if="supplier.tax_pin" class="badge bg-light text-muted border font-size-12">
                    PIN: <strong class="text-dark">{{ supplier.tax_pin }}</strong>
                  </span>
                </div>
              </div>
            </div>

            <!-- Contact Quick Actions -->
            <div class="row g-2 mt-3 pt-3 border-top">
              <div class="col-6">
                <a
                  v-if="supplier.phone"
                  :href="`tel:${supplier.phone}`"
                  class="btn btn-sm btn-outline-primary w-100 d-inline-flex align-items-center justify-content-center gap-1"
                >
                  <Icon icon="ri:phone-line" class="fs-6" />
                  <span>{{ supplier.phone }}</span>
                </a>
                <button v-else disabled class="btn btn-sm btn-light w-100 text-muted">
                  No phone
                </button>
              </div>
              <div class="col-6">
                <a
                  v-if="supplier.email"
                  :href="`mailto:${supplier.email}`"
                  class="btn btn-sm btn-outline-secondary w-100 d-inline-flex align-items-center justify-content-center gap-1 text-truncate"
                >
                  <Icon icon="ri:mail-line" class="fs-6" />
                  <span class="text-truncate">{{ supplier.email }}</span>
                </a>
                <button v-else disabled class="btn btn-sm btn-light w-100 text-muted">
                  No email
                </button>
              </div>
            </div>

            <!-- Details List -->
            <div class="mt-3 pt-3 border-top fs-13">
              <div v-if="supplier.contact_person" class="d-flex justify-content-between py-1">
                <span class="text-muted">Contact Person:</span>
                <span class="fw-semibold text-dark">{{ supplier.contact_person }}</span>
              </div>
              <div v-if="supplier.address" class="d-flex justify-content-between py-1">
                <span class="text-muted">Address:</span>
                <span class="fw-medium text-dark text-end" style="max-width: 65%;">{{ supplier.address }}</span>
              </div>
              <div v-if="supplier.notes" class="mt-2 p-2 bg-light rounded text-muted fs-12">
                <Icon icon="ri:file-text-line" class="me-1 align-middle text-primary" />
                {{ supplier.notes }}
              </div>
            </div>

            <!-- Action buttons -->
            <div class="d-flex gap-2 mt-3 pt-3 border-top">
              <button
                type="button"
                class="btn btn-sm btn-light flex-grow-1 d-inline-flex align-items-center justify-content-center gap-1"
                @click="emitEdit"
              >
                <Icon icon="ri:edit-2-line" />
                <span>Edit Profile</span>
              </button>
              <button
                type="button"
                class="btn btn-sm btn-primary flex-grow-1 d-inline-flex align-items-center justify-content-center gap-1"
                @click="emitReceive"
              >
                <Icon icon="ri:inbox-archive-line" />
                <span>Receive Goods</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Supplier KPI Overview -->
        <div class="row g-2 mb-3">
          <div class="col-6">
            <div class="card border shadow-none mb-0">
              <div class="card-body p-2 text-center">
                <div class="fs-12 text-muted">Total Deliveries</div>
                <div class="fs-18 fw-bold text-dark mt-1">
                  {{ supplier.deliveries_count ?? 0 }}
                </div>
              </div>
            </div>
          </div>
          <div class="col-6">
            <div class="card border shadow-none mb-0">
              <div class="card-body p-2 text-center">
                <div class="fs-12 text-muted">Total Supplied</div>
                <div class="fs-18 fw-bold text-primary mt-1">
                  KES {{ formatMoney(supplier.total_supplied_kes) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Deliveries Ledger -->
        <div class="card border shadow-none mb-0">
          <div class="card-header bg-light py-2 px-3 d-flex align-items-center justify-content-between">
            <span class="fw-semibold fs-13 text-dark">
              Recent Deliveries ({{ supplier.recent_deliveries?.length || 0 }})
            </span>
            <span class="text-muted fs-12">Latest 20</span>
          </div>

          <div v-if="!supplier.recent_deliveries || supplier.recent_deliveries.length === 0" class="card-body text-center py-4 text-muted fs-13">
            <Icon icon="ri:inbox-line" class="fs-2 text-muted opacity-50 mb-1" />
            <p class="mb-0">No deliveries recorded from this supplier yet.</p>
          </div>

          <div v-else class="list-group list-group-flush fs-12">
            <div
              v-for="d in supplier.recent_deliveries"
              :key="d.id"
              class="list-group-item p-3"
            >
              <div class="d-flex align-items-center justify-content-between mb-1">
                <span class="fw-bold text-dark fs-13">{{ d.product_name || 'Stock Delivery' }}</span>
                <span class="badge bg-light text-dark border">
                  +{{ d.quantity_received }} {{ d.bonus_quantity > 0 ? `(+${d.bonus_quantity} bonus)` : '' }}
                </span>
              </div>
              <div class="d-flex justify-content-between text-muted fs-12">
                <span>{{ d.branch_name || 'Main Branch' }} · Invoice: {{ d.invoice_number || '—' }}</span>
                <span class="fw-semibold text-dark">KES {{ formatMoney(d.total_cost) }}</span>
              </div>
              <div class="d-flex justify-content-between text-muted fs-11 mt-1">
                <span>Received by {{ d.user || 'Staff' }}</span>
                <span>{{ smartDate(d.created_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import SuppliersAPI from "@/api/suppliers";
import SkeletonLoader from "@/components/Loaders/SkeletonLoader.vue";
import { smartDate } from "@/utils/dates";

const emit = defineEmits(["edit", "receive"]);

const asideEl = ref(null);
const loading = ref(false);
const supplier = ref(null);

function initialsOf(name) {
  if (!name) return "??";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

function formatMoney(amount) {
  if (amount == null) return "0.00";
  return Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function closeAside() {
  if (window.bootstrap?.Offcanvas) {
    const aside = window.bootstrap.Offcanvas.getInstance(asideEl.value);
    aside?.hide();
  }
}

function emitEdit() {
  const current = supplier.value;
  closeAside();
  emit("edit", current);
}

function emitReceive() {
  const current = supplier.value;
  closeAside();
  emit("receive", current);
}

async function open(id) {
  loading.value = true;
  supplier.value = null;

  if (window.bootstrap?.Offcanvas) {
    const aside = window.bootstrap.Offcanvas.getOrCreateInstance(asideEl.value);
    aside.show();
  }

  try {
    const { data } = await SuppliersAPI.get(id);
    supplier.value = data.data;
  } catch (err) {
    console.error("Error loading supplier details:", err);
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });
</script>
