import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

export type EstimatePdfData = {
  company: {
    name: string;
    phone: string;
    email: string;
    licenseNumber: string;
    address: string[];
    logoUrl: string | null;
  };
  customer: {
    name: string;
    email: string;
    address: string[];
  };
  estimate: {
    number: string;
    title: string;
    status: string;
    createdAt: string;
    expiresAt: string | null;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    notes: string;
    terms: string;
    showQuantity: boolean;
    showRate: boolean;
    paymentSchedule: Array<{ title: string; percentage: number }>;
  };
  items: Array<{
    id: string;
    title: string;
    scope: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
};

const colors = {
  ink: "#0f172a",
  muted: "#64748b",
  border: "#cbd5e1",
  soft: "#f8fafc",
  blue: "#1d4ed8",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingRight: 36,
    paddingBottom: 46,
    paddingLeft: 36,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: colors.ink,
    lineHeight: 1.4,
  },
  companyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink,
  },
  companyIdentity: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "62%",
  },
  logo: {
    width: 58,
    height: 58,
    objectFit: "contain",
    marginRight: 12,
  },
  companyText: {
    flexGrow: 1,
    minWidth: 0,
  },
  companyName: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  smallText: {
    color: colors.muted,
    marginBottom: 2,
  },
  estimateIdentity: {
    width: "34%",
    alignItems: "flex-end",
  },
  documentLabel: {
    fontSize: 8,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  documentNumber: {
    marginTop: 3,
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
  },
  status: {
    marginTop: 7,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    fontSize: 8,
    textTransform: "uppercase",
  },
  parties: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  partyColumn: {
    width: "48%",
  },
  sectionLabel: {
    marginBottom: 6,
    fontSize: 8,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Helvetica-Bold",
  },
  partyName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  project: {
    paddingVertical: 18,
  },
  projectTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
  },
  expiration: {
    marginTop: 5,
    color: colors.muted,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 7,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.ink,
    fontSize: 7.5,
    color: colors.muted,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  item: {
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  titleColumn: {
    width: "55%",
    paddingRight: 8,
  },
  numberColumn: {
    width: "15%",
    textAlign: "right",
    paddingLeft: 4,
  },
  itemTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  scopeBox: {
    width: "100%",
    marginTop: 8,
    padding: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.soft,
  },
  scopeLabel: {
    marginBottom: 4,
    fontSize: 7,
    color: colors.muted,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  scopeText: {
    width: "100%",
    fontSize: 8.5,
    lineHeight: 1.45,
  },
  totals: {
    width: "42%",
    alignSelf: "flex-end",
    marginTop: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    paddingTop: 9,
    borderTopWidth: 1.5,
    borderTopColor: colors.ink,
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
  },
  notesSection: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paragraph: {
    fontSize: 8.5,
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    color: colors.muted,
    fontSize: 7,
  },
});

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function displayDate(value: string | null) {
  if (!value) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default function EstimatePdfDocument({
  data,
}: {
  data: EstimatePdfData;
}) {
  const lineItemWidth =
    data.estimate.showQuantity &&
    data.estimate.showRate
      ? "55%"
      : data.estimate.showQuantity ||
          data.estimate.showRate
        ? "75%"
        : "85%";

  return (
    <Document
      title={`Estimate ${data.estimate.number}`}
      author={data.company.name}
      subject={data.estimate.title}
    >
      <Page size="LETTER" style={styles.page} wrap>
        <View style={styles.companyHeader}>
          <View style={styles.companyIdentity}>
            {data.company.logoUrl ? (
              <>
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <Image
                  src={data.company.logoUrl}
                  style={styles.logo}
                />
              </>
            ) : null}

            <View style={styles.companyText}>
              <Text style={styles.companyName}>
                {data.company.name}
              </Text>

              {data.company.address.map((line) => (
                <Text key={line} style={styles.smallText}>
                  {line}
                </Text>
              ))}

              {data.company.phone ? (
                <Text style={styles.smallText}>
                  {data.company.phone}
                </Text>
              ) : null}

              {data.company.email ? (
                <Text style={styles.smallText}>
                  {data.company.email}
                </Text>
              ) : null}

              {data.company.licenseNumber ? (
                <Text style={styles.smallText}>
                  License: {data.company.licenseNumber}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.estimateIdentity}>
            <Text style={styles.documentLabel}>Estimate</Text>
            <Text style={styles.documentNumber}>
              {data.estimate.number}
            </Text>

          </View>
        </View>

        <View style={styles.parties}>
          <View style={styles.partyColumn}>
            <Text style={styles.sectionLabel}>Prepared for</Text>
            <Text style={styles.partyName}>
              {data.customer.name}
            </Text>

            {data.customer.address.map((line) => (
              <Text key={line} style={styles.smallText}>
                {line}
              </Text>
            ))}

            {data.customer.email ? (
              <Text style={styles.smallText}>
                {data.customer.email}
              </Text>
            ) : null}
          </View>

          <View style={styles.partyColumn}>
            <Text style={styles.sectionLabel}>
              Estimate details
            </Text>
            <Text style={styles.smallText}>
              Created: {displayDate(data.estimate.createdAt)}
            </Text>
            <Text style={styles.smallText}>
              Valid until:{" "}
              {displayDate(data.estimate.expiresAt)}
            </Text>
          </View>
        </View>

        <View style={styles.project}>
          <Text style={styles.sectionLabel}>Project</Text>
          <Text style={styles.projectTitle}>
            {data.estimate.title}
          </Text>
        </View>

        <View style={styles.tableHeader}>
          <Text
            style={[
              styles.titleColumn,
              { width: lineItemWidth },
            ]}
          >
            Description
          </Text>

          {data.estimate.showQuantity ? (
            <Text style={styles.numberColumn}>
              Quantity
            </Text>
          ) : null}

          {data.estimate.showRate ? (
            <Text style={styles.numberColumn}>
              Rate
            </Text>
          ) : null}

          <Text style={styles.numberColumn}>Total</Text>
        </View>

        {data.items.map((item) => (
          <View key={item.id} style={styles.item} wrap>
            <View style={styles.itemTop}>
              <Text
                style={[
                  styles.titleColumn,
                  { width: lineItemWidth },
                ]}
              >
                <Text style={styles.itemTitle}>
                  {item.title}
                </Text>
              </Text>

              {data.estimate.showQuantity ? (
                <Text style={styles.numberColumn}>
                  {item.quantity}
                </Text>
              ) : null}

              {data.estimate.showRate ? (
                <Text style={styles.numberColumn}>
                  {money(item.unitPrice)}
                </Text>
              ) : null}

              <Text style={styles.numberColumn}>
                {money(item.amount)}
              </Text>
            </View>

            <View style={styles.scopeBox}>
              <Text style={styles.scopeText}>
                {item.scope}
              </Text>
            </View>
          </View>
        ))}

        <View style={styles.totals} wrap={false}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{money(data.estimate.subtotal)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text>Tax ({data.estimate.taxRate}%)</Text>
            <Text>{money(data.estimate.taxAmount)}</Text>
          </View>

                    <View style={styles.grandTotal}>
            <Text>Total</Text>
            <Text>{money(data.estimate.total)}</Text>
          </View>
        </View>

        {data.estimate.paymentSchedule && data.estimate.paymentSchedule.length > 0 ? (
          <View style={styles.notesSection}>
            <Text style={styles.sectionLabel}>Payment schedule</Text>
            {data.estimate.paymentSchedule.map((schedule, index) => (
              <View key={index} style={styles.totalRow}>
                <Text>{schedule.title} ({schedule.percentage}%)</Text>
                <Text>{money(data.estimate.total * (schedule.percentage / 100))}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {data.estimate.notes ? (
          <View style={styles.notesSection}>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Text style={styles.paragraph}>
              {data.estimate.notes}
            </Text>
          </View>
        ) : null}

        {data.estimate.terms ? (
          <View style={styles.notesSection}>
            <Text style={styles.sectionLabel}>
              Terms and conditions
            </Text>
            <Text style={styles.paragraph}>
              {data.estimate.terms}
            </Text>
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>
            {data.company.name} Ã‚Â· Estimate{" "}
            {data.estimate.number}
          </Text>

          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}