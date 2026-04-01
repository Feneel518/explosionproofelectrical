const PAYMENT_TERMS_LABELS: Record<string, string> = {
  ADVANCE: "Advance",
  AGAINST_PERFOMA_INVOICE: "Against Performa Invoice",
  AGAINST_DELIVERY: "Against Delivery",
  CREDIT_30: "Credit 30 Days",
  CREDIT_45: "Credit 45 Days",
  CREDIT_60: "Credit 60 Days",
};

const CREDIT_DAYS_BY_TERMS: Record<string, number> = {
  CREDIT_30: 30,
  CREDIT_45: 45,
  CREDIT_60: 60,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toValidDate(value?: Date | string | null) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function startOfDay(date: Date) {
  const clone = new Date(date);
  clone.setHours(0, 0, 0, 0);
  return clone;
}

function addDays(date: Date, days: number) {
  const clone = new Date(date);
  clone.setDate(clone.getDate() + days);
  return clone;
}

export function getPaymentTermsLabel(paymentTerms?: string | null) {
  if (!paymentTerms) return "Not Specified";
  return PAYMENT_TERMS_LABELS[paymentTerms] ?? paymentTerms;
}

export function getPaymentDueDateFromTerms({
  paymentTerms,
  invoiceDate,
  dispatchDate,
}: {
  paymentTerms?: string | null;
  invoiceDate?: Date | string | null;
  dispatchDate?: Date | string | null;
}) {
  const invoiceDateValue = toValidDate(invoiceDate);
  const dispatchDateValue = toValidDate(dispatchDate);

  if (!invoiceDateValue && !dispatchDateValue) return null;

  if (paymentTerms === "AGAINST_DELIVERY") {
    return dispatchDateValue ?? invoiceDateValue;
  }

  const creditDays = paymentTerms ? CREDIT_DAYS_BY_TERMS[paymentTerms] : 0;

  if (creditDays > 0) {
    return addDays(invoiceDateValue ?? dispatchDateValue!, creditDays);
  }

  return invoiceDateValue ?? dispatchDateValue;
}

export function getPaymentReminderState({
  paymentTerms,
  invoiceDate,
  dispatchDate,
  paymentReceived,
}: {
  paymentTerms?: string | null;
  invoiceDate?: Date | string | null;
  dispatchDate?: Date | string | null;
  paymentReceived?: boolean | null;
}) {
  const dueDate = getPaymentDueDateFromTerms({
    paymentTerms,
    invoiceDate,
    dispatchDate,
  });

  const isPaid = Boolean(paymentReceived);
  const today = startOfDay(new Date());
  const dueDay = dueDate ? startOfDay(dueDate) : null;

  const daysUntilDue =
    dueDay === null ? null : Math.ceil((dueDay.getTime() - today.getTime()) / MS_PER_DAY);

  const isOverdue = !isPaid && daysUntilDue !== null && daysUntilDue < 0;
  const isDueToday = !isPaid && daysUntilDue === 0;
  const shouldRemind = !isPaid && daysUntilDue !== null && daysUntilDue <= 0;

  let statusText = "Pending";
  if (isPaid) {
    statusText = "Paid";
  } else if (daysUntilDue === null) {
    statusText = "Pending";
  } else if (daysUntilDue < 0) {
    statusText = `Overdue by ${Math.abs(daysUntilDue)} day(s)`;
  } else if (daysUntilDue === 0) {
    statusText = "Due today";
  } else {
    statusText = `Due in ${daysUntilDue} day(s)`;
  }

  return {
    dueDate,
    daysUntilDue,
    isPaid,
    isOverdue,
    isDueToday,
    shouldRemind,
    statusText,
  };
}
