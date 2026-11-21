<template>
  <div
    class="offcanvas offcanvas-end"
    tabindex="-1"
    id="stockHistoryAside"
    ref="asideEl"
    aria-labelledby="stockHistoryAsideLabel"
    style="width: 520px; max-width: 95vw;"
  >
    <div class="offcanvas-header border-bottom py-3 bg-light">
      <div class="d-flex align-items-center gap-2">
        <div class="avatar-xs d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary">
          <i class="bx bx-history fs-5"></i>
        </div>
        <div>
          <h5 class="offcanvas-title font-size-16 mb-0" id="stockHistoryAsideLabel">
            Stock Movement Ledger
          </h5>
          <span class="fs-12 text-muted">Audit trail &amp; history</span>
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
      <!-- Loading State: Drawer Skeleton (AGENTS.md §7) -->
      <div v-if="loading && !productData" class="p-3" aria-busy="true">
        <!-- Product Header Card Skeleton -->
        <div class="card border shadow-none mb-3">
          <div class="card-body p-3">
            <div class="d-flex align-items-center gap-3">
              <SkeletonLoader width="54px" height="54px" rounded />
              <div class="flex-grow-1">
                <SkeletonLoader type="text" :lines="1" height="14px" width="60%" />
                <SkeletonLoader type="text" :lines="1" height="10px" width="40%" margin-top="8px" />
              </div>
            </div>
          </div>
        </div>

        <!-- Balances Skeleton -->
        <div class="card border shadow-none mb-3">
          <div class="card-header bg-light py-2 px-3">
            <SkeletonLoader type="text" :lines="1" height="10px" width="120px" />
          </div>
          <div class="p-3">
            <div v-for="i in 2" :key="`sk-b-${i}`" class="d-flex justify-content-between py-2 border-bottom">
              <SkeletonLoader type="text" :lines="1" height="11px" width="100px" />
              <SkeletonLoader type="text" :lines="1" height="11px" width="60px" />
            </div>
          </div>
        </div>

        <!-- Movements Skeleton -->
        <div class="card border shadow-none">
          <div class="card-header bg-light py-2 px-3">
            <SkeletonLoader type="text" :lines="1" height="10px" width="140px" />
          </div>
          <div class="p-3">
            <div v-for="i in 4" :key="`sk-m-${i}`" class="py-2 border-bottom">
              <SkeletonLoader type="text" :lines="2" height="11px" />
            </div>
          </div>
        </div>
      </div>

      <!-- Loaded Content -->
      <div v-else-if="productData" class="p-3">
        <!-- Product Header Card -->
        <div class="card border shadow-none mb-3">
          <div class="card-body p-3">
            <div class="d-flex align-items-center gap-3">
              <img
                v-if="productData.product?.image_url"
                :src="productData.product.image_url"
                alt=""
                class="rounded bg-white p-1 border object-fit-contain"
                style="width: 54px; height: 54px;"
              />
              <div
                v-else
                class="rounded bg-light d-flex align-items-center justify-content-center text-muted"
                style="width: 54px; height: 54px;"
              >
                <i class="mdi mdi-package-variant-closed fs-3"></i>
              </div>
              <div class="min-w-0 flex-grow-1">
                <div class="fw-bold text-dark fs-15 text-truncate">{{ productData.product?.name }}</div>
                <div class="fs-12 text-muted">
                  <span v-if="productData.product?.barcode">Barcode: {{ productData.product.barcode }} · </span>
                  <span v-if="productData.product?.sku">SKU: {{ productData.product.sku }} · </span>
                  <span>Price: {{ formatMoney(productData.product?.selling_price) }}</span>
                </div>
                <div class="fs-12 mt-1 fw-semibold text-primary">
                  Total on-hand across all branches:
                  <strong>{{ formatQty(productData.total_quantity_across_branches) }}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Branch Balances -->
        <div v-if="productData.branch_balances?.length" class="mb-3">
          <h6 class="fs-12 text-uppercase text-muted fw-semibold mb-2">Balances by Branch</h6>
          <div class="d-flex flex-column gap-2">
            <div
              v-for="bb in productData.branch_balances"
              :key="bb.branch_id"
              class="d-flex align-items-center justify-content-between p-2 px-3 border rounded-2 bg-light"
            >
              <span class="fw-semibold text-dark fs-13">{{ bb.branch_name }}</span>
              <div class="text-end">
                <span class="badge" :class="bb.quantity <= (bb.reorder_point ?? 0) ? 'bg-warning-subtle text-warning' : 'bg-success-subtle text-success'">
                  {{ formatQty(bb.quantity) }}
                </span>
                <span v-if="bb.reorder_point !== null" class="fs-11 text-muted ms-1">
                  (ROL: {{ formatQty(bb.reorder_point) }})
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Movements -->
        <div>
          <h6 class="fs-12 text-uppercase text-muted fw-semibold mb-2">Recent 20 Movements</h6>

          <div v-if="!productData.recent_movements?.length" class="text-center py-4 text-muted fs-13 border rounded bg-light">
            No recorded movements for this product yet.
          </div>

          <div v-else class="timeline-list d-flex flex-column gap-2">
            <div
              v-for="m in productData.recent_movements"
              :key="m.id"
              class="p-3 border rounded-3 bg-white"
            >
              <div class="d-flex align-items-start justify-content-between gap-2 mb-1">
                <div class="d-flex align-items-center gap-2">
                  <span class="badge" :class="movementTypeBadge(m.type)">
                    {{ m.type_label || m.type }}
                  </span>
                  <span class="fs-11 text-muted">{{ smartDate(m.created_at) }}</span>
                </div>
                <div class="text-end">
                  <span
                    class="fw-bold fs-14"
                    :class="m.quantity_delta >= 0 ? 'text-success' : 'text-danger'"
                  >
                    {{ m.quantity_delta >= 0 ? `+${formatQty(m.quantity_delta)}` : formatQty(m.quantity_delta) }}
                  </span>
                </div>
              </div>

              <div class="fs-12 text-muted mt-2 d-flex justify-content-between align-items-center">
                <span>Balance after: <strong class="text-dark">{{ formatQty(m.balance_after) }}</strong></span>
                <span v-if="m.user">By: {{ m.user }}</span>
              </div>

              <div v-if="m.supplier_name || m.invoice_number" class="fs-11 text-muted mt-1">
                <i class="bx bx-truck me-1"></i>
                <span v-if="m.supplier_name">Supplier: {{ m.supplier_name }} </span>
                <span v-if="m.invoice_number">(Inv #{{ m.invoice_number }})</span>
              </div>

              <div v-if="m.notes" class="fs-12 text-dark fst-italic mt-1 bg-light p-1 px-2 rounded">
                "{{ m.notes }}"
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
import { formatQty, formatMoney, MOVEMENT_TYPES } from "../helpers/stockMeta";
import { smartDate } from "@/utils/dates";
import StockAPI from "@/api/stock";
import SkeletonLoader from "@/components/Loaders/SkeletonLoader.vue";

const asideEl = ref(null);
const loading = ref(false);
const productData = ref(null);

function movementTypeBadge(type) {
  return MOVEMENT_TYPES[type]?.badgeClass || "bg-secondary-subtle text-secondary";
}

async function open(productId) {
  loading.value = true;
  productData.value = null;

  if (window.bootstrap?.Offcanvas) {
    const aside = window.bootstrap.Offcanvas.getOrCreateInstance(asideEl.value);
    aside.show();
  }

  try {
    const { data } = await StockAPI.get(productId);
    productData.value = data.data;
  } catch (err) {
    console.error("Error loading product stock movements:", err);
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });
</script>
