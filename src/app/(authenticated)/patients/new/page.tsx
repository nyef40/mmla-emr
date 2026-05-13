"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/ui/SectionCard";
import { ArrowLeft, Loader2, PlusCircle, Trash2 } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type Diagnosis = { description: string; icdCode: string; date: string };
const EMPTY_DX: Diagnosis = { description: "", icdCode: "", date: "" };

type IcdCode = { id: number; code: string; description: string; category: string };
type PhysicianEntry = { id: number; firstName: string; lastName: string; title: string | null; phone: string | null; npi: string | null };
type InsuranceEntry = { id: number; name: string; category: string; authRequired: boolean };

// ── Shared sub-components ────────────────────────────────────────────────────

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

      <div className="space-y-1">
        <Label className="text-xs">Description</Label>
        <Input
          value={dx.description}
          onChange={e => onChange({ ...dx, description: e.target.value })}
          placeholder="Auto-fills on code select"
        />
      </div>

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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function NewPatientPage() {
  const router = useRouter();
  const { status } = useSession();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [librariesLoading, setLibrariesLoading] = useState(true);

  // Library data
  const [physicianList, setPhysicianList] = useState<PhysicianEntry[]>([]);
  const [insuranceList, setInsuranceList] = useState<InsuranceEntry[]>([]);
  const [icdCodeList, setIcdCodeList] = useState<IcdCode[]>([]);

  // Demographics
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [allergies, setAllergies] = useState("NKDA");
  const [medications, setMedications] = useState("");

  // Admission
  const [socDate, setSocDate] = useState("");
  const [admissionStatus, setAdmissionStatus] = useState("admitted");
  const [codeStatus, setCodeStatus] = useState("full_code");

  // Diagnoses
  const [primaryDx, setPrimaryDx] = useState<Diagnosis>({ ...EMPTY_DX });
  const [otherDx, setOtherDx] = useState<Diagnosis[]>([]);

  // Physician
  const [selectedPhysicianId, setSelectedPhysicianId] = useState("");
  const [physicianName, setPhysicianName] = useState("");
  const [physicianPhone, setPhysicianPhone] = useState("");
  const [physicianNpi, setPhysicianNpi] = useState("");

  // Primary insurance
  const [selectedPrimaryInsId, setSelectedPrimaryInsId] = useState("");
  const [insName, setInsName] = useState("");
  const [insPolicyNo, setInsPolicyNo] = useState("");
  const [insGroupNo, setInsGroupNo] = useState("");
  const [insCategory, setInsCategory] = useState("");
  const [insAuthRequired, setInsAuthRequired] = useState(false);

  // Secondary insurance
  const [selectedSecondaryInsId, setSelectedSecondaryInsId] = useState("");
  const [ins2Name, setIns2Name] = useState("");
  const [ins2PolicyNo, setIns2PolicyNo] = useState("");
  const [ins2GroupNo, setIns2GroupNo] = useState("");
  const [ins2Category, setIns2Category] = useState("");

  // Emergency contact
  const [ecName, setEcName] = useState("");
  const [ecRelationship, setEcRelationship] = useState("");
  const [ecPhone, setEcPhone] = useState("");

  // Intake
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

  // Load all libraries in parallel
  useEffect(() => {
    Promise.all([
      fetch("/api/libraries/physicians").then(r => r.json()),
      fetch("/api/libraries/insurances").then(r => r.json()),
      fetch("/api/libraries/icd-codes").then(r => r.json()),
    ])
      .then(([physicians, insurances, icdCodes]) => {
        setPhysicianList((physicians ?? []).filter((p: PhysicianEntry & { isActive?: boolean }) => p.isActive !== false));
        setInsuranceList((insurances ?? []).filter((i: InsuranceEntry & { isActive?: boolean }) => i.isActive !== false));
        setIcdCodeList((icdCodes ?? []).filter((c: IcdCode & { isActive?: boolean }) => c.isActive !== false));
      })
      .catch(() => {})
      .finally(() => setLibrariesLoading(false));
  }, []);

  function handlePhysicianSelect(val: string) {
    setSelectedPhysicianId(val);
    if (val === "") { setPhysicianName(""); setPhysicianPhone(""); setPhysicianNpi(""); return; }
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
    await new Promise(r => setTimeout(r, 0));
    try {
      const body = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: new Date(dateOfBirth).toISOString(),
        gender,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        allergies: allergies.trim() || undefined,
        medications: medications.trim() || undefined,
        socDate: socDate || undefined,
        admissionStatus,
        codeStatus,
        primaryDiagnosis: primaryDx.icdCode ? primaryDx : undefined,
        otherDiagnoses: otherDx.filter(d => d.icdCode).length ? otherDx.filter(d => d.icdCode) : undefined,
        insurancePrimary: insName ? { name: insName, policyNumber: insPolicyNo, groupNumber: insGroupNo, category: insCategory, authRequired: insAuthRequired } : undefined,
        insuranceSecondary: ins2Name ? { name: ins2Name, policyNumber: ins2PolicyNo, groupNumber: ins2GroupNo, category: ins2Category, authRequired: false } : undefined,
        physicianName: physicianName.trim() || undefined,
        physicianPhone: physicianPhone.trim() || undefined,
        physicianNpi: physicianNpi.trim() || undefined,
        emergencyContact: ecName ? { name: ecName, relationship: ecRelationship, phone: ecPhone } : undefined,
        intakeData: { referralDate, referralSource, locationOfCare, supplyVendor, pharmacyName, pharmacyPhone, servicesRn, servicesPt },
      };

      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create patient"); return; }
      router.push(`/patients/${data.id}`);
    } catch {
      setError("Failed to create patient");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading" || librariesLoading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e5f8a]" />
    </div>
  );

  const sel = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs";
  const resolvedPhysician = physicianList.find(p => String(p.id) === selectedPhysicianId);

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/patients"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">New Patient</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-0">
        {error && <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2 mb-4">{error}</div>}

        {/* ── Patient Information ── */}
        <SectionCard title="Patient Information">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1"><Label>First Name *</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="Lawrence" /></div>
            <div className="space-y-1"><Label>Last Name *</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Abbott" /></div>
            <div className="space-y-1"><Label>Date of Birth *</Label><Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} required /></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 mt-4">
            <div className="space-y-1">
              <Label>Gender *</Label>
              <select className={sel} value={gender} onChange={e => setGender(e.target.value as "male" | "female" | "other")} required>
                <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1"><Label>Primary Phone</Label><Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="310-476-1057" /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          </div>
          <div className="mt-4 space-y-1"><Label>Address</Label><Input value={address} onChange={e => setAddress(e.target.value)} /></div>
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <div className="space-y-1"><Label>Allergies</Label><Input value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="NKDA" /></div>
            <div className="space-y-1"><Label>Medications</Label><Input value={medications} onChange={e => setMedications(e.target.value)} /></div>
          </div>
        </SectionCard>

        {/* ── Admission ── */}
        <SectionCard title="Admission">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1"><Label>SOC Date</Label><Input type="date" value={socDate} onChange={e => setSocDate(e.target.value)} /></div>
            <div className="space-y-1"><Label>Status</Label>
              <RG value={admissionStatus} onChange={setAdmissionStatus} options={[{ label: "Admitted", value: "admitted" }, { label: "Pending", value: "pending" }, { label: "Discharged", value: "discharged" }]} />
            </div>
            <div className="space-y-1"><Label>Code Status</Label>
              <RG value={codeStatus} onChange={setCodeStatus} options={[{ label: "Full Code", value: "full_code" }, { label: "DNR", value: "dnr" }]} />
            </div>
          </div>
        </SectionCard>

        {/* ── Diagnoses ── */}
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
            <DiagnosisRow key={i} dx={dx} icdCodes={icdCodeList}
              onChange={d => setOtherDx(prev => prev.map((x, j) => j === i ? d : x))}
              onRemove={() => setOtherDx(prev => prev.filter((_, j) => j !== i))}
            />
          ))}
        </SectionCard>

        {/* ── Primary Physician ── */}
        <SectionCard title="Primary Physician">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Physician</Label>
              <select className={sel} value={selectedPhysicianId} onChange={e => handlePhysicianSelect(e.target.value)}>
                <option value="">— Select physician —</option>
                {physicianList.map(ph => (
                  <option key={ph.id} value={String(ph.id)}>
                    {ph.lastName}, {ph.firstName}{ph.title ? ` (${ph.title})` : ""}
                  </option>
                ))}
                <option value="custom">Custom / not in list</option>
              </select>
            </div>

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
              <select className={sel} value={selectedPrimaryInsId} onChange={e => handlePrimaryInsSelect(e.target.value)}>
                <option value="">— Select insurance —</option>
                {insuranceList.map(i => <option key={i.id} value={String(i.id)}>{i.name}</option>)}
                <option value="custom">Custom / not in list</option>
              </select>
            </div>

            {selectedPrimaryInsId && selectedPrimaryInsId !== "custom" && insuranceList.find(i => String(i.id) === selectedPrimaryInsId) && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-xs text-gray-400">Category:</span>
                <span className="text-xs px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 font-medium">{insCategory}</span>
                {insAuthRequired && <span className="text-xs px-2 py-0.5 rounded-full border bg-yellow-50 text-yellow-700 border-yellow-200 font-medium">Auth Required</span>}
              </div>
            )}

            {selectedPrimaryInsId === "custom" && (
              <div className="space-y-1">
                <Label>Insurance Name</Label>
                <Input value={insName} onChange={e => setInsName(e.target.value)} placeholder="Enter insurance name" />
              </div>
            )}

            {selectedPrimaryInsId !== "" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1"><Label>Policy / HIC #</Label><Input value={insPolicyNo} onChange={e => setInsPolicyNo(e.target.value)} /></div>
                <div className="space-y-1"><Label>Group #</Label><Input value={insGroupNo} onChange={e => setInsGroupNo(e.target.value)} /></div>
              </div>
            )}

            {selectedPrimaryInsId === "custom" && (
              <>
                <div className="space-y-1"><Label>Category</Label><Input value={insCategory} onChange={e => setInsCategory(e.target.value)} /></div>
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
              <select className={sel} value={selectedSecondaryInsId} onChange={e => handleSecondaryInsSelect(e.target.value)}>
                <option value="">— Select insurance —</option>
                {insuranceList.map(i => <option key={i.id} value={String(i.id)}>{i.name}</option>)}
                <option value="custom">Custom / not in list</option>
              </select>
            </div>

            {selectedSecondaryInsId === "custom" && (
              <div className="space-y-1"><Label>Insurance Name</Label><Input value={ins2Name} onChange={e => setIns2Name(e.target.value)} /></div>
            )}

            {selectedSecondaryInsId !== "" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1"><Label>Policy / HIC #</Label><Input value={ins2PolicyNo} onChange={e => setIns2PolicyNo(e.target.value)} /></div>
                <div className="space-y-1"><Label>Group #</Label><Input value={ins2GroupNo} onChange={e => setIns2GroupNo(e.target.value)} /></div>
              </div>
            )}

            {selectedSecondaryInsId === "custom" && (
              <div className="space-y-1"><Label>Category</Label><Input value={ins2Category} onChange={e => setIns2Category(e.target.value)} /></div>
            )}
          </div>
        </SectionCard>

        {/* ── Emergency Contact ── */}
        <SectionCard title="Emergency Contact">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1"><Label>Name</Label><Input value={ecName} onChange={e => setEcName(e.target.value)} placeholder="Yona Lapan" /></div>
            <div className="space-y-1"><Label>Relationship</Label><Input value={ecRelationship} onChange={e => setEcRelationship(e.target.value)} placeholder="Friend" /></div>
            <div className="space-y-1"><Label>Phone</Label><Input type="tel" value={ecPhone} onChange={e => setEcPhone(e.target.value)} /></div>
          </div>
        </SectionCard>

        {/* ── Referral & Care Location ── */}
        <SectionCard title="Referral & Care Location">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><Label>Referral Date</Label><Input type="date" value={referralDate} onChange={e => setReferralDate(e.target.value)} /></div>
            <div className="space-y-1"><Label>Referral Source</Label><Input value={referralSource} onChange={e => setReferralSource(e.target.value)} /></div>
            <div className="space-y-1"><Label>Location of Care</Label><Input value={locationOfCare} onChange={e => setLocationOfCare(e.target.value)} placeholder="Home" /></div>
          </div>
        </SectionCard>

        {/* ── Supplies & Pharmacy ── */}
        <SectionCard title="Supplies & Pharmacy">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1"><Label>Supply / DME Vendor</Label><Input value={supplyVendor} onChange={e => setSupplyVendor(e.target.value)} /></div>
            <div className="space-y-1"><Label>Pharmacy</Label><Input value={pharmacyName} onChange={e => setPharmacyName(e.target.value)} /></div>
            <div className="space-y-1"><Label>Pharmacy Phone</Label><Input type="tel" value={pharmacyPhone} onChange={e => setPharmacyPhone(e.target.value)} /></div>
          </div>
        </SectionCard>

        {/* ── Services Needed ── */}
        <SectionCard title="Services Needed">
          <div className="flex flex-wrap gap-6">
            {(["RN", "PT", "OT", "ST", "HHA", "MSW", "LPN/LVN"] as const).map(svc => {
              const checked = svc === "RN" ? servicesRn : svc === "PT" ? servicesPt : false;
              return (
                <label key={svc} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={checked}
                    onChange={e => { if (svc === "RN") setServicesRn(e.target.checked); else if (svc === "PT") setServicesPt(e.target.checked); }}
                    className="rounded h-3.5 w-3.5" />
                  {svc}
                </label>
              );
            })}
          </div>
        </SectionCard>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={submitting} className="bg-[#1e5f8a] hover:bg-[#174f75] text-white">
            {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : "Create Patient"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/patients">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
