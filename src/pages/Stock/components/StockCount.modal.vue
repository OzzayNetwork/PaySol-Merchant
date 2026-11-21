<template>
  <div
    class="modal fade"
    id="stockCountModal"
    ref="modalEl"
    tabindex="-1"
    aria-labelledby="stockCountModalLabel"
    aria-hidden="true"
    data-bs-backdrop="static"
  >
    <div class="modal-dialog modal-fullscreen-xl-down modal-xl modal-dialog-centered custom-modal-size">
      <div class="modal-content border shadow-lg">
        <!-- Modal Header -->
        <div class="modal-header border-bottom py-3 px-4 bg-white flex-shrink-0">
          <div class="d-flex align-items-center gap-3">
            <div class="avatar-xs d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary flex-shrink-0">
              <i class="bx bx-list-check fs-4"></i>
            </div>
            <div>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <h5 class="modal-title font-size-16 fw-bold mb-0 text-dark" id="stockCountModalLabel">
                  Physical Stock Count &amp; Reconciliation
                </h5>
                <span class="badge bg-primary text-white font-size-11 px-2 py-1">
                  Branch: {{ activeBranchName }}
                </span>
                <span class="badge bg-light text-muted border font-size-11 px-2 py-1">
                  {{ allProducts.length }} Goods in Inventory
                </span>
              </div>
              <p class="text-muted font-size-13 mb-0 mt-1">
                Perform shelf stocktaking. Enter counted shelf units to audit on-hand balances.
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

        <!-- Modal Body Container -->
        <div class="modal-body p-0 d-flex flex-column overflow-hidden bg-light">
          <!-- Top Toolbar: Audit Reference Note & Global Controls -->
          <div class="p-3 px-4 bg-white border-bottom flex-shrink-0">
            <div class="row g-2 align-items-center">
              <!-- Dynamic Search input -->
              <div class="col-lg-6 col-12">
                <div class="search-box position-relative">
                  <input
                    ref="searchInputEl"
                    type="text"
                    class="form-control bg-light ps-5 rounded-pill font-size-13"
                    style="height: 38px;"
                    placeholder="Search goods by name, barcode, brand, or keywords (e.g. 'coke', 'soda')..."
                    v-model="searchQuery"
                    spellcheck="false"
                    aria-label="Search goods"
                  />
                  <i class="bx bx-search-alt position-absolute text-muted font-size-16" style="left: 14px; top: 11px;"></i>
                  <i
                    v-if="searchQuery"
                    class="mdi mdi-close position-absolute text-muted cursor-pointer font-size-16"
                    style="right: 14px; top: 10px;"
                    title="Clear search"
                    @click="searchQuery = ''"
                  ></i>
                </div>
              </div>

              <!-- General Audit Note / Batch Reason -->
              <div class="col-lg-6 col-12">
                <div class="d-flex align-items-center gap-2">
                  <div class="flex-grow-1">
                    <input
                      type="text"
                      class="form-control bg-light font-size-13"
                      style="height: 38px;"
                      placeholder="Overall audit note (e.g. Weekly stocktake, Friday closing count)..."
                      v-model="globalNotes"
                      maxlength="250"
                    />
                  </div>
                  <button
                    v-if="categoryList.length > 1"
                    type="button"
                    class="btn btn-light border dropdown-toggle font-size-12 fw-semibold px-2.5 flex-shrink-0"
                    style="height: 38px;"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <span>{{ selectedCategoryLabel }}</span>
                  </button>
                  <ul v-if="categoryList.length > 1" class="dropdown-menu dropdown-menu-end font-size-12 shadow-sm">
                    <li>
                      <a
                        class="dropdown-item"
                        :class="{ active: selectedCategory === 'all' }"
                        href="javascript:void(0);"
                        @click="selectedCategory = 'all'"
                      >
                        All Categories
                      </a>
                    </li>
                    <li v-for="cat in categoryList" :key="cat">
                      <a
                        class="dropdown-item"
                        :class="{ active: selectedCategory === cat }"
                        href="javascript:void(0);"
                        @click="selectedCategory = cat"
                      >
                        {{ cat }}
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- View / Filter Pills -->
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3 pt-2 border-top">
              <div class="d-flex align-items-center gap-1.5 flex-wrap">
                <span class="font-size-11 fw-bold text-muted text-uppercase me-1">View:</span>
                <button
                  type="button"
                  class="btn btn-sm rounded-pill px-2.5 py-1 font-size-12 fw-semibold"
                  :class="activeFilter === 'all' ? 'btn-primary' : 'btn-light border'"
                  @click="activeFilter = 'all'"
                >
                  All Goods ({{ allProducts.length }})
                </button>

                <button
                  type="button"
                  class="btn btn-sm rounded-pill px-2.5 py-1 font-size-12 fw-semibold"
                  :class="activeFilter === 'modified' ? 'btn-primary' : 'btn-light border'"
                  @click="activeFilter = 'modified'"
                >
                  Counted ({{ modifiedCount }})
                </button>

                <button
                  type="button"
                  class="btn btn-sm rounded-pill px-2.5 py-1 font-size-12 fw-semibold"
                  :class="activeFilter === 'discrepancy' ? 'btn-primary' : 'btn-light border'"
                  @click="activeFilter = 'discrepancy'"
                >
                  Discrepancies ({{ discrepancyCount }})
                </button>
              </div>

              <!-- Quick Helpers: Fill All with System Count / Reset -->
              <div class="d-flex align-items-center gap-2">
                <button
                  type="button"
                  class="btn btn-sm btn-soft-primary font-size-12 fw-semibold px-2 py-1"
                  title="Populates shelf count with current system quantity for visible items"
                  @click="fillAllWithCurrentCount"
                >
                  <i class="bx bx-check-double me-1"></i> Pre-fill current counts
                </button>
                <span v-if="modifiedCount > 0" class="text-muted font-size-12">·</span>
                <button
                  v-if="modifiedCount > 0"
                  type="button"
                  class="btn btn-sm btn-link text-danger font-size-12 p-0 text-decoration-none"
                  @click="clearAllEntries"
                >
                  <i class="bx bx-trash me-1"></i> Reset all entries
                </button>
              </div>
            </div>
          </div>

          <!-- Table Container -->
          <div class="table-responsive overflow-auto bg-white mb-0" style="max-height: calc(85vh - 220px);">
            <!-- Loading Skeleton -->
            <div v-if="loading" class="p-5 text-center">
              <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;"></div>
              <h5 class="fw-bold mb-1">Loading Goods &amp; Inventory...</h5>
              <p class="text-muted fs-14 mb-0">Retrieving system stock counts for {{ activeBranchName }}</p>
            </div>

            <!-- Empty Search Results -->
            <div v-else-if="filteredProducts.length === 0" class="text-center py-5 px-3">
              <div class="avatar-lg mx-auto mb-3 rounded-circle bg-light d-flex align-items-center justify-content-center text-muted">
                <i class="bx bx-package fs-1"></i>
              </div>
              <h5 class="fw-bold mb-1">
                <span v-if="allProducts.length === 0">No Products Found</span>
                <span v-else>No goods matched your search</span>
              </h5>
              <p class="text-muted fs-14 mb-3" style="max-width: 520px; margin: 0 auto;">
                <span v-if="searchQuery">No items matched "<strong>{{ searchQuery }}</strong>". Try searching by keyword like 'coke', 'soda', or partial brand names.</span>
                <span v-else-if="activeFilter === 'modified'">No products have been counted yet. Enter shelf counts in the table below to modify them.</span>
                <span v-else-if="activeFilter === 'discrepancy'">No physical count discrepancies found.</span>
                <span v-else>This branch has no inventory products. Please add products under Products &amp; Prices first.</span>
              </p>
              <button
                v-if="searchQuery || activeFilter !== 'all' || selectedCategory !== 'all'"
                type="button"
                class="btn btn-sm btn-primary px-3 py-2"
                @click="resetFilters"
              >
                Clear Search &amp; Show All Goods
              </button>
            </div>

            <!-- Products Audit Table -->
            <table v-else class="table table-hover align-middle mb-0 border-top audit-table">
              <thead class="table-light sticky-top shadow-sm" style="z-index: 5;">
                <tr class="font-size-11 text-muted text-uppercase fw-bold">
                  <th style="width: 44px;" class="ps-3 text-center">#</th>
                  <th style="min-width: 250px;">Product</th>
                  <th style="width: 120px;" class="text-center">System Stock</th>
                  <th style="width: 150px;" class="text-center">Physical Count</th>
                  <th style="width: 110px;" class="text-center">Variance</th>
                  <th style="width: 170px;">Reason / Note</th>
                  <th style="width: 46px;" class="text-center pe-3"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(p, index) in filteredProducts"
                  :key="p.id"
                  :class="{ 'table-active-row bg-primary-subtle bg-opacity-25': isRowModified(p.id) }"
                  class="audit-row transition-all"
                >
                  <!-- Row Number -->
                  <td class="ps-3 text-center text-muted font-size-12 fw-semibold">
                    {{ index + 1 }}
                  </td>

                  <!-- Product Identity & Details -->
                  <td>
                    <div class="d-flex align-items-center gap-2.5">
                      <div class="avatar-xs d-flex flex-shrink-0">
                        <img
                          v-if="p.image_url"
                          :src="p.image_url"
                          alt=""
                          class="avatar-xs product-thumb rounded border bg-white object-fit-contain"
                          @error="p.image_url = null"
                        />
                        <div
                          v-else
                          class="avatar-xs product-thumb rounded border bg-light d-flex align-items-center justify-content-center text-muted"
                        >
                          <i class="bx bx-package fs-5 text-secondary"></i>
                        </div>
                      </div>
                      <div class="min-w-0 flex-grow-1">
                        <div class="fw-bold text-dark font-size-13 text-truncate" :title="p.name">
                          {{ p.name }}
                        </div>
                        <div class="d-flex align-items-center gap-1.5 flex-wrap mt-0.5">
                          <span
                            v-if="p.barcode"
                            class="badge bg-light text-secondary font-monospace border fw-normal px-1.5 py-0.5 font-size-10"
                            title="Barcode"
                          >
                            {{ p.barcode }}
                          </span>
                          <span
                            v-else-if="p.sku"
                            class="badge bg-light text-secondary font-monospace border fw-normal px-1.5 py-0.5 font-size-10"
                            title="SKU"
                          >
                            SKU: {{ p.sku }}
                          </span>
                          <span
                            v-if="p.category"
                            class="badge bg-primary-subtle text-primary border border-primary-subtle fw-medium px-1.5 py-0.5 font-size-10"
                            title="Category"
                          >
                            {{ p.category }}
                          </span>
                          <span
                            v-if="p.brand"
                            class="text-muted font-size-11"
                            title="Brand"
                          >
                            · {{ p.brand }}
                          </span>
                        </div>
                        <!-- Keywords helper badges (displayed when searching) -->
                        <div v-if="hasMatchedKeywords(p)" class="mt-1 d-flex flex-wrap gap-1">
                          <span
                            v-for="kw in getMatchedKeywords(p)"
                            :key="kw"
                            class="badge bg-info-subtle text-info fw-normal px-1.5 py-0.5 font-size-10"
                          >
                            <i class="bx bx-tag-alt me-0.5"></i>{{ kw }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Current System Stock -->
                  <td class="text-center">
                    <div
                      class="fw-bold font-size-13 line-height-1"
                      :class="p.current_quantity > 0 ? 'text-dark' : 'text-danger'"
                    >
                      {{ formatQty(p.current_quantity, p.unit) }}
                    </div>
                    <div v-if="p.last_counted_at" class="font-size-10 text-muted mt-1" :title="`Last counted: ${formatDate(p.last_counted_at)}`">
                      {{ formatRelativeTime(p.last_counted_at) }}
                    </div>
                    <div v-else class="font-size-10 text-muted mt-1">
                      Uncounted
                    </div>
                  </td>

                  <!-- New Physical Count Input -->
                  <td>
                    <div class="input-group input-group-sm count-input-group mx-auto" style="max-width: 135px;">
                      <input
                        :ref="(el) => setCountInputRef(el, index)"
                        type="number"
                        step="any"
                        min="0"
                        class="form-control text-center font-size-13"
                        :class="isRowModified(p.id) ? 'border-primary bg-white shadow-sm fw-bold text-dark' : 'bg-light text-muted border'"
                        style="height: 32px;"
                        placeholder="—"
                        :value="getEntryValue(p.id)"
                        @input="onCountInput(p, $event.target.value)"
                        @keydown.enter.prevent="focusNextRow(index)"
                        @keydown.down.prevent="focusNextRow(index)"
                        @keydown.up.prevent="focusPrevRow(index)"
                      />
                      <span class="input-group-text bg-light text-muted font-size-11 fw-semibold px-2">
                        {{ p.unit || 'pcs' }}
                      </span>
                    </div>
                  </td>

                  <!-- Variance / Impact Badge -->
                  <td class="text-center font-size-12">
                    <template v-if="isRowModified(p.id)">
                      <span
                        v-if="getRowVariance(p.id, p.current_quantity) > 0"
                        class="badge bg-success-subtle text-success fw-bold font-size-11 px-2 py-1 border border-success-subtle"
                      >
                        +{{ formatVariance(getRowVariance(p.id, p.current_quantity)) }}
                        <small class="d-block font-size-9 fw-normal">Surplus</small>
                      </span>
                      <span
                        v-else-if="getRowVariance(p.id, p.current_quantity) < 0"
                        class="badge bg-danger-subtle text-danger fw-bold font-size-11 px-2 py-1 border border-danger-subtle"
                      >
                        {{ formatVariance(getRowVariance(p.id, p.current_quantity)) }}
                        <small class="d-block font-size-9 fw-normal">Deficit</small>
                      </span>
                      <span
                        v-else
                        class="badge bg-secondary-subtle text-secondary fw-semibold font-size-11 px-2 py-1 border"
                      >
                        0 (Match)
                      </span>
                    </template>
                    <span v-else class="text-muted font-size-12 opacity-50">—</span>
                  </td>

                  <!-- Per-Item Reason Selector & Note -->
                  <td>
                    <div class="d-flex flex-column gap-1">
                      <select
                        class="form-select form-select-sm font-size-11 py-1"
                        style="height: 28px;"
                        :class="{ 'border-primary text-primary fw-bold': getEntryReason(p.id) !== 'audit_count' && isRowModified(p.id) }"
                        :value="getEntryReason(p.id)"
                        :disabled="!isRowModified(p.id)"
                        @change="setRowReason(p.id, $event.target.value)"
                      >
                        <option value="audit_count">📋 Physical Count</option>
                        <option value="waste_spoilage">🗑️ Waste / Spoilage</option>
                        <option value="staff_consumption">☕ Staff Drink / Meal</option>
                      </select>
                      <input
                        v-if="isRowModified(p.id) && getRowVariance(p.id, p.current_quantity) !== 0"
                        type="text"
                        class="form-control form-control-sm font-size-11 bg-light py-0 px-2"
                        style="height: 24px;"
                        placeholder="Note (e.g. broken bottle)..."
                        :value="getEntryNote(p.id)"
                        @input="setRowNote(p.id, $event.target.value)"
                        maxlength="150"
                      />
                    </div>
                  </td>

                  <!-- Reset Row Button -->
                  <td class="text-center pe-3">
                    <button
                      v-if="isRowModified(p.id)"
                      type="button"
                      class="btn btn-sm btn-light text-danger p-0 avatar-xs rounded-circle d-inline-flex align-items-center justify-content-center border"
                      title="Reset this product count"
                      @click="clearRowEntry(p.id)"
                    >
                      <i class="mdi mdi-undo font-size-14"></i>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Modal Footer: Summary & Submission -->
        <div class="modal-footer border-top bg-white py-3 px-4 d-flex align-items-center justify-content-between flex-wrap gap-2 flex-shrink-0">
          <!-- Summary Metrics -->
          <div class="d-flex align-items-center gap-2.5 font-size-13">
            <div>
              <span class="text-muted">Counted: </span>
              <strong class="text-primary font-size-14">{{ modifiedCount }}</strong>
              <span class="text-muted"> of {{ allProducts.length }} products</span>
            </div>
            <div v-if="modifiedCount > 0" class="d-flex align-items-center gap-1.5">
              <span class="text-muted">· Net Discrepancy: </span>
              <span
                class="badge font-size-12 px-2.5 py-0.5 fw-bold"
                :class="netVariance > 0 ? 'bg-success text-white' : netVariance < 0 ? 'bg-danger text-white' : 'bg-secondary text-white'"
              >
                {{ netVariance > 0 ? `+${formatVariance(netVariance)}` : formatVariance(netVariance) }} units
              </span>
            </div>
          </div>

          <!-- Submission Actions -->
          <div class="d-flex align-items-center gap-2">
            <button
              type="button"
              class="btn btn-sm btn-white border waves-effect font-size-13 px-3 py-1.5"
              data-bs-dismiss="modal"
              :disabled="saving"
            >
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-sm btn-primary d-inline-flex align-items-center gap-1.5 font-size-13 fw-bold px-3 py-1.5"
              :disabled="saving || modifiedCount === 0"
              @click="submitBatchAdjustment"
            >
              <span v-if="saving" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              <i v-else class="bx bx-check fs-5"></i>
              <span>
                {{ saving ? 'Saving Changes...' : `Save ${modifiedCount} ${modifiedCount === 1 ? 'Product Adjustment' : 'Product Adjustments'}` }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from "vue";
import { formatQty, ADJUSTMENT_REASONS } from "../helpers/stockMeta";
import StockAPI from "@/api/stock";
import { formatDistanceToNow, parseISO, format } from "date-fns";

const props = defineProps({
  branchId: { type: [Number, String], default: null },
  branchName: { type: String, default: "" },
});

const emit = defineEmits(["saved", "error"]);

const modalEl = ref(null);
const searchInputEl = ref(null);
const countInputRefs = ref([]);

const loading = ref(false);
const saving = ref(false);
const allProducts = ref([]);
const entries = ref({}); // { [productId]: { new_count: number | null, is_modified: boolean, reason: string, notes: string } }

const activeBranchId = ref(null);
const activeBranchName = ref("");

const searchQuery = ref("");
const activeFilter = ref("all"); // 'all' | 'modified' | 'discrepancy'
const selectedCategory = ref("all");
const globalNotes = ref("");

const reasons = ADJUSTMENT_REASONS;

function setCountInputRef(el, index) {
  if (el) {
    countInputRefs.value[index] = el;
  }
}

function focusNextRow(currentIndex) {
  const nextInput = countInputRefs.value[currentIndex + 1];
  if (nextInput) {
    nextInput.focus();
    nextInput.select();
  }
}

function focusPrevRow(currentIndex) {
  const prevInput = countInputRefs.value[currentIndex - 1];
  if (prevInput) {
    prevInput.focus();
    prevInput.select();
  }
}

// -------------------------------------------------------------
// Load Products Count Sheet
// -------------------------------------------------------------
async function loadCountSheet(preselectedRow = null) {
  loading.value = true;
  try {
    const branchParam = props.branchId ? Number(props.branchId) : undefined;
    const { data } = await StockAPI.countSheet({ branch_id: branchParam });
    allProducts.value = data.data || [];
    activeBranchId.value = data.branch?.id || props.branchId;
    activeBranchName.value = data.branch?.name || props.branchName || "Main Branch";

    // Initialize entries dictionary: default reason is 'audit_count'
    const initialEntries = {};
    for (const p of allProducts.value) {
      initialEntries[p.id] = {
        new_count: null,
        is_modified: false,
        reason: "audit_count",
        notes: "",
      };
    }
    entries.value = initialEntries;

    // If opened with a specific preselected row, prefill search or focus
    if (preselectedRow) {
      const targetId = preselectedRow.product?.id || preselectedRow.tenant_product_id || preselectedRow.id;
      const targetProduct = allProducts.value.find((it) => it.id === targetId);
      if (targetProduct) {
        searchQuery.value = targetProduct.name;
        nextTick(() => {
          if (countInputRefs.value[0]) {
            countInputRefs.value[0].focus();
            countInputRefs.value[0].select();
          }
        });
      }
    }
  } catch (err) {
    console.error("Error loading count sheet:", err);
    allProducts.value = [];
    emit("error", "Failed to load inventory count sheet. Please check your connection.");
  } finally {
    loading.value = false;
  }
}

// -------------------------------------------------------------
// Categories
// -------------------------------------------------------------
const categoryList = computed(() => {
  const cats = new Set();
  for (const p of allProducts.value) {
    if (p.category) cats.add(p.category);
  }
  return Array.from(cats).sort();
});

const selectedCategoryLabel = computed(() => {
  if (selectedCategory.value === "all") return "Category: All";
  return selectedCategory.value;
});

// -------------------------------------------------------------
// Dynamic Keyword Matching & Fuzzy Search
// -------------------------------------------------------------
function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function wordMatches(term, target) {
  if (!target) return false;
  const normTarget = String(target).toLowerCase();
  if (normTarget.includes(term)) return true;
  // If term has typos (e.g. "cokke" for "coke", "fantaa" for "fanta"), allow edit distance <= 2 for words >= 4 chars
  if (term.length >= 4 && normTarget.length >= 3) {
    for (const part of normTarget.split(/\s+/)) {
      if (Math.abs(part.length - term.length) <= 2 && levenshteinDistance(term, part) <= 2) {
        return true;
      }
    }
  }
  return false;
}

function matchesDynamicSearch(product, rawQuery) {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;

  const terms = query.split(/\s+/).filter(Boolean);

  const name = product.name || "";
  const barcode = product.barcode || "";
  const sku = product.sku || "";
  const brand = product.brand || "";
  const category = product.category || "";
  const keywords = Array.isArray(product.keywords) ? product.keywords : [];

  return terms.every((term) => {
    if (wordMatches(term, name)) return true;
    if (wordMatches(term, barcode)) return true;
    if (wordMatches(term, sku)) return true;
    if (wordMatches(term, brand)) return true;
    if (wordMatches(term, category)) return true;
    if (keywords.some((k) => wordMatches(term, k))) return true;
    return false;
  });
}

function hasMatchedKeywords(product) {
  if (!searchQuery.value.trim() || !Array.isArray(product.keywords)) return false;
  const term = searchQuery.value.trim().toLowerCase();
  return product.keywords.some((k) => wordMatches(term, k));
}

function getMatchedKeywords(product) {
  if (!searchQuery.value.trim() || !Array.isArray(product.keywords)) return [];
  const term = searchQuery.value.trim().toLowerCase();
  return product.keywords.filter((k) => wordMatches(term, k)).slice(0, 3);
}

// -------------------------------------------------------------
// Filtered Products List
// -------------------------------------------------------------
const filteredProducts = computed(() => {
  countInputRefs.value = [];
  return allProducts.value.filter((p) => {
    // Category filter
    if (selectedCategory.value !== "all" && p.category !== selectedCategory.value) {
      return false;
    }

    // Status / View filter
    const entry = entries.value[p.id];
    const isModified = entry && entry.is_modified;

    if (activeFilter.value === "modified" && !isModified) {
      return false;
    }

    if (activeFilter.value === "discrepancy") {
      if (!isModified) return false;
      const variance = getRowVariance(p.id, p.current_quantity);
      if (variance === 0) return false;
    }

    // Dynamic keyword & search filter
    return matchesDynamicSearch(p, searchQuery.value);
  });
});

// -------------------------------------------------------------
// Entry & Variance Handlers
// -------------------------------------------------------------
function isRowModified(productId) {
  return entries.value[productId]?.is_modified ?? false;
}

function getEntryValue(productId) {
  const entry = entries.value[productId];
  if (!entry || entry.new_count === null || entry.new_count === undefined) {
    return "";
  }
  return entry.new_count;
}

function getEntryReason(productId) {
  return entries.value[productId]?.reason || "audit_count";
}

function getEntryNote(productId) {
  return entries.value[productId]?.notes || "";
}

function setRowReason(productId, reasonVal) {
  if (!entries.value[productId]) {
    entries.value[productId] = { new_count: null, is_modified: false, reason: reasonVal, notes: "" };
  } else {
    entries.value[productId].reason = reasonVal;
  }
}

function setRowNote(productId, noteVal) {
  if (!entries.value[productId]) {
    entries.value[productId] = { new_count: null, is_modified: false, reason: "audit_count", notes: noteVal };
  } else {
    entries.value[productId].notes = noteVal;
  }
}

function onCountInput(product, rawVal) {
  const trimmed = String(rawVal).trim();
  const existingReason = entries.value[product.id]?.reason || "audit_count";
  const existingNotes = entries.value[product.id]?.notes || "";

  if (trimmed === "") {
    entries.value[product.id] = {
      new_count: null,
      is_modified: false,
      reason: existingReason,
      notes: existingNotes,
    };
    return;
  }

  const numVal = Number(trimmed);
  if (!isNaN(numVal) && numVal >= 0) {
    entries.value[product.id] = {
      new_count: numVal,
      is_modified: true,
      reason: existingReason,
      notes: existingNotes,
    };
  }
}

function fillAllWithCurrentCount() {
  for (const p of filteredProducts.value) {
    const existingReason = entries.value[p.id]?.reason || "audit_count";
    const existingNotes = entries.value[p.id]?.notes || "";
    entries.value[p.id] = {
      new_count: p.current_quantity,
      is_modified: true,
      reason: existingReason,
      notes: existingNotes,
    };
  }
}

function clearRowEntry(productId) {
  if (entries.value[productId]) {
    entries.value[productId].new_count = null;
    entries.value[productId].is_modified = false;
    entries.value[productId].notes = "";
  }
}

function clearAllEntries() {
  for (const p of allProducts.value) {
    entries.value[p.id] = {
      new_count: null,
      is_modified: false,
      reason: "audit_count",
      notes: "",
    };
  }
}

function resetFilters() {
  searchQuery.value = "";
  activeFilter.value = "all";
  selectedCategory.value = "all";
}

function getRowVariance(productId, currentQty) {
  const entry = entries.value[productId];
  if (!entry || !entry.is_modified || entry.new_count === null) {
    return 0;
  }
  // Physical count audit: variance = new count on shelf - current system quantity
  return Number((entry.new_count - (currentQty || 0)).toFixed(4));
}

const modifiedCount = computed(() => {
  let count = 0;
  for (const id in entries.value) {
    if (entries.value[id].is_modified) count++;
  }
  return count;
});

const discrepancyCount = computed(() => {
  let count = 0;
  for (const p of allProducts.value) {
    const entry = entries.value[p.id];
    if (entry && entry.is_modified && entry.new_count !== null) {
      const v = getRowVariance(p.id, p.current_quantity);
      if (v !== 0) count++;
    }
  }
  return count;
});

const netVariance = computed(() => {
  let total = 0;
  for (const p of allProducts.value) {
    const entry = entries.value[p.id];
    if (entry && entry.is_modified && entry.new_count !== null) {
      total += getRowVariance(p.id, p.current_quantity);
    }
  }
  return Number(total.toFixed(4));
});

function formatVariance(val) {
  return Number(val.toFixed(2));
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    return format(parseISO(iso), "MMM d, yyyy");
  } catch (e) {
    return iso;
  }
}

function formatRelativeTime(iso) {
  if (!iso) return "";
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch (e) {
    return "";
  }
}

// -------------------------------------------------------------
// Submit Batch Adjustment
// -------------------------------------------------------------
async function submitBatchAdjustment() {
  const items = [];
  for (const p of allProducts.value) {
    const entry = entries.value[p.id];
    if (entry && entry.is_modified && entry.new_count !== null && entry.new_count >= 0) {
      items.push({
        tenant_product_id: p.id,
        quantity: Number(entry.new_count),
        reason: entry.reason || "audit_count",
        is_physical_count: true,
        notes: entry.notes?.trim() || undefined,
      });
    }
  }

  if (items.length === 0) return;

  saving.value = true;
  try {
    const payload = {
      branch_id: activeBranchId.value,
      reason: "audit_count",
      notes: globalNotes.value.trim() || undefined,
      items,
    };

    const { data } = await StockAPI.adjustBatch(payload);

    if (window.bootstrap?.Modal) {
      const modal = window.bootstrap.Modal.getInstance(modalEl.value);
      modal?.hide();
    }

    emit("saved", {
      count: items.length,
      result: data,
      message: data.message || `Successfully adjusted ${items.length} ${items.length === 1 ? 'product' : 'products'}.`,
    });
  } catch (err) {
    console.error("Error submitting batch adjustment:", err);
    emit("error", err.response?.data?.message || "Failed to save stock adjustments. Please try again.");
  } finally {
    saving.value = false;
  }
}

// -------------------------------------------------------------
// Public Open Method
// -------------------------------------------------------------
function open(row = null) {
  searchQuery.value = "";
  activeFilter.value = "all";
  selectedCategory.value = "all";
  globalNotes.value = "";
  saving.value = false;

  loadCountSheet(row);

  if (window.bootstrap?.Modal) {
    const modal = window.bootstrap.Modal.getOrCreateInstance(modalEl.value);
    modal.show();
  }
}

defineExpose({ open });
</script>

<style scoped>
.custom-modal-size {
  max-width: 980px !important;
  width: 92vw !important;
}

.custom-modal-size .modal-content {
  max-height: 85vh;
}

@media (max-width: 1199.98px) {
  .custom-modal-size {
    max-width: 96vw !important;
    width: 96vw !important;
  }
}

@media (max-width: 575.98px) {
  .custom-modal-size {
    max-width: 100vw !important;
    width: 100vw !important;
  }
}

.audit-table th {
  background-color: #f8f9fa;
  border-bottom: 2px solid #eff2f7;
  font-weight: 700;
  letter-spacing: 0.3px;
  padding: 8px 12px;
}

.audit-row td {
  padding: 8px 12px;
  vertical-align: middle;
}

.audit-row:hover {
  background-color: #fcfdfe;
}

.table-active-row {
  background-color: rgba(85, 110, 230, 0.06) !important;
}

.cursor-pointer {
  cursor: pointer;
}

.line-height-1 {
  line-height: 1;
}

.transition-all {
  transition: all 0.15s ease-in-out;
}

.product-thumb {
  width: 32px;
  height: 32px;
}
</style>
