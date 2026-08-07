type SalesOrderCustomerSnapshotSource = {
  clientName?: string | null;
  clientNameSnapshot?: string | null;
  citySnapshot?: string | null;
  stateSnapshot?: string | null;
  gstinSnapshot?: string | null;
  customer?: {
    companyName?: string | null;
    city?: string | null;
    state?: string | null;
    gstin?: string | null;
  } | null;
};

function normalized(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed || "";
}

export function resolveSalesOrderCustomerSnapshot(
  order: SalesOrderCustomerSnapshotSource,
) {
  return {
    clientNameSnapshot:
      normalized(order.customer?.companyName) ||
      normalized(order.clientNameSnapshot) ||
      normalized(order.clientName),
    citySnapshot:
      normalized(order.customer?.city) || normalized(order.citySnapshot),
    stateSnapshot:
      normalized(order.customer?.state) || normalized(order.stateSnapshot),
    gstinSnapshot:
      normalized(order.customer?.gstin) || normalized(order.gstinSnapshot),
  };
}
