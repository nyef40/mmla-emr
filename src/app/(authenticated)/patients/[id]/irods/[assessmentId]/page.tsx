import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/auth";
import { db } from "@/db";
import { irodsAssessments, patients } from "@/db/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { PrintButton } from "./PrintButton";

const IRODS_ITEMS = [
  "Read a newspaper or a book?",
  "Eat?",
  "Brush your teeth?",
  "Wash the upper part of your body?",
  "Go to the toilet?",
  "Prepare a snack?",
  "Put clothes on your upper body?",
  "Wash the lower part of your body?",
  "Move a chair?",
  "Turn a key in a lock?",
  "Go to the family doctor?",
  "Take a shower?",
  "Do the dishes?",
  "Do the shopping?",
  "Pick up an object (e.g. a ball)?",
  "Bend down to pick up an object?",
  "Climb a flight of stairs?",
  "Travel on public transport?",
  "Walk around obstacles?",
  "Take a walk up to a maximum of 1 km?",
  "Carry a heavy object and place it on the ground?",
  "Dance?",
  "Stand for a long period of time (e.g. several hours)?",
  "Run?",
];

const RESPONSE_LABEL: Record<number, string> = {
  0: "Impossible",
  1: "With difficulty",
  2: "Easily",
};

const RESPONSE_CLASS: Record<number, string> = {
  0: "bg-red-50 text-red-700 border-red-200",
  1: "bg-yellow-50 text-yellow-700 border-yellow-200",
  2: "bg-green-50 text-green-700 border-green-200",
};

export default async function IrodsDetailPage({
  params,
}: {
  params: Promise<{ id: string; assessmentId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) notFound();

  const { id, assessmentId } = await params;
  const patientId = Number(id);
  const assessId = Number(assessmentId);

  const [patient, assessment] = await Promise.all([
    db.query.patients.findFirst({ where: eq(patients.id, patientId) }),
    db.query.irodsAssessments.findFirst({
      where: eq(irodsAssessments.id, assessId),
      with: { completedBy: true },
    }),
  ]);

  if (!patient || !assessment || assessment.patientId !== patientId) notFound();

  const responses = (assessment.responses ?? []) as number[];
  const rawScore = assessment.rawScore ?? responses.reduce((s, v) => s + v, 0);
  const centileApprox = Math.round((rawScore / 48) * 100);
  const patientName = `${patient.firstName} ${patient.lastName}`;
  const dob = new Date(patient.dateOfBirth).toLocaleDateString();

  // Score interpretation bands (approximate, based on published literature)
  let interpretation = "";
  let interpClass = "";
  if (rawScore <= 12) { interpretation = "Severe disability"; interpClass = "text-red-700"; }
  else if (rawScore <= 24) { interpretation = "Moderate disability"; interpClass = "text-orange-600"; }
  else if (rawScore <= 36) { interpretation = "Mild disability"; interpClass = "text-yellow-600"; }
  else { interpretation = "Minimal / no disability"; interpClass = "text-green-700"; }

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-12 print:space-y-3">
      {/* Header — hidden when printing via browser */}
      <div className="flex items-start justify-between print:hidden">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/patients" className="hover:underline">Patients</Link>
            <span>/</span>
            <Link href={`/patients/${patientId}`} className="hover:underline">{patientName}</Link>
            <span>/</span>
            <Link href={`/patients/${patientId}/chart`} className="hover:underline">Chart</Link>
            <span>/</span>
            <span className="text-gray-800 font-medium">I-RODS #{assessment.id}</span>
          </div>
          <h1 className="text-xl font-bold">I-RODS Disability Scale</h1>
        </div>
        <div className="flex gap-2">
          <PrintButton />
          <Link
            href={`/patients/${patientId}/chart`}
            className="text-sm px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            ← Chart
          </Link>
        </div>
      </div>

      {/* Print title */}
      <div className="hidden print:block text-center border-b pb-3 mb-3">
        <h1 className="text-lg font-bold">I-RODS — Inflammatory Rasch-built Overall Disability Scale</h1>
        <p className="text-sm text-gray-600">Assessment #{assessment.id}</p>
      </div>

      {/* Patient + Assessment Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Patient</p>
            <p className="font-semibold">{patientName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">MR #</p>
            <p className="font-semibold">{patient.patientId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">DOB</p>
            <p className="font-semibold">{dob}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Assessment Date</p>
            <p className="font-semibold">
              {new Date(assessment.assessmentDate).toLocaleDateString()}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Completed By</p>
            <p className="font-semibold">{assessment.completedBy?.name ?? "—"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-500">Completed On</p>
            <p className="font-semibold">{new Date(assessment.createdAt!).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Score Summary */}
      <div className="rounded-lg border-2 border-[#1e5f8a] bg-blue-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#1e5f8a] mb-3">Score Summary</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-4xl font-bold text-[#1e5f8a]">{rawScore}</p>
            <p className="text-xs text-gray-600 mt-1">Raw Score</p>
            <p className="text-xs text-gray-400">out of 48</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-[#1e5f8a]">~{centileApprox}</p>
            <p className="text-xs text-gray-600 mt-1">Centile (approx.)</p>
            <p className="text-xs text-gray-400">0–100 scale</p>
          </div>
          <div>
            <p className={`text-base font-bold mt-2 ${interpClass}`}>{interpretation}</p>
            <p className="text-xs text-gray-400 mt-1">Score band</p>
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-3 text-center">
          Centile is a linear approximation. Validated Rasch centile conversion requires the published I-RODS nomogram (Vanhoutte et al., 2015).
          Clinically meaningful change: ≥4 points raw / ≥8 points centile.
        </p>
      </div>

      {/* Item responses */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-[#1e5f8a] text-white text-left">
              <th className="px-4 py-2.5 font-medium w-8">#</th>
              <th className="px-4 py-2.5 font-medium">Activity</th>
              <th className="px-4 py-2.5 font-medium w-16 text-center">Score</th>
              <th className="px-4 py-2.5 font-medium w-36">Response</th>
            </tr>
          </thead>
          <tbody>
            {IRODS_ITEMS.map((item, i) => {
              const val = responses[i] ?? 0;
              return (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-2 text-gray-800">Can the patient… {item}</td>
                  <td className="px-4 py-2 text-center font-bold text-gray-700">{val}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${RESPONSE_CLASS[val]}`}>
                      {RESPONSE_LABEL[val]}
                    </span>
                  </td>
                </tr>
              );
            })}
            <tr className="border-t bg-gray-50 font-semibold">
              <td colSpan={2} className="px-4 py-2 text-right text-sm text-gray-600">Total Raw Score</td>
              <td className="px-4 py-2 text-center text-[#1e5f8a] font-bold">{rawScore}</td>
              <td className="px-4 py-2 text-xs text-gray-400">out of 48</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {assessment.notes && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Clinical Notes</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{assessment.notes}</p>
        </div>
      )}

      {/* Signature block for print */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 print:block">
        <div className="grid grid-cols-2 gap-8 mt-2">
          <div>
            <div className="h-10 border-b border-gray-300" />
            <p className="text-xs text-gray-500 mt-1">Clinician Signature</p>
          </div>
          <div>
            <div className="h-10 border-b border-gray-300" />
            <p className="text-xs text-gray-500 mt-1">Date</p>
          </div>
        </div>
      </div>
    </div>
  );
}
