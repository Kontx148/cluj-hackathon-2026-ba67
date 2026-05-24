import { useState } from "react";
import {
  CheckCircle2,
  Newspaper,
  Shield,
  Lock,
  ChevronLeft,
  X,
  Check,
  WifiOff,
  RefreshCw,
  ExternalLink,
  Moon,
  Sun,
  Globe,
  MapPin,
  Smartphone,
  AlertTriangle,
  Hash,
  Wifi,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────

type ElectionStatus = "OPEN" | "PROPOSED" | "APPROVED" | "FROZEN" | "FINISHED";
type Tab = "vote" | "civic";
type IdentityMode = "cei" | "demo";
type CivicLevel = "EU" | "Romania" | "Local";
type CivicSection = "Upcoming votes" | "Civic news";

interface Election {
  id: string;
  name: string;
  type: string;
  dateRange: string;
  status: ElectionStatus;
}

interface Candidate {
  id: string;
  name: string;
  party: string;
  initials: string;
  color: string;
}

interface DemoIdentity {
  id: string;
  name: string;
  cnpMasked: string;
  age: number;
  county: string;
}

interface CivicItem {
  id: string;
  source: string;
  title: string;
  summary: string;
  importance: number;
  topics: string[];
  level: CivicLevel;
  section: CivicSection;
  openForInput: boolean;
}

// ─── Static Data ─────────────────────────────────────────────────────────

const ELECTIONS: Election[] = [
  {
    id: "e1",
    name: "Alegeri locale Cluj-Napoca 2026",
    type: "Alegeri locale",
    dateRange: "15 mai – 2 iun 2026",
    status: "OPEN",
  },
  {
    id: "e2",
    name: "Referendum privind independența energetică",
    type: "Referendum național",
    dateRange: "25 mai – 25 iun 2026",
    status: "APPROVED",
  },
  {
    id: "e3",
    name: "Alegeri europarlamentare 2026",
    type: "Alegeri europene",
    dateRange: "1 iun – 15 iun 2026",
    status: "PROPOSED",
  },
  {
    id: "e4",
    name: "Vot primar sector 3 București",
    type: "Alegeri locale",
    dateRange: "10 mai – 24 mai 2026",
    status: "FROZEN",
  },
  {
    id: "e5",
    name: "Consiliul Județean Bihor 2026",
    type: "Alegeri județene",
    dateRange: "1 apr – 30 apr 2026",
    status: "FINISHED",
  },
];

const CANDIDATES: Candidate[] = [
  { id: "c1", name: "Elena Ionescu", party: "Partidul Național Democrat", initials: "EI", color: "#4A7FC1" },
  { id: "c2", name: "Mihai Popescu", party: "Uniunea Civică Română", initials: "MP", color: "#27AE60" },
  { id: "c3", name: "Andrei Mureșan", party: "Alianța Verde", initials: "AM", color: "#16A085" },
  { id: "c4", name: "Cristina Dănilă", party: "Independent", initials: "CD", color: "#8E44AD" },
];

const IDENTITIES: DemoIdentity[] = [
  { id: "i1", name: "Ana Maria Ionescu", cnpMasked: "2900315****03", age: 34, county: "Cluj" },
  { id: "i2", name: "Mihai Popescu", cnpMasked: "1720418****87", age: 52, county: "Bihor" },
  { id: "i3", name: "Elena Constantin", cnpMasked: "2980203****21", age: 28, county: "Ilfov" },
  { id: "i4", name: "Gheorghe Dumitrescu", cnpMasked: "1630914****65", age: 61, county: "Dolj" },
];

const CIVIC_FEED: CivicItem[] = [
  {
    id: "n1",
    source: "Primăria Cluj-Napoca",
    title: "Buget participativ 2026 — etapa de vot a început",
    summary: "Cetățenii din Cluj pot vota online proiectele de infrastructură propuse de comunitate. Sunt disponibile 47 de proiecte cu un buget total de 12 milioane lei. Votul se încheie pe 10 iunie 2026.",
    importance: 4,
    topics: ["Buget", "Cluj", "Participare"],
    level: "Local",
    section: "Upcoming votes",
    openForInput: true,
  },
  {
    id: "n2",
    source: "Comisia Europeană",
    title: "CE propune standarde comune pentru votul electronic în UE",
    summary: "Bruxelles pregătește un cadru legislativ comun pentru e-voting în alegerile europene. Propunerea vizează standarde de securitate uniforme și interoperabilitate între sistemele naționale ale statelor membre.",
    importance: 5,
    topics: ["Legislație", "Digital", "eVoting"],
    level: "EU",
    section: "Civic news",
    openForInput: false,
  },
  {
    id: "n3",
    source: "Primăria Florești",
    title: "Dezbatere publică: Planul Urbanistic General Florești 2026–2036",
    summary: "Primăria Florești a lansat spre consultare publică noul Plan Urbanistic General. Documentul propune extinderea zonelor rezidențiale și crearea a 3 noi parcuri. Cetățenii pot trimite observații până pe 30 mai.",
    importance: 3,
    topics: ["Urbanism", "Local"],
    level: "Local",
    section: "Upcoming votes",
    openForInput: true,
  },
  {
    id: "n4",
    source: "parlament.ro",
    title: "Raport transparență: activitatea parlamentară T1 2026",
    summary: "Raportul de transparență pentru primul trimestru arată că au fost depuse 318 proiecte de lege, din care 47 au trecut de ambele camere. Rata de prezență medie a parlamentarilor a fost de 71%.",
    importance: 4,
    topics: ["Parlament", "Transparență"],
    level: "Romania",
    section: "Civic news",
    openForInput: false,
  },
  {
    id: "n5",
    source: "Digi24",
    title: "Propunere legislativă: reducerea numărului de consilieri locali",
    summary: "Un grup de inițiativă cetățenească propune modificarea Legii administrației publice locale. Inițiativa are nevoie de 100.000 de semnături pentru a ajunge în dezbatere parlamentară.",
    importance: 3,
    topics: ["Legislație", "Administrație"],
    level: "Romania",
    section: "Civic news",
    openForInput: false,
  },
  {
    id: "n6",
    source: "Europa Liberă",
    title: "Fond european de 2 miliarde € pentru digitalizarea administrației",
    summary: "UE alocă finanțare pentru modernizarea serviciilor publice în statele membre. România are eligibilitate pentru aprox. 340 milioane €, cu accent pe interoperabilitate și identitate digitală.",
    importance: 4,
    topics: ["Fonduri EU", "Digitalizare"],
    level: "EU",
    section: "Civic news",
    openForInput: false,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ElectionStatus, { label: string; bg: string; text: string }> = {
  OPEN:     { label: "DESCHIS",    bg: "bg-[#D64545]",                         text: "text-white" },
  PROPOSED: { label: "PROPUS",     bg: "bg-amber-100 dark:bg-amber-900/40",    text: "text-amber-800 dark:text-amber-300" },
  APPROVED: { label: "APROBAT",    bg: "bg-emerald-100 dark:bg-emerald-900/40",text: "text-emerald-800 dark:text-emerald-300" },
  FROZEN:   { label: "SUSPENDAT",  bg: "bg-sky-100 dark:bg-sky-900/40",        text: "text-sky-800 dark:text-sky-300" },
  FINISHED: { label: "ÎNCHEIAT",   bg: "bg-gray-100 dark:bg-gray-800",         text: "text-gray-500 dark:text-gray-400" },
};

function StatusPill({ status }: { status: ElectionStatus }) {
  const { label, bg, text } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${bg} ${text}`}>
      {label}
    </span>
  );
}

function ImportanceDots({ value }: { value: number }) {
  return (
    <div className="flex gap-[3px] items-center">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`rounded-full transition-colors ${
            i <= value ? "bg-primary w-1.5 h-1.5" : "bg-border w-1.5 h-1.5"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Vote Tab ────────────────────────────────────────────────────────────

function ElectionCard({ election, onVote }: { election: Election; onVote: (e: Election) => void }) {
  const isOpen = election.status === "OPEN";
  return (
    <button
      className={`w-full text-left bg-card rounded-[20px] border border-border p-4 mb-3 transition-all ${
        isOpen
          ? "active:scale-[0.985] hover:border-primary/30 hover:shadow-sm cursor-pointer"
          : "opacity-60 cursor-default"
      }`}
      onClick={isOpen ? () => onVote(election) : undefined}
      disabled={!isOpen}
    >
      <div className="flex items-center justify-between mb-2.5">
        <StatusPill status={election.status} />
        {isOpen && (
          <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
            Votați acum →
          </span>
        )}
      </div>
      <h3 className="text-[15px] font-bold text-foreground leading-snug mb-2">{election.name}</h3>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="font-medium">{election.type}</span>
        <span className="w-1 h-1 rounded-full bg-border inline-block" />
        <span>{election.dateRange}</span>
      </div>
    </button>
  );
}

function VoteTab({ isOffline, onVote }: { isOffline: boolean; onVote: (e: Election) => void }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); setRefreshKey((k) => k + 1); }, 1400);
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      {isOffline && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800/60">
          <WifiOff size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-[12px] text-amber-700 dark:text-amber-300 font-medium flex-1">
            Fără conexiune — date din cache local
          </p>
        </div>
      )}

      <div className="px-4 pt-5 pb-1 flex items-start justify-between gap-3">
        <div className="flex-1">
          <h1 className="text-[23px] font-extrabold text-foreground leading-tight">Votați sigur</h1>
          <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
            Identitatea ta este criptată local și nu este niciodată transmisă în text clar.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="mt-1 w-8 h-8 flex items-center justify-center rounded-full bg-muted transition-colors hover:bg-secondary"
        >
          <RefreshCw
            size={14}
            className={`text-muted-foreground transition-transform ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      {/* Privacy strip */}
      <div className="mx-4 mt-4 mb-1 flex items-center gap-2 px-3 py-2 bg-secondary rounded-xl">
        <Lock size={13} className="text-primary shrink-0" />
        <p className="text-[11px] text-primary font-semibold">
          Criptare RSA-4096 · Token anonim · Blockchain imuabil
        </p>
      </div>

      <div className="px-4 pt-3 pb-4">
        {ELECTIONS.map((election) => (
          <ElectionCard key={`${election.id}-${refreshKey}`} election={election} onVote={onVote} />
        ))}
      </div>
    </div>
  );
}

// ─── Vote Wizard ─────────────────────────────────────────────────────────

const WIZARD_LABELS = ["Identitate", "Candidat", "Confirmare", "Chitanță"];

function WizardStepper({ step }: { step: number }) {
  return (
    <div className="flex items-center px-5 pt-2 pb-3">
      {WIZARD_LABELS.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                i < step
                  ? "bg-primary text-white"
                  : i === step
                  ? "bg-primary text-white ring-[3px] ring-secondary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check size={13} strokeWidth={3} /> : i + 1}
            </div>
            <span className={`text-[9px] font-semibold whitespace-nowrap ${i === step ? "text-primary" : "text-muted-foreground"}`}>
              {label}
            </span>
          </div>
          {i < WIZARD_LABELS.length - 1 && (
            <div className={`h-px flex-1 mx-1 mb-4 transition-colors ${i < step ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// Step 1: Identity
function IdentityStep({
  mode, setMode, selectedId, setSelectedId, onNext,
}: {
  mode: IdentityMode;
  setMode: (m: IdentityMode) => void;
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  onNext: () => void;
}) {
  const canProceed = mode === "cei" || !!selectedId;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 flex flex-col gap-4">
      {/* Privacy callout */}
      <div className="flex gap-3 bg-secondary rounded-[16px] p-4">
        <Shield size={19} className="text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-[13px] font-bold text-foreground mb-0.5">Confidențialitate garantată</p>
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            Datele sunt procesate exclusiv pe dispozitivul tău. Niciun identificator nu este transmis în formă necriptată.
          </p>
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2">
        {(["cei", "demo"] as IdentityMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 rounded-full text-[12px] font-bold transition-colors ${
              mode === m ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-secondary"
            }`}
          >
            {m === "cei" ? "Card CEI (NFC)" : "Mod demo"}
          </button>
        ))}
      </div>

      {mode === "cei" ? (
        <div className="bg-card rounded-[20px] border border-border p-6 text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
            <Smartphone size={28} className="text-primary" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-foreground mb-1">Apropiați cardul CEI</p>
            <p className="text-[12px] text-muted-foreground">Activați NFC și țineți cardul în spatele telefonului</p>
          </div>
          <button
            onClick={() => setMode("demo")}
            className="w-full py-3 rounded-full bg-primary text-white text-[14px] font-bold"
          >
            Citire NFC via EidKit
          </button>
          <p className="text-[10px] text-muted-foreground">NFC indisponibil? Folosiți modul demo →</p>
        </div>
      ) : (
        <div className="bg-card rounded-[20px] border border-border overflow-hidden">
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest px-4 pt-4 pb-2">
            Identitate demo
          </p>
          {IDENTITIES.map((identity, i) => {
            const initials = identity.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
            const selected = selectedId === identity.id;
            return (
              <button
                key={identity.id}
                onClick={() => setSelectedId(identity.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  i < IDENTITIES.length - 1 ? "border-b border-border" : ""
                } ${selected ? "bg-secondary" : "hover:bg-muted/50"}`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 transition-colors ${
                    selected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-foreground truncate">{identity.name}</p>
                  <p className="text-[11px] text-muted-foreground">{identity.age} ani · {identity.county} · {identity.cnpMasked}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selected ? "border-primary bg-primary" : "border-muted-foreground"
                  }`}
                >
                  {selected && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        disabled={!canProceed}
        onClick={onNext}
        className="w-full py-3.5 rounded-full bg-primary text-white text-[15px] font-bold disabled:opacity-40 transition-opacity mt-auto"
      >
        Continuați
      </button>
    </div>
  );
}

// Step 2: Candidate
function CandidateStep({
  selectedId, setSelectedId, onNext,
}: {
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 flex flex-col gap-4">
      <p className="text-[13px] text-muted-foreground">
        Selectați candidatul preferat. Alegerea va fi criptată înainte de transmitere.
      </p>

      <div className="bg-card rounded-[20px] border border-border overflow-hidden">
        {CANDIDATES.map((candidate, i) => {
          const selected = selectedId === candidate.id;
          return (
            <button
              key={candidate.id}
              onClick={() => setSelectedId(candidate.id)}
              className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-colors ${
                i < CANDIDATES.length - 1 ? "border-b border-border" : ""
              } ${selected ? "bg-secondary" : "hover:bg-muted/50"}`}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                style={{ backgroundColor: candidate.color }}
              >
                {candidate.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-foreground">{candidate.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{candidate.party}</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selected ? "border-primary bg-primary" : "border-muted-foreground"
                }`}
              >
                {selected && <Check size={10} className="text-white" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>

      <button
        disabled={!selectedId}
        onClick={onNext}
        className="w-full py-3.5 rounded-full bg-primary text-white text-[15px] font-bold disabled:opacity-40 transition-opacity mt-auto"
      >
        Continuați
      </button>
    </div>
  );
}

// Step 3: Confirm
function ConfirmStep({
  election, identity, candidate, identityMode, onCast,
}: {
  election: Election;
  identity: DemoIdentity | null;
  candidate: Candidate | null;
  identityMode: IdentityMode;
  onCast: () => void;
}) {
  const [casting, setCasting] = useState(false);

  const handleCast = () => {
    setCasting(true);
    setTimeout(() => { setCasting(false); onCast(); }, 1600);
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 flex flex-col gap-4">
      {/* Ballot preview */}
      <div className="bg-card rounded-[20px] border border-border p-4">
        <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest mb-3">
          Buletin de vot
        </p>
        <div className="space-y-3">
          <div>
            <p className="text-[11px] text-muted-foreground mb-0.5">Alegere</p>
            <p className="text-[14px] font-bold text-foreground leading-snug">{election.name}</p>
          </div>
          <div className="h-px bg-border" />
          <div>
            <p className="text-[11px] text-muted-foreground mb-0.5">Identitate</p>
            <p className="text-[14px] font-bold text-foreground">
              {identityMode === "cei" ? "Card electronic CEI (criptat on-device)" : identity?.name ?? "—"}
            </p>
            {identityMode === "demo" && identity && (
              <p className="text-[11px] text-muted-foreground">{identity.county} · {identity.cnpMasked}</p>
            )}
          </div>
          <div className="h-px bg-border" />
          <div>
            <p className="text-[11px] text-muted-foreground mb-0.5">Candidat ales</p>
            <p className="text-[14px] font-bold text-foreground">{candidate?.name}</p>
            <p className="text-[12px] text-muted-foreground">{candidate?.party}</p>
          </div>
        </div>
      </div>

      {/* Encryption info */}
      <div className="bg-secondary rounded-[16px] p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <Lock size={14} className="text-primary" />
          <p className="text-[12px] font-bold text-foreground">Cum este protejat votul tău</p>
        </div>
        <ul className="space-y-2">
          {[
            "Votul este criptat RSA-4096 înainte de orice transmitere",
            "Token anonim generat local — fără legătură cu identitatea",
            "Hash-ul blocului garantează imuabilitatea înregistrării",
          ].map((item, i) => (
            <li key={i} className="flex gap-2 text-[12px] text-muted-foreground leading-relaxed">
              <span className="text-primary font-bold mt-0.5">·</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleCast}
        disabled={casting}
        className="w-full py-3.5 rounded-full bg-primary text-white text-[15px] font-bold active:scale-[0.98] transition-all disabled:opacity-70 mt-auto"
      >
        {casting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Se transmite…
          </span>
        ) : (
          "Depuneți votul"
        )}
      </button>
    </div>
  );
}

// Step 4: Receipt
function ReceiptStep({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-3 flex flex-col items-center justify-center gap-5">
      {/* Success animation */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Check size={32} className="text-white" strokeWidth={3} />
          </div>
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
          <Check size={12} className="text-white" strokeWidth={3} />
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-[24px] font-extrabold text-foreground mb-1">Vot înregistrat!</h2>
        <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[260px]">
          Votul tău a fost înregistrat anonim și irevocabil pe blockchain. Nicio persoană nu poate asocia votul cu identitatea ta.
        </p>
      </div>

      {/* Transaction receipt */}
      <div className="w-full bg-card rounded-[20px] border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Hash size={13} className="text-muted-foreground" />
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
            Chitanță tranzacție
          </p>
        </div>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground">Tip</span>
            <span className="text-[12px] font-mono font-semibold text-foreground">VOTE_CAST</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground">Bloc</span>
            <span className="text-[12px] font-mono font-semibold text-foreground">#2,847,391</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-muted-foreground">Status</span>
            <span className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">Confirmat ✓</span>
          </div>
          <div className="h-px bg-border" />
          <div>
            <p className="text-[11px] text-muted-foreground mb-1.5">Hash bloc</p>
            <p className="text-[11px] font-mono text-foreground break-all leading-relaxed bg-muted rounded-lg px-3 py-2">
              0x4f8a9c2b1e7d3f5a8b9c2d4e6f1a2b3c…a9f0
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={onDone}
        className="w-full py-3.5 rounded-full bg-primary text-white text-[15px] font-bold"
      >
        Terminat
      </button>
    </div>
  );
}

// Vote Wizard container
function VoteWizard({ election, onClose }: { election: Election; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [identityMode, setIdentityMode] = useState<IdentityMode>("cei");
  const [selectedIdentityId, setSelectedIdentityId] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  const selectedIdentity = IDENTITIES.find((i) => i.id === selectedIdentityId) ?? null;
  const selectedCandidate = CANDIDATES.find((c) => c.id === selectedCandidateId) ?? null;

  const handleBack = () => {
    if (step === 0) onClose();
    else setStep(step - 1);
  };

  return (
    <div className="absolute inset-0 z-50 bg-background flex flex-col">
      {/* Spacer that matches status bar height */}
      <div className="h-11 bg-background shrink-0" />

      {/* Top app bar */}
      <div className="flex items-center gap-2 px-2 pb-1 shrink-0">
        <button
          onClick={handleBack}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          {step === 0 ? <X size={20} className="text-foreground" /> : <ChevronLeft size={22} className="text-foreground" />}
        </button>
        <h1 className="flex-1 text-[16px] font-bold text-foreground text-center pr-9">Depuneți votul</h1>
      </div>

      {/* Stepper — hidden on receipt */}
      {step < 3 && <WizardStepper step={step} />}

      {/* Election context pill */}
      {step < 3 && (
        <div className="mx-4 mb-2 px-3 py-2 bg-muted rounded-xl">
          <p className="text-[11px] text-muted-foreground font-medium truncate">{election.name}</p>
        </div>
      )}

      {step === 0 && (
        <IdentityStep
          mode={identityMode}
          setMode={setIdentityMode}
          selectedId={selectedIdentityId}
          setSelectedId={setSelectedIdentityId}
          onNext={() => setStep(1)}
        />
      )}
      {step === 1 && (
        <CandidateStep
          selectedId={selectedCandidateId}
          setSelectedId={setSelectedCandidateId}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <ConfirmStep
          election={election}
          identity={selectedIdentity}
          candidate={selectedCandidate}
          identityMode={identityMode}
          onCast={() => setStep(3)}
        />
      )}
      {step === 3 && <ReceiptStep onDone={onClose} />}
    </div>
  );
}

// ─── Civic Tab ───────────────────────────────────────────────────────────

const ALL_TOPICS = Array.from(new Set(CIVIC_FEED.flatMap((i) => i.topics)));
const CIVIC_LEVELS: CivicLevel[] = ["EU", "Romania", "Local"];
const CIVIC_SECTIONS: CivicSection[] = ["Upcoming votes", "Civic news"];

function CivicCard({ item }: { item: CivicItem }) {
  return (
    <div className="bg-card rounded-[20px] border border-border p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] text-muted-foreground font-semibold">{item.source}</span>
        <div className="flex items-center gap-2">
          {item.level === "EU" && <Globe size={11} className="text-muted-foreground" />}
          {item.level === "Local" && <MapPin size={11} className="text-muted-foreground" />}
          <ImportanceDots value={item.importance} />
        </div>
      </div>
      <h3 className="text-[14px] font-bold text-foreground leading-snug mb-2">{item.title}</h3>
      <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">{item.summary}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {item.openForInput && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/60">
            Deschis consultării publice
          </span>
        )}
        {item.topics.map((topic) => (
          <span
            key={topic}
            className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-medium"
          >
            {topic}
          </span>
        ))}
        <button className="ml-auto flex items-center gap-1 text-primary text-[11px] font-semibold">
          <ExternalLink size={11} />
          Citiți
        </button>
      </div>
    </div>
  );
}

function CivicTab() {
  const [sectionFilter, setSectionFilter] = useState<CivicSection | null>(null);
  const [levelFilter, setLevelFilter] = useState<CivicLevel | null>(null);
  const [importanceFilter, setImportanceFilter] = useState<number | null>(null);
  const [topicFilter, setTopicFilter] = useState<string | null>(null);

  const filtered = CIVIC_FEED.filter((item) => {
    if (sectionFilter && item.section !== sectionFilter) return false;
    if (levelFilter && item.level !== levelFilter) return false;
    if (importanceFilter && item.importance < importanceFilter) return false;
    if (topicFilter && !item.topics.includes(topicFilter)) return false;
    return true;
  });

  const activeFilterCount = [sectionFilter, levelFilter, importanceFilter, topicFilter].filter(Boolean).length;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="px-4 pt-5 pb-1">
        <p className="text-[10px] font-extrabold text-primary tracking-[0.15em] uppercase mb-1">
          Rezumate generate de AI
        </p>
        <h1 className="text-[23px] font-extrabold text-foreground leading-tight">Feed civic</h1>
        <p className="text-[12px] text-muted-foreground mt-1">
          Voturi în curs și știri civice, rezumate inteligent pentru tine.
        </p>
      </div>

      {/* Filter chips horizontal scroll */}
      <div className="overflow-x-auto scrollbar-hide pt-3 pb-1">
        <div className="flex gap-2 px-4 w-max">
          {/* Section */}
          {CIVIC_SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSectionFilter(sectionFilter === s ? null : s)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-colors ${
                sectionFilter === s ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              {s === "Upcoming votes" ? "Voturi" : "Știri civice"}
            </button>
          ))}

          <div className="w-px bg-border self-stretch" />

          {/* Level */}
          {CIVIC_LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(levelFilter === l ? null : l)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-colors ${
                levelFilter === l ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              {l}
            </button>
          ))}

          <div className="w-px bg-border self-stretch" />

          {/* Importance 1–5 */}
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setImportanceFilter(importanceFilter === n ? null : n)}
              className={`w-8 h-8 rounded-full text-[12px] font-bold transition-colors ${
                importanceFilter === n ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              {n}
            </button>
          ))}

          <div className="w-px bg-border self-stretch" />

          {/* Topic tags */}
          {ALL_TOPICS.slice(0, 6).map((t) => (
            <button
              key={t}
              onClick={() => setTopicFilter(topicFilter === t ? null : t)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-colors ${
                topicFilter === t ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-secondary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="px-4 pt-2 flex items-center justify-between">
          <p className="text-[12px] text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "rezultat" : "rezultate"}
          </p>
          <button
            onClick={() => { setSectionFilter(null); setLevelFilter(null); setImportanceFilter(null); setTopicFilter(null); }}
            className="text-[12px] text-primary font-semibold"
          >
            Ștergeți filtrele
          </button>
        </div>
      )}

      <div className="px-4 pt-3 pb-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Newspaper size={26} className="text-muted-foreground" />
            </div>
            <p className="text-[16px] font-bold text-foreground mb-1">Nicio știre găsită</p>
            <p className="text-[13px] text-muted-foreground">Modificați filtrele pentru a vedea conținut</p>
            <button
              onClick={() => { setSectionFilter(null); setLevelFilter(null); setImportanceFilter(null); setTopicFilter(null); }}
              className="mt-4 px-5 py-2 rounded-full bg-primary text-white text-[13px] font-bold"
            >
              Resetați filtrele
            </button>
          </div>
        ) : (
          filtered.map((item) => <CivicCard key={item.id} item={item} />)
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pt-2 pb-6 text-center border-t border-border mt-1">
        <p className="text-[11px] text-muted-foreground mt-4">Votera · Hackathon MVP · Cluj 2026</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">One person, one vote — transparently.</p>
      </div>
    </div>
  );
}

// ─── Bottom Nav ──────────────────────────────────────────────────────────

function BottomNav({ activeTab, setActiveTab }: { activeTab: Tab; setActiveTab: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; Icon: typeof CheckCircle2 }[] = [
    { id: "vote", label: "Votați", Icon: CheckCircle2 },
    { id: "civic", label: "Civic", Icon: Newspaper },
  ];
  return (
    <div className="flex bg-card border-t border-border shrink-0">
      {tabs.map(({ id, label, Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-[10px] font-bold">{label}</span>
            <div className={`h-[3px] w-6 rounded-full transition-all ${active ? "bg-primary" : "bg-transparent"}`} />
          </button>
        );
      })}
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("vote");
  const [darkMode, setDarkMode] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [votingElection, setVotingElection] = useState<Election | null>(null);

  return (
    <div className={darkMode ? "dark" : ""}>
      {/* Page background */}
      <div className="min-h-screen bg-[#EDE0DB] dark:bg-[#0A0508] flex items-center justify-center p-4 transition-colors">
        {/* Phone shell */}
        <div
          className="relative bg-background flex flex-col overflow-hidden shadow-2xl"
          style={{
            width: 390,
            height: 844,
            maxWidth: "100vw",
            maxHeight: "100dvh",
            borderRadius: "clamp(0px, 4vw, 44px)",
          }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-3 pb-1 bg-background shrink-0 z-10">
            <span className="text-[13px] font-bold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
              9:41
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setDarkMode((d) => !d)}
                className="w-6 h-6 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                title={darkMode ? "Mod luminos" : "Mod întunecat"}
              >
                {darkMode ? <Sun size={13} className="text-foreground" /> : <Moon size={13} className="text-foreground" />}
              </button>
              <button
                onClick={() => setIsOffline((o) => !o)}
                className="w-6 h-6 flex items-center justify-center"
                title="Toggle offline"
              >
                {isOffline
                  ? <WifiOff size={13} className="text-amber-500" />
                  : <Wifi size={13} className="text-foreground opacity-60" />}
              </button>
              {/* Battery */}
              <div className="flex items-center gap-px">
                <div className="w-6 h-[13px] rounded-[3px] border-[1.5px] border-foreground/40 relative">
                  <div className="absolute inset-[2px] bg-foreground/50 rounded-[1px] w-[65%]" />
                </div>
                <div className="w-[2px] h-[6px] bg-foreground/30 rounded-r-full" />
              </div>
            </div>
          </div>

          {/* Main body */}
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {activeTab === "vote"
              ? <VoteTab isOffline={isOffline} onVote={setVotingElection} />
              : <CivicTab />
            }

            {/* Vote wizard full-screen overlay */}
            {votingElection && (
              <VoteWizard
                election={votingElection}
                onClose={() => setVotingElection(null)}
              />
            )}
          </div>

          {/* Bottom nav + home indicator */}
          {!votingElection && (
            <>
              <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
              <div className="bg-card flex justify-center pb-2 pt-1.5 shrink-0">
                <div className="w-32 h-1 rounded-full bg-foreground/15" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
