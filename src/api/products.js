import { tenantClient } from "./index";

/**
 * The business's own products (ProductController, 12 Nov 2026).
 *
 *   list(params)        GET   /products        q, is_active, category_id, stock (low|out), sort_by
 *                                              (name|selling_price|created_at), sort_order, page, per_page
 *                                              any role · -> { data: [row], meta: { total, …, counts: { all, active } } }
 *   get(id)             GET   /products/{id}   any role · the row + description, keywords, stock per branch,
 *                                              latest 20 movements
 *   categories()        GET   /products/categories   any role · [{ id, name, path }]
 *   lookup(barcode)     GET   /products/lookup?barcode=   owner, manager (60 a minute)
 *                       -> { data: { barcode, valid, check_digit_ok, in_store_code,
 *                            source: shop | catalogue | openfoodfacts | openproductsfacts |
 *                                    openbeautyfacts | openpetfoodfacts | none,
 *                            source_label, verified, checked: [...], existing (shop), suggestion } }
 *   create(body)        POST  /products        owner, manager · { name, selling_price, barcode?, generate_barcode?,
 *                                              category_id?, unit (piece|kg|litre|metre), cost_price?, vat_type?,
 *                                              opening_stock?, reorder_level?, branch_id?, brand?, size_label?,
 *                                              description?, sku?, keywords?, catalogue_product_id?, lookup_source?,
 *                                              propose_to_catalogue?, packs?: [{ name, units, selling_price,
 *                                              cost_price?, barcode? }] }  -> 201 { data: product + proposed_to_catalogue }
 *   update(id, body)    PATCH /products/{id}   owner, manager · any of the above, is_active; packs replaces all
 *   uploadImage(id, f)  POST  /products/{id}/image   owner, manager · PNG / JPG / WebP ≤ 2 MB
 *
 * A barcode already on a product or pack of this business is a 422 on that field
 * ("You already sell this: …"); so is a GTIN whose last digit is wrong.
 */
export default {
  list(params = {}) {
    return tenantClient.get("/products", { params });
  },
  get(id) {
    return tenantClient.get(`/products/${id}`);
  },
  categories() {
    return tenantClient.get("/products/categories");
  },
  lookup(barcode) {
    return tenantClient.get("/products/lookup", { params: { barcode } });
  },
  create(body) {
    return tenantClient.post("/products", body);
  },
  update(id, body) {
    return tenantClient.patch(`/products/${id}`, body);
  },
  uploadImage(id, file) {
    const fd = new FormData();
    fd.append("file", file);
    return tenantClient.post(`/products/${id}/image`, fd);
  },
};
