"""
Royal Knot OS — Odoo model & field mappings.

This module documents the Odoo model names used by Royal Knot OS and the
field mappings between our domain objects and Odoo's native fields.

All mappings are *proposed* and should be verified against the actual Odoo
instance once modules are installed.
"""

from __future__ import annotations

# ── Odoo Model Mappings ─────────────────────────────────────────────────
# Key   = Royal Knot domain name
# Value = Odoo technical model name

ODOO_MODELS: dict[str, str] = {
    "partner": "res.partner",
    "lead": "crm.lead",
    "project": "project.project",
    "task": "project.task",
    "purchase_order": "purchase.order",
    "purchase_order_line": "purchase.order.line",
    "invoice": "account.move",
    "invoice_line": "account.move.line",
    "payment": "account.payment",
    "sale_order": "sale.order",
    "sale_order_line": "sale.order.line",
    "product": "product.product",
    "product_template": "product.template",
    "user": "res.users",
    "company": "res.company",
    "currency": "res.currency",
    "module": "ir.module.module",
}


# ── Field Mappings ──────────────────────────────────────────────────────
# Each dict maps  Royal-Knot-field → Odoo-field.
# Populated incrementally as each service module is built.

PARTNER_FIELDS: dict[str, str] = {
    # TODO: populate when building the couples / vendors service
}

LEAD_FIELDS: dict[str, str] = {
    # TODO: populate when building the CRM / lead service
}

PROJECT_FIELDS: dict[str, str] = {
    # TODO: populate when building the wedding-project service
}

TASK_FIELDS: dict[str, str] = {
    # TODO: populate when building the task / checklist service
}

PURCHASE_ORDER_FIELDS: dict[str, str] = {
    # TODO: populate when building the vendor-booking service
}

PURCHASE_ORDER_LINE_FIELDS: dict[str, str] = {
    # TODO: populate when building the vendor-booking line items
}

INVOICE_FIELDS: dict[str, str] = {
    # TODO: populate when building the invoicing service
}

INVOICE_LINE_FIELDS: dict[str, str] = {
    # TODO: populate when building the invoice line items
}

PAYMENT_FIELDS: dict[str, str] = {
    # TODO: populate when building the payment-tracking service
}

SALE_ORDER_FIELDS: dict[str, str] = {
    # TODO: populate when building the sale-order / package service
}

SALE_ORDER_LINE_FIELDS: dict[str, str] = {
    # TODO: populate when building the sale-order line items
}

PRODUCT_FIELDS: dict[str, str] = {
    # TODO: populate when building the product / service-catalogue
}

PRODUCT_TEMPLATE_FIELDS: dict[str, str] = {
    # TODO: populate when building the product-template service
}

USER_FIELDS: dict[str, str] = {
    # TODO: populate when building the user management service
}

COMPANY_FIELDS: dict[str, str] = {
    # TODO: populate when building the company / multi-company support
}

CURRENCY_FIELDS: dict[str, str] = {
    # TODO: populate — default currency is INR
}

MODULE_FIELDS: dict[str, str] = {
    # TODO: populate when building the module-status checker
}
