/**
 * Tenant de demonstração usado quando nenhum `x-tenant-id` é informado.
 * Nesta fase o tenant vem por header; com a entrada do Identity & Tenancy
 * (issue #2), ele passará a derivar do JWT/OIDC.
 */
export const DEMO_TENANT_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_TENANT_SLUG = "demo";
export const DEMO_TENANT_NAME = "Vantar Demo";

export const TENANT_HEADER = "x-tenant-id";
