"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/ui/SectionCard";
import { ArrowLeft, Loader2, PlusCircle, Trash2 } from "lucide-react";

type Diagnosis = { description: string; icdCode: string; date: string };
const EMPTY_DX: Diagnosis = { description: "", icdCode: "", date: "" };

type IcdCode = { id: number; code: string; description: string; category: string };

type PhysicianEntry = {
  id: number;
  firstName: string;
  lastName: string;
  title: string | null;
  phone: string | null;
  npi: string | null;
};

type InsuranceEntry = {
  id: number;
  name: string;
  category: string;
  authRequired: boolean;
};

function DiagnosisRow({
  dx, onChange, onRemove, icdCodes,
}: {
  dx: Diagnosis;
  onChange: (d: Diagnosis) => void;
  onRemove?: () => void;
  icdCodes: IcdCode[];
}) {
  const [inputValue, setInputValue] = useState(dx.icdCode);
  const [open, setOpen] = useState(false);

  // Sync when parent sets value (e.g. initial patient load)
  useEffect(() => { setInputValue(dx.icdCode); }, [dx.icdCode]);

  const matches = inputValue.length >= 1
    ? icdCodes.filter(c =>
        c.code.toLowerCase().includes(inputValue.toLowerCase()) ||
        c.description.toLowerCase().includes(inputValue.toLowerCase())
      ).slice(0, 10)
    : [];

  function selectCode(c: IcdCode) {
    setInputValue(c.code);
    setOpen(false);
    onChange({ ...dx, icdCode: c.code, description: c.description });
  }

  return (
    <div className="grid grid-cols-[180px_1fr_130px_auto] gap-2 items-start">
      {/* ICD-10 search */}
      <div className="relative space-y-1">
        <Label className="text-xs">ICD-10</Label>
        <Input
          value={inputValue}
          onChange={e => {
            const v = e.target.value.toUpperCase();
            setInputValue(v);
            setOpen(true);
            onChange({ ...dx, icdCode: v });
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="G61.81 or search…"
          className="font-mono"
        />
        {open && matches.length > 0 && (
          <div className="absolute z-20 left-0 top-full mt-0.5 w-[420px] bg-white border border-gray-200 rounded-md shadow-lg max-h-52 overflow-y-auto">
            {matches.map(c => (
              <button
                key={c.id}
                type="button"
                onMouseDown={() => selectCode(c)}
                className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm flex items-baseline gap-2 border-b border-gray-50 last:border-0"
              >
                <span className="font-mono font-semibold text-[#1e5f8a] shrink-0 w-16">{c.code}</span>
                <span className="text-gray-700 leading-snug">{c.description}</span>
                <span className="ml-auto text-xs text-gray-400 shrink-0">{c.category}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Description — auto-filled on code select, still editable */}
      <div className="space-y-1">
        <Label className="text-xs">Description</Label>
        <Input
          value={dx.description}
          onChange={e => onChange({ ...dx, description: e.target.value })}
          placeholder="Auto-fills on code select"
        />
      </div>

      {/* Date */}
      <div className="space-y-1">
        <Label className="text-xs">Date</Label>
        <Input type="date" value={dx.date} onChange={e => onChange({ ...dx, date: e.target.value })} />
      </div>

      {onRemove
        ? <button type="button" onClick={onRemove} className="mt-6 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
        : <div />
      }
    </div>
  );
}

function RG({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-wrap gap-4">
      {options.map(o => (
        <label key={o.value} className="flex items-center gap-1.5 text-sm cursor-pointer">
          <input type="radio" checked={value === o.value} onChange={() => onChange(o.value)} className="h-3.5 w-3.5" />
          <span>{o.label}</span>
        </label>
      ))}
    </div>
  );
}

function localDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  const dt = new Date(d);
  return [dt.getFullYear(), String(dt.getMonth() + 1).padStart(2, "0"), String(dt.getDate()).padStart(2, "0")].join("-");
}

export default function EditPatientPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;
  const { status } = useSession();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [patientMRN, setPatientMRN] = useState("");

  // Library data
  const [physicianList, setPhysicianList] = useState<PhysicianEntry[]>([]);
  const [insuranceList, setInsuranceList] = useState<InsuranceEntry[]>([]);
  const [icdCodeList, setIcdCodeList] = useState<IcdCode[]>([]);

  // Patient fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [allergies, setAllergies] = useState("NKDA");
  const [medications, setMedications] = useState("");

  const [socDate, setSocDate] = useState("");
  const [admissionStatus, setAdmissionStatus] = useState("admitted");
  const [codeStatus, setCodeStatus] = useState("full_code");

  const [primaryDx, setPrimaryDx] = useState<Diagnosis>({ ...EMPTY_DX });
  const [otherDx, setOtherDx] = useState<Diagnosis[]>([]);

  // Physician — library selection + fallback custom fields
  const [selectedPhysicianId, setSelectedPhysicianId] = useState<string>("");
  const [physicianName, setPhysicianName] = useState("");
  const [physicianPhone, setPhysicianPhone] = useState("");
  const [physicianNpi, setPhysicianNpi] = useState("");

  // Primary insurance
  const [selectedPrimaryInsId, setSelectedPrimaryInsId] = useState<string>("");
  const [insName, setInsName] = useState("");
  const [insPolicyNo, setInsPolicyNo] = useState("");
  const [insGroupNo, setInsGroupNo] = useState("");
  const [insCategory, setInsCategory] = useState("");
  const [insAuthRequired, setInsAuthRequired] = useState(false);

  // Secondary insurance
  const [selectedSecondaryInsId, setSelectedSecondaryInsId] = useState<string>("");
  const [ins2Name, setIns2Name] = useState("");
  const [ins2PolicyNo, setIns2PolicyNo] = useState("");
  const [ins2GroupNo, setIns2GroupNo] = useState("");
  const [ins2Category, setIns2Category] = useState("");

  const [ecName, setEcName] = useState("");
  const [ecRelationship, setEcRelationship] = useState("");
  const [ecPhone, setEcPhone] = useState("");

  const [referralDate, setReferralDate] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [locationOfCare, setLocationOfCare] = useState("Home");
  const [supplyVendor, setSupplyVendor] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [pharmacyPhone, setPharmacyPhone] = useState("");
  const [servicesRn, setServicesRn] = useState(true);
  const [servicesPt, setServicesPt] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!patientId) return;
    Promise.all([
      fetch(`/api/patients/${patientId}`).then(r => r.json()),
      fetch("/api/libraries/physicians").then(r => r.json()),
      fetch("/api/libraries/insurances").then(r => r.json()),
      fetch("/api/libraries/icd-codes").then(r => r.json()),
    ])
      .then(([p, physicians, insurances, icdCodes]) => {
        const activePhysicians: PhysicianEntry[] = (physicians ?? []).filter((ph: PhysicianEntry & { isActive?: boolean }) => ph.isActive !== false);
        const activeInsurances: InsuranceEntry[] = (insurances ?? []).filter((i: InsuranceEntry & { isActive?: boolean }) => i.isActive !== false);
        setPhysicianList(activePhysicians);
        setInsuranceList(activeInsurances);
        setIcdCodeList((icdCodes ?? []).filter((c: IcdCode & { isActive?: boolean }) => c.isActive !== false));

        // Patient demographics
        setPatientMRN(p.patientId ?? "");
        setFirstName(p.firstName ?? "");
        setLastName(p.lastName ?? "");
        setDateOfBirth(localDate(p.dateOfBirth));
        setGender(p.gender ?? "male");
        setPhone(p.phone ?? "");
        setEmail(p.email ?? "");
        setAddress(p.address ?? "");
        setAllergies(p.allergies ?? "NKDA");
        setMedications(p.medications ?? "");
        setSocDate(localDate(p.socDate));
        setAdmissionStatus(p.admissionStatus ?? "admitted");
        setCodeStatus(p.codeStatus ?? "full_code");
        setPrimaryDx(p.primaryDiagnosis ?? { ...EMPTY_DX });
        setOtherDx(p.otherDiagnoses ?? []);

        // Physician — pre-select from library by NPI, then by formatted name
        setPhysicianName(p.physicianName ?? "");
        setPhysicianPhone(p.physicianPhone ?? "");
        setPhysicianNpi(p.physicianNpi ?? "");
        if (p.physicianNpi || p.physicianName) {
          const match = activePhysicians.find(ph =>
            (p.physicianNpi && ph.npi && ph.npi === p.physicianNpi) ||
            `${ph.lastName}, ${ph.firstName}` === p.physicianName
          );
          setSelectedPhysicianId(match ? String(match.id) : "custom");
        }

        // Primary insurance — pre-select by name
        const ip = p.insurancePrimary;
        if (ip) {
          setInsName(ip.name ?? "");
          setInsPolicyNo(ip.policyNumber ?? "");
          setInsGroupNo(ip.groupNumber ?? "");
          setInsCategory(ip.category ?? "");
          setInsAuthRequired(ip.authRequired ?? false);
          const matchIns = activeInsurances.find(i => i.name === ip.name);
          setSelectedPrimaryInsId(matchIns ? String(matchIns.id) : "custom");
        }

        // Secondary insurance
        const is = p.insuranceSecondary;
        if (is) {
          setIns2Name(is.name ?? "");
          setIns2PolicyNo(is.policyNumber ?? "");
          setIns2GroupNo(is.groupNumber ?? "");
          setIns2Category(is.category ?? "");
          const matchIns2 = activeInsurances.find(i => i.name === is.name);
          setSelectedSecondaryInsId(matchIns2 ? String(matchIns2.id) : "custom");
        }

        // Emergency contact + intake
        const ec = p.emergencyContact;
        if (ec) { setEcName(ec.name ?? ""); setEcRelationship(ec.relationship ?? ""); setEcPhone(ec.phone ?? ""); }
        const id = p.intakeData;
        if (id) {
          setReferralDate(id.referralDate ?? "");
          setReferralSource(id.referralSource ?? "");
          setLocationOfCare(id.locationOfCare ?? "Home");
          setSupplyVendor(id.supplyVendor ?? "");
          setPharmacyName(id.pharmacyName ?? "");
          setPharmacyPhone(id.pharmacyPhone ?? "");
          setServicesRn(id.servicesRn ?? true);
          setServicesPt(id.servicesPt ?? false);
        }
      })
      .catch(() => setError("Failed to load patient"))
      .finally(() => setLoading(false));
  }, [patientId]);

  function handlePhysicianSelect(val: string) {
    setSelectedPhysicianId(val);
    if (val === "" ) {
      setPhysicianName(""); setPhysicianPhone(""); setPhysicianNpi("");
      return;
    }
    if (val === "custom") return;
    const ph = physicianList.find(p => String(p.id) === val);
    if (ph) {
      setPhysicianName(`${ph.lastName}, ${ph.firstName}`);
      setPhysicianPhone(ph.phone ?? "");
      setPhysicianNpi(ph.npi ?? "");
    }
  }

  function handlePrimaryInsSelect(val: string) {
    setSelectedPrimaryInsId(val);
    if (val === "") { setInsName(""); setInsCategory(""); setInsAuthRequired(false); return; }
    if (val === "custom") return;
    const ins = insuranceList.find(i => String(i.id) === val);
    if (ins) { setInsName(ins.name); setInsCategory(ins.category); setInsAuthRequired(ins.authRequired); }
  }

  function handleSecondaryInsSelect(val: string) {
    setSelectedSecondaryInsId(val);
    if (val === "") { setIns2Name(""); setIns2Category(""); return; }
    if (val === "custom") return;
    const ins = insuranceList.find(i => String(i.id) === val);
    if (ins) { setIns2Name(ins.name); setIns2Category(ins.category); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!firstName.trim() || !lastName.trim() || !dateOfBirth) {
      setError("First name, last name, and date of birth are required.");
      return;
    }
    setSubmitting(true);
    // Yield to the renderer so the "Saving…" state paints before the fetch starts
    await new Promise(r => setTimeout(r, 0));
    try {
      const body = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: new Date(dateOfBirth).toISOString(),
        gender,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        allergies: allergies.trim() || null,
        medications: medications.trim() || null,
        socDate: socDate || null,
        admissionStatus,
        codeStatus,
        primaryDiagnosis: primaryDx.icdCode ? primaryDx : null,
        otherDiagnoses: otherDx.filter(d => d.icdCode).length ? otherDx.filter(d => d.icdCode) : null,
        insurancePrimary: insName ? { name: insName, policyNumber: insPolicyNo, groupNumber: insGroupNo, category: insCategory, authRequired: insAuthRequired } : null,
        insuranceSecondary: ins2Name ? { name: ins2Name, policyNumber: ins2PolicyNo, groupNumber: ins2GroupNo, category: ins2Category, authRequired: false } : null,
        physicianName: physicianName.trim() || null,
        physicianPhone: physicianPhone.trim() || null,
        physicianNpi: physicianNpi.trim() || null,
        emergencyContact: ecName ? { name: ecName, relationship: ecRelationship, phone: ecPhone } : null,
        intakeData: { referralDate, referralSource, locationOfCare, supplyVendor, pharmacyName, pharmacyPhone, servicesRn, servicesPt },
      };
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to save"); return; }
      router.push(`/patients/${patientId}`);
    } catch {
      setError("Failed to save patient");
    } finally {
      setSubmitting(false);
    }
  }

  const sel = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs";

  if (status === "loading" || loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e5f8a]" />
    </div>
  );

  // Resolved physician for display
  const resolvedPhysician = physicianList.find(p => String(p.id) === selectedPhysicianId);

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/patients/${patientId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Patient</h1>
          <p className="text-sm text-gray-500">MRN: {patientMRN}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-0">
        {error && <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2 mb-4">{error}</div>}

        <SectionCard title="Patient Information">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1"><Label>First Name *</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} required /></div>
            <div className="space-y-1"><Label>Last Name *</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} required /></div>
            <div className="space-y-1"><Label>Date of Birth *</Label><Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 mt-4">
            <div className="space-y-1"><Label>Gender *</Label>
              <select className={sel} value={gender} onChange={e => setGender(e.target.value as "male" | "female" | "other")} required>
                <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1"><Label>Primary Phone</Label><Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          </div>
          <div className="mt-4 space-y-1"><Label>Address</Label><Input value={address} onChange={e => setAddress(e.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <div className="space-y-1"><Label>Allergies</Label><Input value={allergies} onChange={e => setAllergies(e.target.value)} /></div>
            <div className="space-y-1"><Label>Medications</Label><Input value={medications} onChange={e => setMedications(e.target.value)} /></div>
          </div>
        </SectionCard>

        <SectionCard title="Admission">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1"><Label>SOC Date</Label><Input type="date" value={socDate} onChange={e => setSocDate(e.target.value)} /></div>
            <div className="space-y-1"><Label>Status</Label><RG value={admissionStatus} onChange={setAdmissionStatus} options={[{ label: "Admitted", value: "admitted" }, { label: "Pending", value: "pending" }, { label: "Discharged", value: "discharged" }]} /></div>
            <div className="space-y-1"><Label>Code Status</Label><RG value={codeStatus} onChange={setCodeStatus} options={[{ label: "Full Code", value: "full_code" }, { label: "DNR", value: "dnr" }]} /></div>
          </div>
        </SectionCard>

        <SectionCard title="Diagnoses">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Primary Diagnosis</p>
          <DiagnosisRow dx={primaryDx} onChange={setPrimaryDx} icdCodes={icdCodeList} />
          <div className="flex items-center justify-between mt-4 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Other Diagnoses</p>
            <Button type="button" size="sm" variant="outline" onClick={() => setOtherDx(d => [...d, { ...EMPTY_DX }])}>
              <PlusCircle className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </div>
          {otherDx.length === 0 && <p className="text-sm text-gray-400">None</p>}
          {otherDx.map((dx, i) => (
            <DiagnosisRow key={i} dx={dx} icdCodes={icdCodeList} onChange={d => setOtherDx(prev => prev.map((x, j) => j === i ? d : x))} onRemove={() => setOtherDx(prev => prev.filter((_, j) => j !== i))} />
          ))}
        </SectionCard>

        {/* ── Primary Physician ── */}
        <SectionCard title="Primary Physician">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Physician</Label>
              <select
                className={sel}
                value={selectedPhysicianId}
                onChange={e => handlePhysicianSelect(e.target.value)}
              >
                <option value="">— Select physician —</option>
                {physicianList.map(ph => (
                  <option key={ph.id} value={String(ph.id)}>
                    {ph.lastName}, {ph.firstName}{ph.title ? ` (${ph.title})` : ""}
                  </option>
                ))}
                <option value="custom">Custom / not in list</option>
              </select>
            </div>

            {/* Library match — show resolved details read-only */}
            {resolvedPhysician && (
              <div className="grid grid-cols-3 gap-4 rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Name</p>
                  <p className="font-medium">{resolvedPhysician.lastName}, {resolvedPhysician.firstName}{resolvedPhysician.title ? ` (${resolvedPhysician.title})` : ""}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                  <p>{resolvedPhysician.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">NPI</p>
                  <p className="font-mono text-xs">{resolvedPhysician.npi || "—"}</p>
                </div>
              </div>
            )}

            {/* Custom fallback — free-text inputs */}
            {selectedPhysicianId === "custom" && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1"><Label>Name</Label><Input value={physicianName} onChange={e => setPhysicianName(e.target.value)} /></div>
                <div className="space-y-1"><Label>Phone</Label><Input type="tel" value={physicianPhone} onChange={e => setPhysicianPhone(e.target.value)} /></div>
                <div className="space-y-1"><Label>NPI #</Label><Input value={physicianNpi} onChange={e => setPhysicianNpi(e.target.value)} /></div>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── Primary Insurance ── */}
        <SectionCard title="Primary Insurance">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Insurance</Label>
              <select
                className={sel}
                value={selectedPrimaryInsId}
                onChange={e => handlePrimaryInsSelect(e.target.value)}
              >
                <option value="">— Select insurance —</option>
                {insuranceList.map(i => (
                  <option key={i.id} value={String(i.id)}>{i.name}</option>
                ))}
                <option value="custom">Custom / not in list</option>
              </select>
            </div>

            {/* Show resolved insurance name as a read-only badge when from library */}
            {selectedPrimaryInsId && selectedPrimaryInsId !== "custom" && insuranceList.find(i => String(i.id) === selectedPrimaryInsId) && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-xs text-gray-400">Category:</span>
                <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 font-medium">{insCategory}</span>
                {insAuthRequired && <span className="text-xs px-2 py-0.5 rounded-full border bg-yellow-50 text-yellow-700 border-yellow-200 font-medium">Auth Required</span>}
              </div>
            )}

            {/* Custom insurance name input */}
            {selectedPrimaryInsId === "custom" && (
              <div className="space-y-1">
                <Label>Insurance Name</Label>
                <Input value={insName} onChange={e => setInsName(e.target.value)} placeholder="Enter insurance name" />
              </div>
            )}

            {/* Policy / Group always shown */}
            {(selectedPrimaryInsId !== "") && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1"><Label>Policy / HIC #</Label><Input value={insPolicyNo} onChange={e => setInsPolicyNo(e.target.value)} /></div>
                <div className="space-y-1"><Label>Group #</Label><Input value={insGroupNo} onChange={e => setInsGroupNo(e.target.value)} /></div>
              </div>
            )}

            {selectedPrimaryInsId === "custom" && (
              <>
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Input value={insCategory} onChange={e => setInsCategory(e.target.value)} />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={insAuthRequired} onChange={e => setInsAuthRequired(e.target.checked)} className="rounded h-3.5 w-3.5" />
                  Authorization required
                </label>
              </>
            )}
          </div>
        </SectionCard>

        {/* ── Secondary Insurance ── */}
        <SectionCard title="Secondary Insurance">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Insurance</Label>
              <select
                className={sel}
                value={selectedSecondaryInsId}
                onChange={e => handleSecondaryInsSelect(e.target.value)}
              >
                <option value="">— Select insurance —</option>
                {insuranceList.map(i => (
                  <option key={i.id} value={String(i.id)}>{i.name}</option>
                ))}
                <option value="custom">Custom / not in list</option>
              </select>
            </div>

            {selectedSecondaryInsId === "custom" && (
              <div className="space-y-1">
                <Label>Insurance Name</Label>
                <Input value={ins2Name} onChange={e => setIns2Name(e.target.value)} />
              </div>
            )}

            {(selectedSecondaryInsId !== "") && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1"><Label>Policy / HIC #</Label><Input value={ins2PolicyNo} onChange={e => setIns2PolicyNo(e.target.value)} /></div>
                <div className="space-y-1"><Label>Group #</Label><Input value={ins2GroupNo} onChange={e => setIns2GroupNo(e.target.value)} /></div>
              </div>
            )}

            {selectedSecondaryInsId === "custom" && (
              <div className="space-y-1">
                <Label>Category</Label>
                <Input value={ins2Category} onChange={e => setIns2Category(e.target.value)} />
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Emergency Contact">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1"><Label>Name</Label><Input value={ecName} onChange={e => setEcName(e.target.value)} /></div>
            <div className="space-y-1"><Label>Relationship</Label><Input value={ecRelationship} onChange={e => setEcRelationship(e.target.value)} /></div>
            <div className="space-y-1"><Label>Phone</Label><Input type="tel" value={ecPhone} onChange={e => setEcPhone(e.target.value)} /></div>
          </div>
        </SectionCard>

        <SectionCard title="Referral & Care Location">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><Label>Referral Date</Label><Input type="date" value={referralDate} onChange={e => setReferralDate(e.target.value)} /></div>
            <div className="space-y-1"><Label>Referral Source</Label><Input value={referralSource} onChange={e => setReferralSource(e.target.value)} /></div>
            <div className="space-y-1"><Label>Location of Care</Label><Input value={locationOfCare} onChange={e => setLocationOfCare(e.target.value)} /></div>
          </div>
        </SectionCard>

        <SectionCard title="Supplies & Pharmacy">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1"><Label>Supply / DME Vendor</Label><Input value={supplyVendor} onChange={e => setSupplyVendor(e.target.value)} /></div>
            <div className="space-y-1"><Label>Pharmacy</Label><Input value={pharmacyName} onChange={e => setPharmacyName(e.target.value)} /></div>
            <div className="space-y-1"><Label>Pharmacy Phone</Label><Input type="tel" value={pharmacyPhone} onChange={e => setPharmacyPhone(e.target.value)} /></div>
          </div>
        </SectionCard>

        <SectionCard title="Services Needed">
          <div className="flex flex-wrap gap-6">
            {(["RN", "PT", "OT", "ST", "HHA", "MSW", "LPN/LVN"] as const).map(svc => {
              const checked = svc === "RN" ? servicesRn : svc === "PT" ? servicesPt : false;
              return (
                <label key={svc} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={checked} onChange={e => { if (svc === "RN") setServicesRn(e.target.checked); else if (svc === "PT") setServicesPt(e.target.checked); }} className="rounded h-3.5 w-3.5" />
                  {svc}
                </label>
              );
            })}
          </div>
        </SectionCard>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={submitting} className="bg-[#1e5f8a] hover:bg-[#174f75] text-white">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/patients/${patientId}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
