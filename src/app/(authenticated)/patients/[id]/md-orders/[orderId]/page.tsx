import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { db } from "@/db";
import { mdOrders, patients } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { MdOrderStatusControl } from "./StatusControl";

const STATUS_LABEL: Record<string, string> = {
  draft:      "Draft",
  sent_to_md: "Sent to MD",
  signed:     "Signed",
  expired:    "Expired",
};

const STATUS_CLASS: Record<string, string> = {
  draft:      "bg-yellow-50 text-yellow-700 border-yellow-200",
  sent_to_md: "bg-blue-50 text-blue-700 border-blue-200",
  signed:     "bg-green-50 text-green-700 border-green-200",
  expired:    "bg-gray-100 text-gray-500 border-gray-200",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[180px_1fr] gap-2 py-1 border-b border-gray-100 last:border-0 text-sm">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

export default async function MdOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string; orderId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) notFound();

  const { id, orderId } = await params;
  const patientId = Number(id);
  const orderIdNum = Number(orderId);

  const [patient, order] = await Promise.all([
    db.query.patients.findFirst({ where: eq(patients.id, patientId) }),
    db.query.mdOrders.findFirst({
      where: eq(mdOrders.id, orderIdNum),
      with: { createdBy: true, signedBy: true },
    }),
  ]);

  if (!patient || !order || order.patientId !== patientId) notFound();

  const isAdmin = session.user.role === "admin" || session.user.role === "staff";
  const isDraft = order.status === "draft";
  const patientName = `${patient.firstName} ${patient.lastName}`;
  const dob = new Date(patient.dateOfBirth).toLocaleDateString();

  const freqRows = (order.visitFrequency ?? []) as { discipline: string; frequency: string }[];

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-10">
      {/* Breadcrumb + actions */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/patients" className="hover:underline">Patients</Link>
            <span>/</span>
            <Link href={`/patients/${patientId}`} className="hover:underline">{patientName}</Link>
            <span>/</span>
            <Link href={`/patients/${patientId}/chart`} className="hover:underline">Chart</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">MD Order #{order.id}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Physician Order</h1>
            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${STATUS_CLASS[order.status] ?? STATUS_CLASS.draft}`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isDraft && (
            <Link
              href={`/patients/${patientId}/md-orders/${order.id}/edit`}
              className="text-sm px-3 py-1.5 rounded-md border border-[#1e5f8a] text-[#1e5f8a] hover:bg-blue-50"
            >
              Edit
            </Link>
          )}
          <Link
            href={`/patients/${patientId}/chart`}
            className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            ← Chart
          </Link>
        </div>
      </div>

      {/* Patient header */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Patient Information</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Patient Name</p>
            <p className="font-semibold">{patientName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">MR Number</p>
            <p className="font-semibold">{patient.patientId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">DOB</p>
            <p className="font-semibold">{dob}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Insurance</p>
            <p className="font-semibold">{patient.insurancePrimary?.name ?? "—"}</p>
          </div>
          {patient.physicianName && (
            <div className="col-span-2 sm:col-span-4">
              <p className="text-xs text-gray-500">Physician</p>
              <p className="font-semibold">
                {patient.physicianName}
                {patient.physicianNpi && <span className="text-gray-400 font-normal ml-2">NPI: {patient.physicianNpi}</span>}
                {patient.physicianPhone && <span className="text-gray-400 font-normal ml-2">· {patient.physicianPhone}</span>}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Order metadata */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Order Details</h2>
        <Row label="Order Type" value={order.orderType === "verbal" ? "Verbal Order" : "Non-Verbal Order"} />
        {order.orderType === "verbal" && (
          <>
            <Row label="Received By" value={order.verbalReceivedBy} />
            <Row label="Received From" value={order.verbalReceivedFrom} />
            <Row label="Date Received" value={order.dateReceived ?? undefined} />
            <Row label="Time Received" value={order.timeReceived} />
            <Row
              label="Read Back & Verified"
              value={order.verbalReadBack ? "✓ Yes" : "No"}
            />
          </>
        )}
        <Row label="Effective Date" value={order.effectiveDate ?? undefined} />
      </div>

      {/* Clinical Notes */}
      {order.clinicalNotes && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Physician Communication / Clinical Notes</h2>
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{order.clinicalNotes}</p>
        </div>
      )}

      {/* Orders section */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-4">Orders</h2>

        {freqRows.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Visit Frequency</p>
            <div className="space-y-1">
              {freqRows.map((r, i) => (
                <p key={i} className="text-sm text-gray-800">
                  <span className="font-medium">{r.discipline}:</span>{" "}
                  {r.frequency}
                </p>
              ))}
            </div>
          </div>
        )}

        {order.interventions && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Interventions</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{order.interventions}</p>
          </div>
        )}

        {order.infusionInterventions && (
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Infusion Therapy Interventions</p>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{order.infusionInterventions}</p>
          </div>
        )}
      </div>

      {/* Signature block */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Signatures</h2>
        <div className="space-y-2 text-sm">
          {order.signedAt && order.signedBy && (
            <p className="text-gray-700">
              <span className="font-medium">Electronically signed by:</span>{" "}
              {order.signedBy.name} · {new Date(order.signedAt).toLocaleString()}
            </p>
          )}
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-8">
            <div>
              <div className="h-10 border-b border-gray-300" />
              <p className="text-xs text-gray-500 mt-1">Physician&apos;s Signature</p>
            </div>
            <div>
              <div className="h-10 border-b border-gray-300" />
              <p className="text-xs text-gray-500 mt-1">Date</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin status control */}
      {isAdmin && (
        <MdOrderStatusControl
          patientId={patientId}
          orderId={order.id}
          currentStatus={order.status}
        />
      )}

      {/* Footer */}
      <div className="text-xs text-gray-400 text-center">
        Created {new Date(order.createdAt!).toLocaleString()} by {order.createdBy?.name ?? "Unknown"}
      </div>
    </div>
  );
}
