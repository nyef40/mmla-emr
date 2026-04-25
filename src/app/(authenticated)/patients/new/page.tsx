"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionCard } from "@/components/ui/SectionCard";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewPatientPage() {
  const router = useRouter();
  const { status } = useSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "male" as "male" | "female" | "other",
    phone: "",
    email: "",
    address: "",
    bloodType: "",
    allergies: "",
    medicalConditions: "",
    medications: "",
    notes: "",
    agencyName: "",
    referringDiagnoses: "",
    referralInfo: "",
    suppliesPharmacy: "",
    locationOfCare: "",
    physicianId: "",
    faceToFaceInfo: "",
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    relatedParties: "",
    primaryInsurance: "",
    secondaryInsurance: "",
    servicesPt: false,
    servicesRn: false,
    initialStaffPt: "",
    initialStaffRn: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const emergencyContact =
        form.emergencyContactName || form.emergencyContactPhone
          ? {
              name: form.emergencyContactName,
              relationship: form.emergencyContactRelationship,
              phone: form.emergencyContactPhone,
            }
          : undefined;
      const intakeExtra = {
        agencyName: form.agencyName,
        referringDiagnoses: form.referringDiagnoses,
        referralInfo: form.referralInfo,
        suppliesPharmacy: form.suppliesPharmacy,
        locationOfCare: form.locationOfCare,
        physicianId: form.physicianId,
        faceToFaceInfo: form.faceToFaceInfo,
        relatedParties: form.relatedParties,
        primaryInsurance: form.primaryInsurance,
        secondaryInsurance: form.secondaryInsurance,
        servicesPt: form.servicesPt,
        servicesRn: form.servicesRn,
        initialStaffPt: form.initialStaffPt,
        initialStaffRn: form.initialStaffRn,
      };
      const body = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dateOfBirth: new Date(form.dateOfBirth).toISOString(),
        gender: form.gender,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        bloodType: form.bloodType.trim() || undefined,
        allergies: form.allergies.trim() || undefined,
        medicalConditions: form.medicalConditions.trim() || undefined,
        medications: form.medications.trim() || undefined,
        emergencyContact,
        notes: [
          form.notes.trim(),
          Object.keys(intakeExtra).some((k) => (intakeExtra as Record<string, unknown>)[k]) ? JSON.stringify(intakeExtra) : "",
        ]
          .filter(Boolean)
          .join("\n") || undefined,
      };
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create patient");
        return;
      }
      router.push(`/patients/${data.id}`);
    } catch (err) {
      console.error(err);
      setError("Failed to create patient");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const inputClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Title bar: Patients [ New Patient ] */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/patients" title="Back to patients">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Patients</h1>
        </div>
        <Button asChild>
          <Link href="/patients/new">New Patient</Link>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-0">
        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2 mb-6">
            {error}
          </div>
        )}

        <SectionCard title="Patient Information">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name *</Label>
              <Input id="firstName" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} required placeholder="Jane" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name *</Label>
              <Input id="lastName" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} required placeholder="Doe" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of birth *</Label>
              <Input id="dateOfBirth" type="date" value={form.dateOfBirth} onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <select id="gender" className={inputClass} value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as "male" | "female" | "other" }))} required>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+1 234 567 8900" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Street, City, State, ZIP" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 mt-4">
            <div className="space-y-2">
              <Label htmlFor="bloodType">Blood type</Label>
              <Input id="bloodType" value={form.bloodType} onChange={(e) => setForm((f) => ({ ...f, bloodType: e.target.value }))} placeholder="e.g. O+" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Input id="allergies" value={form.allergies} onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))} placeholder="Known allergies" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="medicalConditions">Medical conditions</Label>
            <Input id="medicalConditions" value={form.medicalConditions} onChange={(e) => setForm((f) => ({ ...f, medicalConditions: e.target.value }))} placeholder="Current conditions" />
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="medications">Medications</Label>
            <Input id="medications" value={form.medications} onChange={(e) => setForm((f) => ({ ...f, medications: e.target.value }))} placeholder="Current medications" />
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Additional notes" />
          </div>
        </SectionCard>

        <SectionCard title="Agency Info">
          <div className="space-y-2">
            <Label htmlFor="agencyName">Agency name</Label>
            <Input id="agencyName" value={form.agencyName} onChange={(e) => setForm((f) => ({ ...f, agencyName: e.target.value }))} placeholder="Agency" />
          </div>
        </SectionCard>

        <SectionCard title="Referring Diagnoses">
          <div className="space-y-2">
            <Label htmlFor="referringDiagnoses">Referring diagnoses</Label>
            <Input id="referringDiagnoses" value={form.referringDiagnoses} onChange={(e) => setForm((f) => ({ ...f, referringDiagnoses: e.target.value }))} placeholder="Diagnoses" />
          </div>
        </SectionCard>

        <SectionCard title="Referral Information">
          <div className="space-y-2">
            <Label htmlFor="referralInfo">Referral information</Label>
            <Input id="referralInfo" value={form.referralInfo} onChange={(e) => setForm((f) => ({ ...f, referralInfo: e.target.value }))} placeholder="Referral details" />
          </div>
        </SectionCard>

        <SectionCard title="Primary Supplies and Pharmacy Vendor">
          <div className="space-y-2">
            <Label htmlFor="suppliesPharmacy">Supplies & pharmacy</Label>
            <Input id="suppliesPharmacy" value={form.suppliesPharmacy} onChange={(e) => setForm((f) => ({ ...f, suppliesPharmacy: e.target.value }))} placeholder="Vendor / pharmacy" />
          </div>
        </SectionCard>

        <SectionCard title="Location of Care">
          <div className="space-y-2">
            <Label htmlFor="locationOfCare">Location of care</Label>
            <Input id="locationOfCare" value={form.locationOfCare} onChange={(e) => setForm((f) => ({ ...f, locationOfCare: e.target.value }))} placeholder="Address or facility" />
          </div>
        </SectionCard>

        <SectionCard title="Physician Information">
          <p className="text-muted-foreground text-sm mb-2">Pick from library (Physician).</p>
          <div className="space-y-2">
            <Label htmlFor="physicianId">Physician</Label>
            <Input id="physicianId" value={form.physicianId} onChange={(e) => setForm((f) => ({ ...f, physicianId: e.target.value }))} placeholder="Physician ID or name" />
          </div>
        </SectionCard>

        <SectionCard title="Face to Face Information">
          <div className="space-y-2">
            <Label htmlFor="faceToFaceInfo">Face to face info</Label>
            <Input id="faceToFaceInfo" value={form.faceToFaceInfo} onChange={(e) => setForm((f) => ({ ...f, faceToFaceInfo: e.target.value }))} placeholder="Details" />
          </div>
        </SectionCard>

        <SectionCard title="Emergency Contact Information">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="emergencyContactName">Name</Label>
              <Input id="emergencyContactName" value={form.emergencyContactName} onChange={(e) => setForm((f) => ({ ...f, emergencyContactName: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyContactRelationship">Relationship</Label>
              <Input id="emergencyContactRelationship" value={form.emergencyContactRelationship} onChange={(e) => setForm((f) => ({ ...f, emergencyContactRelationship: e.target.value }))} />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="emergencyContactPhone">Phone</Label>
            <Input id="emergencyContactPhone" type="tel" value={form.emergencyContactPhone} onChange={(e) => setForm((f) => ({ ...f, emergencyContactPhone: e.target.value }))} />
          </div>
        </SectionCard>

        <SectionCard title="Related Parties">
          <div className="space-y-2">
            <Label htmlFor="relatedParties">Related parties</Label>
            <Input id="relatedParties" value={form.relatedParties} onChange={(e) => setForm((f) => ({ ...f, relatedParties: e.target.value }))} placeholder="Names, roles" />
          </div>
        </SectionCard>

        <SectionCard title="Insurance Information">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primaryInsurance">Primary insurance</Label>
              <Input id="primaryInsurance" value={form.primaryInsurance} onChange={(e) => setForm((f) => ({ ...f, primaryInsurance: e.target.value }))} placeholder="Primary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondaryInsurance">Secondary insurance</Label>
              <Input id="secondaryInsurance" value={form.secondaryInsurance} onChange={(e) => setForm((f) => ({ ...f, secondaryInsurance: e.target.value }))} placeholder="Secondary" />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Services Needed">
          <p className="text-muted-foreground text-sm mb-3">Select services (2 checkboxes in our simple case).</p>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.servicesPt} onChange={(e) => setForm((f) => ({ ...f, servicesPt: e.target.checked }))} className="rounded border-input" />
              <span>PT</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.servicesRn} onChange={(e) => setForm((f) => ({ ...f, servicesRn: e.target.checked }))} className="rounded border-input" />
              <span>RN</span>
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Initial Staff Assignment">
          <p className="text-muted-foreground text-sm mb-3">Pick from Libraries (e.g. Physician, users/RN).</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="initialStaffPt">PT</Label>
              <select id="initialStaffPt" className={inputClass} value={form.initialStaffPt} onChange={(e) => setForm((f) => ({ ...f, initialStaffPt: e.target.value }))}>
                <option value="">— Select PT —</option>
                <option value="1">PT 1</option>
                <option value="2">PT 2</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="initialStaffRn">RN</Label>
              <select id="initialStaffRn" className={inputClass} value={form.initialStaffRn} onChange={(e) => setForm((f) => ({ ...f, initialStaffRn: e.target.value }))}>
                <option value="">— Select RN —</option>
                <option value="1">RN 1</option>
                <option value="2">RN 2</option>
              </select>
            </div>
          </div>
        </SectionCard>

        <div className="flex gap-2 pt-4 pb-6">
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Patient"
            )}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/patients">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
