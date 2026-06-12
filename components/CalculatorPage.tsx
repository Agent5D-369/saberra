"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCopy,
  Download,
  Mail,
  MousePointer2,
  RotateCcw,
  Send,
  Sparkles,
  SunMedium
} from "lucide-react";
import { formspreeForms } from "@/lib/site";

type CalculatorState = {
  teamSize: number;
  orgType: string;
  avgAnnualCostPerPerson: number;
  hasGoogleWorkspace: "yes" | "no" | "not_sure";
  hasNotion: "business" | "not_sure" | "no" | "other";
  canCreateCaptureInbox: "yes" | "probably" | "not_sure";
  meetingsPerWeek: string;
  importantEmailsPerWeek: string;
  memoryPainFrequency: string;
  hoursLostPerPersonPerWeek: number;
};

type PlanKey = "Core" | "Growth" | "Enterprise";

const WORK_WEEKS_PER_YEAR = 48;
const HOURS_PER_YEAR = 2080;

const PRICING = {
  core: {
    setupLow: 3000,
    setupHigh: 5000,
    monthlyLow: 750,
    monthlyHigh: 1250,
    setupMid: 4000,
    monthlyMid: 1000
  },
  growth: {
    setupLow: 5000,
    setupHigh: 8000,
    monthlyLow: 1500,
    monthlyHigh: 2500,
    setupMid: 6500,
    monthlyMid: 2000
  }
};

const TOOL_COSTS = {
  googleWorkspaceBusinessStandardMonthlyAnnual: 14,
  notionBusinessMonthlyAnnual: 20
};

const PRICING_AS_OF = "June 2026";
const CALENDAR_DEMO_LINK = "https://calendar.app.google/DuupxARDTdBwxAp48";

const defaultState: CalculatorState = {
  teamSize: 25,
  orgType: "Founder-led company",
  avgAnnualCostPerPerson: 80000,
  hasGoogleWorkspace: "yes",
  hasNotion: "business",
  canCreateCaptureInbox: "yes",
  meetingsPerWeek: "6-15",
  importantEmailsPerWeek: "11-25",
  memoryPainFrequency: "Sometimes",
  hoursLostPerPersonPerWeek: 2
};

const steps = [
  "Team Profile",
  "Current Tools",
  "Meeting & Email Volume",
  "Memory Leak Estimate",
  "Recommended Saberra Plan",
  "ROI Summary"
];

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

function formatMoney(value: number) {
  return money.format(Math.round(value));
}

function recommendPlan(state: CalculatorState): PlanKey {
  const highMeetingVolume =
    state.meetingsPerWeek === "31-60" ||
    state.meetingsPerWeek === "60+" ||
    state.importantEmailsPerWeek === "51-100" ||
    state.importantEmailsPerWeek === "100+";

  if (state.teamSize > 100) return "Enterprise";
  if (state.teamSize > 30 || highMeetingVolume) return "Growth";
  return "Core";
}

function memoryPressureFactor(state: CalculatorState) {
  const meetingFactors: Record<string, number> = {
    "1-5": 0.85,
    "6-15": 1,
    "16-30": 1.12,
    "31-60": 1.25,
    "60+": 1.4
  };
  const emailFactors: Record<string, number> = {
    "1-10": 0.9,
    "11-25": 1,
    "26-50": 1.1,
    "51-100": 1.22,
    "100+": 1.35
  };
  const painFactors: Record<string, number> = {
    Rarely: 0.7,
    Sometimes: 1,
    Often: 1.2,
    Constantly: 1.45,
    "We are not sure, but it feels expensive": 1.15
  };

  return (
    (meetingFactors[state.meetingsPerWeek] ?? 1) *
    (emailFactors[state.importantEmailsPerWeek] ?? 1) *
    (painFactors[state.memoryPainFrequency] ?? 1)
  );
}

function getCalculations(state: CalculatorState) {
  const hourlyValue = state.avgAnnualCostPerPerson / HOURS_PER_YEAR;
  const weeklyMemoryWasteHours = state.teamSize * state.hoursLostPerPersonPerWeek;
  const annualMemoryWasteHours = weeklyMemoryWasteHours * WORK_WEEKS_PER_YEAR;
  const baseAnnualMemoryWasteCost = annualMemoryWasteHours * hourlyValue;
  const pressureFactor = memoryPressureFactor(state);
  const annualMemoryWasteCost = baseAnnualMemoryWasteCost * pressureFactor;
  const conservativeRecovery = annualMemoryWasteCost * 0.1;
  const moderateRecovery = annualMemoryWasteCost * 0.2;
  const highRecovery = annualMemoryWasteCost * 0.3;
  const plan = recommendPlan(state);
  const firstYearSaberraInvestment =
    plan === "Core"
      ? PRICING.core.setupMid + PRICING.core.monthlyMid * 12
      : plan === "Growth"
        ? PRICING.growth.setupMid + PRICING.growth.monthlyMid * 12
        : null;
  const conservativeMonthlyRecovery = conservativeRecovery / 12;
  const paybackMonths =
    firstYearSaberraInvestment && conservativeMonthlyRecovery > 0
      ? firstYearSaberraInvestment / conservativeMonthlyRecovery
      : null;
  const googleSeatMonthly = TOOL_COSTS.googleWorkspaceBusinessStandardMonthlyAnnual;
  const notionSeatMonthly = TOOL_COSTS.notionBusinessMonthlyAnnual;
  const needsGoogleWorkspace = state.hasGoogleWorkspace !== "yes";
  const needsNotionBusiness = state.hasNotion !== "business";
  const googleMonthly = needsGoogleWorkspace ? state.teamSize * googleSeatMonthly : 0;
  const notionMonthly = needsNotionBusiness ? state.teamSize * notionSeatMonthly : 0;
  const googleAnnual = googleMonthly * 12;
  const notionAnnual = notionMonthly * 12;
  const clientSubscriptionMonthlyEquivalent = googleMonthly + notionMonthly;
  const clientSubscriptionAnnualTotal = googleAnnual + notionAnnual;
  const firstYearTotalWithClientSubscriptions = firstYearSaberraInvestment
    ? firstYearSaberraInvestment + clientSubscriptionAnnualTotal
    : null;

  return {
    hourlyValue,
    weeklyMemoryWasteHours,
    annualMemoryWasteHours,
    baseAnnualMemoryWasteCost,
    pressureFactor,
    annualMemoryWasteCost,
    conservativeRecovery,
    moderateRecovery,
    highRecovery,
    plan,
    firstYearSaberraInvestment,
    conservativeMonthlyRecovery,
    paybackMonths,
    needsGoogleWorkspace,
    needsNotionBusiness,
    googleSeatMonthly,
    notionSeatMonthly,
    googleMonthly,
    googleAnnual,
    notionMonthly,
    notionAnnual,
    clientSubscriptionMonthlyEquivalent,
    clientSubscriptionAnnualTotal,
    firstYearTotalWithClientSubscriptions
  };
}

function planDetails(plan: PlanKey) {
  if (plan === "Core") {
    return {
      title: "Core Deployment",
      setup: "$3,000-$5,000",
      monthly: "$750-$1,250/month",
      summary: "Best fit for small teams with focused meeting and email capture."
    };
  }

  if (plan === "Growth") {
    return {
      title: "Growth Deployment",
      setup: "$5,000-$8,000",
      monthly: "$1,500-$2,500/month",
      summary: "Best fit for larger teams or higher meeting and email volume."
    };
  }

  return {
    title: "Custom Deployment",
    setup: "Custom",
    monthly: "Custom",
    summary: "Best fit when team size, security, integrations, or architecture need discovery."
  };
}

function demoHref(state: CalculatorState) {
  const calc = getCalculations(state);
  const params = new URLSearchParams({
    teamSize: String(state.teamSize),
    plan: calc.plan.toLowerCase(),
    memoryLeak: String(Math.round(calc.annualMemoryWasteCost)),
    weeklyHours: String(Math.round(calc.weeklyMemoryWasteHours))
  });
  return `/demo?${params.toString()}`;
}

function resultText(state: CalculatorState) {
  const calc = getCalculations(state);
  const details = planDetails(calc.plan);
  const investment = calc.firstYearSaberraInvestment
    ? formatMoney(calc.firstYearSaberraInvestment)
    : "Scoped after discovery";

  return [
    "Saberra Memory Cost Calculator Results",
    "",
    `Team size: ${state.teamSize}`,
    `Organization type: ${state.orgType}`,
    `Estimated hours lost weekly: ${Math.round(calc.weeklyMemoryWasteHours).toLocaleString()}`,
    `Estimated annual memory cost: ${formatMoney(calc.annualMemoryWasteCost)}`,
    `Memory pressure factor: ${calc.pressureFactor.toFixed(2)}x`,
    `Conservative recovery estimate: ${formatMoney(calc.conservativeRecovery)} per year (10% of estimated memory leak recovered)`,
    `Recommended plan: ${details.title}`,
    `First-year Saberra investment: ${investment}`,
    `Google Workspace estimate: ${
      calc.needsGoogleWorkspace
        ? `${formatMoney(calc.googleAnnual)}/year (${state.teamSize} seats x ${formatMoney(calc.googleSeatMonthly)}/seat/month annual plan)`
        : "Already in place"
    }`,
    `Notion Business estimate: ${
      calc.needsNotionBusiness
        ? `${formatMoney(calc.notionAnnual)}/year (${state.teamSize} seats x ${formatMoney(calc.notionSeatMonthly)}/seat/month annual plan)`
        : "Already in place"
    }`,
    `Estimated client-owned subscriptions: ${formatMoney(calc.clientSubscriptionAnnualTotal)}/year`,
    "",
    `Third-party tool prices are public USD annual-plan assumptions as of ${PRICING_AS_OF}.`,
    "Saberra rollout, migration, provisioning, or account administration is scoped separately when needed.",
    "Calculator results are estimates and not a formal quote."
  ].join("\n");
}

function OptionButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`calculator-option ${active ? "active" : ""}`}
      type="button"
      aria-pressed={active}
      onClick={onClick}
    >
      <span>{children}</span>
      {active ? <CheckCircle2 size={16} aria-hidden="true" /> : null}
    </button>
  );
}

function CalculatorStep({
  step,
  activeStep,
  children
}: {
  step: number;
  activeStep: number;
  children: React.ReactNode;
}) {
  return (
    <section className={`calculator-step ${activeStep === step ? "active" : ""}`} aria-hidden={activeStep !== step}>
      {children}
    </section>
  );
}

function StepTitle({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="calculator-step-title">
      <span>Step</span>
      <h2>{title}</h2>
      <p>{copy}</p>
    </div>
  );
}

function FieldGroup({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <div className="calculator-field">
      <label>{label}</label>
      {children}
      {helper ? <p>{helper}</p> : null}
    </div>
  );
}

function CalculatorValueStrip() {
  return (
    <div className="calculator-value-strip" aria-label="What Saberra changes">
      <article>
        <MousePointer2 size={17} aria-hidden="true" />
        <div>
          <strong>Near-zero adoption</strong>
          <span>Your team keeps using Google Meet, Gmail, and Notion.</span>
        </div>
      </article>
      <article>
        <Sparkles size={17} aria-hidden="true" />
        <div>
          <strong>Invisible work made visible</strong>
          <span>Decisions, tasks, risks, and ownership stop disappearing after the call.</span>
        </div>
      </article>
      <article>
        <SunMedium size={17} aria-hidden="true" />
        <div>
          <strong>Time restored with AI assistance</strong>
          <span>Sera helps recover context so people can spend less time searching and more time living.</span>
        </div>
      </article>
    </div>
  );
}

function TeamProfileStep({
  state,
  update
}: {
  state: CalculatorState;
  update: (patch: Partial<CalculatorState>) => void;
}) {
  const costOptions = [50000, 75000, 100000, 125000];
  const [customCost, setCustomCost] = useState("");

  return (
    <div className="calculator-fields">
      <StepTitle
        title="Team profile"
        copy="Start with the size and cost structure of the team whose memory is leaking."
      />
      <FieldGroup label="How many people are on your team?">
        <div className="calculator-slider-row">
          <input
            type="range"
            min="5"
            max="500"
            value={state.teamSize}
            onChange={(event) => update({ teamSize: Number(event.target.value) })}
          />
          <input
            className="calculator-number"
            type="number"
            min="5"
            max="500"
            value={state.teamSize}
            onChange={(event) => update({ teamSize: Math.min(500, Math.max(5, Number(event.target.value) || 5)) })}
          />
        </div>
      </FieldGroup>
      <FieldGroup
        label="What best describes your organization?"
        helper="This shapes the recommendation context and demo handoff. It does not change the ROI math."
      >
        <div className="calculator-options">
          {[
            "Founder-led company",
            "Nonprofit / social enterprise",
            "Consultancy / agency",
            "Cooperative / self-managing team",
            "Regenerative / mission-driven organization",
            "Other"
          ].map((option) => (
            <OptionButton key={option} active={state.orgType === option} onClick={() => update({ orgType: option })}>
              {option}
            </OptionButton>
          ))}
        </div>
      </FieldGroup>
      <FieldGroup
        label="What is the average fully loaded annual cost per team member?"
        helper="Fully loaded cost includes salary, contractor cost, taxes, benefits, overhead, and management time. Use your best estimate."
      >
        <div className="calculator-options compact">
          {costOptions.map((cost) => (
            <OptionButton key={cost} active={state.avgAnnualCostPerPerson === cost} onClick={() => update({ avgAnnualCostPerPerson: cost })}>
              {formatMoney(cost)}
            </OptionButton>
          ))}
          <input
            className="calculator-custom-input"
            type="number"
            placeholder="Custom"
            value={customCost}
            onChange={(event) => {
              setCustomCost(event.target.value);
              const next = Number(event.target.value);
              if (next > 0) update({ avgAnnualCostPerPerson: next });
            }}
          />
        </div>
      </FieldGroup>
    </div>
  );
}

function CurrentToolsStep({
  state,
  update
}: {
  state: CalculatorState;
  update: (patch: Partial<CalculatorState>) => void;
}) {
  return (
    <div className="calculator-fields">
      <StepTitle
        title="Current tools"
        copy="Saberra is strongest when it turns your existing workspace into memory infrastructure."
      />
      <FieldGroup label="Do you already use Google Workspace?">
        <div className="calculator-options compact">
          {[
            ["yes", "Yes"],
            ["no", "No"],
            ["not_sure", "Not sure"]
          ].map(([value, label]) => (
            <OptionButton key={value} active={state.hasGoogleWorkspace === value} onClick={() => update({ hasGoogleWorkspace: value as CalculatorState["hasGoogleWorkspace"] })}>
              {label}
            </OptionButton>
          ))}
        </div>
        <div className="calculator-context-note">
          {state.hasGoogleWorkspace === "yes"
            ? "Good. Saberra is designed to work with your existing Google Meet, Gmail, Drive, and Docs workflow."
            : `Google Workspace estimate used here: Business Standard at ${formatMoney(TOOL_COSTS.googleWorkspaceBusinessStandardMonthlyAnnual)}/user/month on the annual plan, billed as ${formatMoney(TOOL_COSTS.googleWorkspaceBusinessStandardMonthlyAnnual * 12)}/user/year. Prices as of ${PRICING_AS_OF}.`}
        </div>
      </FieldGroup>
      <FieldGroup label="Do you already use Notion?">
        <div className="calculator-options">
          {[
            ["business", "Yes, Notion Business or Enterprise"],
            ["not_sure", "Yes, but not sure which plan"],
            ["no", "No"],
            ["other", "We use something else"]
          ].map(([value, label]) => (
            <OptionButton key={value} active={state.hasNotion === value} onClick={() => update({ hasNotion: value as CalculatorState["hasNotion"] })}>
              {label}
            </OptionButton>
          ))}
        </div>
        <div className="calculator-context-note">
          {state.hasNotion === "business"
            ? "Good. Saberra can use Notion as your inspectable memory backend."
            : `Notion Business estimate used here: ${formatMoney(TOOL_COSTS.notionBusinessMonthlyAnnual)}/member/month on the annual plan, billed as ${formatMoney(TOOL_COSTS.notionBusinessMonthlyAnnual * 12)}/member/year. Prices as of ${PRICING_AS_OF}.`}
        </div>
      </FieldGroup>
      <FieldGroup
        label="Can your organization create one dedicated capture inbox?"
        helper="Saberra only needs one org-owned capture inbox for a Core install. Your team does not need to individually install another app."
      >
        <div className="calculator-inbox-examples">
          <code>memory@yourdomain.com</code>
          <code>systems@yourdomain.com</code>
          <code>sera@yourdomain.com</code>
        </div>
        <div className="calculator-options compact">
          {[
            ["yes", "Yes"],
            ["probably", "Probably"],
            ["not_sure", "Not sure"]
          ].map(([value, label]) => (
            <OptionButton key={value} active={state.canCreateCaptureInbox === value} onClick={() => update({ canCreateCaptureInbox: value as CalculatorState["canCreateCaptureInbox"] })}>
              {label}
            </OptionButton>
          ))}
        </div>
      </FieldGroup>
    </div>
  );
}

function WorkflowStep({
  state,
  update
}: {
  state: CalculatorState;
  update: (patch: Partial<CalculatorState>) => void;
}) {
  return (
    <div className="calculator-fields">
      <StepTitle
        title="Meeting and email volume"
        copy="This estimates the amount of operational memory your team creates every week."
      />
      <SegmentedField
        label="How many recurring meetings does your team run per week?"
        value={state.meetingsPerWeek}
        options={["1-5", "6-15", "16-30", "31-60", "60+"]}
        onChange={(value) => update({ meetingsPerWeek: value })}
      />
      <SegmentedField
        label="How many important operational emails or threads should be captured per week?"
        value={state.importantEmailsPerWeek}
        options={["1-10", "11-25", "26-50", "51-100", "100+"]}
        onChange={(value) => update({ importantEmailsPerWeek: value })}
      />
      <SegmentedField
        label="How often do decisions, tasks, risks, roles, or policies disappear after meetings?"
        value={state.memoryPainFrequency}
        options={["Rarely", "Sometimes", "Often", "Constantly", "We are not sure, but it feels expensive"]}
        onChange={(value) => update({ memoryPainFrequency: value })}
      />
    </div>
  );
}

function SegmentedField({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <FieldGroup label={label}>
      <div className="calculator-options compact">
        {options.map((option) => (
          <OptionButton key={option} active={value === option} onClick={() => onChange(option)}>
            {option}
          </OptionButton>
        ))}
      </div>
    </FieldGroup>
  );
}

function MemoryLeakStep({
  state,
  update
}: {
  state: CalculatorState;
  update: (patch: Partial<CalculatorState>) => void;
}) {
  const calc = getCalculations(state);

  return (
    <div className="calculator-fields">
      <StepTitle
        title="Memory leak estimate"
        copy="Make the invisible cost visible enough to decide whether this is worth fixing."
      />
      <FieldGroup
        label="How many hours per person per week are lost to searching, repeating, clarifying, re-deciding, or reconstructing context?"
        helper="Include time spent looking for decisions, asking who owns what, rebuilding context, onboarding slowly, repeating conversations, and cleaning up missed follow-through."
      >
        <div className="calculator-slider-row">
          <input
            type="range"
            min="0.5"
            max="8"
            step="0.5"
            value={state.hoursLostPerPersonPerWeek}
            onChange={(event) => update({ hoursLostPerPersonPerWeek: Number(event.target.value) })}
          />
          <div className="calculator-number readonly">{state.hoursLostPerPersonPerWeek}h</div>
        </div>
      </FieldGroup>
      <div className="calculator-estimate-grid">
        <article>
          <span>Estimated annual cost of memory leaks</span>
          <strong>{formatMoney(calc.annualMemoryWasteCost)}</strong>
          <p>Includes a {calc.pressureFactor.toFixed(2)}x pressure factor from volume and pain frequency.</p>
        </article>
        <article>
          <span>10% of leak recovered</span>
          <strong>{formatMoney(calc.conservativeRecovery)}</strong>
          <p>A conservative scenario: recovering one-tenth of the estimated annual memory waste.</p>
        </article>
        <article>
          <span>20% of leak recovered</span>
          <strong>{formatMoney(calc.moderateRecovery)}</strong>
        </article>
        <article>
          <span>30% of leak recovered</span>
          <strong>{formatMoney(calc.highRecovery)}</strong>
        </article>
      </div>
      <p className="calculator-disclaimer">
        These are directional estimates, not guarantees. The goal is to make the invisible cost visible enough for a
        better decision.
      </p>
    </div>
  );
}

function PlanRecommendation({
  state
}: {
  state: CalculatorState;
}) {
  const calc = getCalculations(state);
  const details = planDetails(calc.plan);

  return (
    <div className="calculator-fields">
      <StepTitle
        title="Recommended Saberra plan"
        copy="This is a directional fit based on team size and weekly operating-memory volume."
      />
      <div className="calculator-plan-card">
        <div>
          <span>Recommended</span>
          <h3>{details.title}</h3>
          <p>{details.summary}</p>
        </div>
        <div className="calculator-plan-prices">
          <div>
            <span>Setup</span>
            <strong>{details.setup}</strong>
          </div>
          <div>
            <span>Monthly</span>
            <strong>{details.monthly}</strong>
          </div>
        </div>
      </div>
      <CostBreakdownCard state={state} />
      <div className="calculator-two-list">
        <article>
          <h3>What you likely need for Core</h3>
          <ul>
            <li>One organization-owned Google Workspace account</li>
            <li>One dedicated capture inbox</li>
            <li>One Notion Business workspace</li>
            <li>One Memory Admin</li>
            <li>Saberra deployment and service plan</li>
          </ul>
        </article>
        <article>
          <h3>What your broader team does not need to do</h3>
          <ul>
            <li>No new meeting behavior</li>
            <li>No manual tagging</li>
            <li>No new daily interface</li>
            <li>No extra note-taking ritual</li>
            <li>No complicated database work</li>
            <li>No need to search Notion manually if they can ask Sera</li>
          </ul>
        </article>
      </div>
    </div>
  );
}

function CostBreakdownCard({ state }: { state: CalculatorState }) {
  const calc = getCalculations(state);

  return (
    <article className="calculator-cost-card">
      <h3>Client-owned tool subscriptions</h3>
      <div className="calculator-cost-row">
        <span>Google Workspace Business Standard</span>
        <strong>
          {calc.needsGoogleWorkspace ? `${formatMoney(calc.googleAnnual)}/year` : "Already in place"}
        </strong>
      </div>
      {calc.needsGoogleWorkspace ? (
        <p>
          {state.teamSize} seats x {formatMoney(calc.googleSeatMonthly)}/user/month x 12 months.
        </p>
      ) : null}
      <div className="calculator-cost-row">
        <span>Notion Business</span>
        <strong>{calc.needsNotionBusiness ? `${formatMoney(calc.notionAnnual)}/year` : "Already in place"}</strong>
      </div>
      {calc.needsNotionBusiness ? (
        <p>
          {state.teamSize} seats x {formatMoney(calc.notionSeatMonthly)}/member/month x 12 months.
        </p>
      ) : null}
      <div className="calculator-cost-row total">
        <span>Estimated client-owned subscriptions</span>
        <strong>{formatMoney(calc.clientSubscriptionAnnualTotal)}/year</strong>
      </div>
      <p>
        Third-party tool prices are public USD annual-plan assumptions as of {PRICING_AS_OF}. If Saberra provisions,
        migrates, configures, or administers these accounts, that rollout work is scoped separately from subscription
        costs.
      </p>
    </article>
  );
}

function RoiSummaryCard({ state }: { state: CalculatorState }) {
  const calc = getCalculations(state);
  const details = planDetails(calc.plan);
  const paybackText =
    calc.paybackMonths && calc.paybackMonths < 12
      ? `Saberra may pay for itself within approximately ${Math.max(1, Math.round(calc.paybackMonths))} months if it recovers only 10% of your estimated memory leak.`
      : "Saberra may still be a strong strategic investment if memory loss is affecting onboarding, decision quality, founder bottlenecks, client delivery, or team trust.";

  return (
    <div className="calculator-results">
      <StepTitle
        title="ROI summary"
        copy="Use this as a decision aid, not a formal quote. The next step is testing these numbers against your actual workflow."
      />
      <div className="calculator-roi-grid">
        <article className="calculator-roi-primary">
          <span>Your estimated memory leak</span>
          <strong>{formatMoney(calc.annualMemoryWasteCost)}</strong>
          <p>{Math.round(calc.weeklyMemoryWasteHours).toLocaleString()} hours lost weekly across {state.teamSize} people.</p>
        </article>
        <article>
          <span>Recommended plan</span>
          <strong>{details.title}</strong>
          <p>{details.setup} setup. {details.monthly} ongoing.</p>
        </article>
        <article>
          <span>First-year Saberra investment</span>
          <strong>
            {calc.firstYearSaberraInvestment ? formatMoney(calc.firstYearSaberraInvestment) : "Scoped after discovery"}
          </strong>
          <p>Uses midpoint setup and monthly pricing for Core or Growth.</p>
        </article>
        <article>
          <span>First-year total with subscriptions</span>
          <strong>
            {calc.firstYearTotalWithClientSubscriptions
              ? formatMoney(calc.firstYearTotalWithClientSubscriptions)
              : "Scoped after discovery"}
          </strong>
          <p>Saberra midpoint plus any needed Google Workspace and Notion subscriptions.</p>
        </article>
        <article>
          <span>Client-owned subscriptions</span>
          <strong>
            {calc.clientSubscriptionAnnualTotal > 0
              ? `${formatMoney(calc.clientSubscriptionAnnualTotal)}/year`
              : "Already in place"}
          </strong>
          <p>Exact seat math using annual-plan assumptions as of {PRICING_AS_OF}.</p>
        </article>
        <article>
          <span>10% recovery scenario</span>
          <strong>{formatMoney(calc.conservativeRecovery)}</strong>
          <p>If Saberra helps recover one-tenth of the estimated annual memory waste.</p>
        </article>
      </div>
      <div className="calculator-payback">
        <Sparkles size={18} aria-hidden="true" />
        <p>{paybackText}</p>
      </div>
      <section className="calculator-meaning">
        <h3>What this means</h3>
        <p>Your organization is already creating valuable memory every week.</p>
        <p>
          The question is whether that memory becomes usable infrastructure, or whether it stays trapped in meetings,
          email threads, people's heads, and stale documents.
        </p>
        <p>
          Saberra closes the loop. Your team keeps working in Google Meet and email. Sera captures the output,
          structures the memory, routes it for human review, and lets your team ask questions in natural language.
        </p>
        <p>You do not need another tool people forget to use. You need your organization to remember what it already knows.</p>
      </section>
    </div>
  );
}

function LiveEstimate({ state }: { state: CalculatorState }) {
  const calc = getCalculations(state);
  const details = planDetails(calc.plan);

  return (
    <aside className="calculator-live-card" aria-label="Live calculator estimate">
      <div className="calculator-live-header">
        <span>Live estimate</span>
        <strong>{details.title}</strong>
      </div>
      <div className="calculator-live-number">
        <span>Annual memory leak</span>
        <strong>{formatMoney(calc.annualMemoryWasteCost)}</strong>
      </div>
      <div className="calculator-live-metrics">
        <div>
          <span>Weekly hours</span>
          <strong>{Math.round(calc.weeklyMemoryWasteHours).toLocaleString()}</strong>
        </div>
        <div>
          <span>10% leak recovered</span>
          <strong>{formatMoney(calc.conservativeRecovery)}</strong>
        </div>
        <div>
          <span>Pressure factor</span>
          <strong>{calc.pressureFactor.toFixed(2)}x</strong>
        </div>
        <div>
          <span>Subscriptions/year</span>
          <strong>
            {calc.clientSubscriptionAnnualTotal > 0
              ? formatMoney(calc.clientSubscriptionAnnualTotal)
              : "In place"}
          </strong>
        </div>
      </div>
      <div className="calculator-memory-flow" aria-label="Saberra memory flow">
        <div>Meetings + email</div>
        <span>Human-reviewed memory</span>
        <strong>Ask Sera</strong>
      </div>
      <p>
        Near-zero behavior change. Saberra brings invisible operational work to the surface, then Sera helps your team
        retrieve what it already knows.
      </p>
    </aside>
  );
}

function CTASection({ state }: { state: CalculatorState }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [message, setMessage] = useState("");
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const summary = resultText(state);

  async function copyResults() {
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadSummary() {
    const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "saberra-memory-cost-summary.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function sendResults(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    setSendStatus("sending");
    try {
      const response = await fetch(formspreeForms.demoRequest, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          organization,
          message,
          source: "Saberra Memory Cost Calculator",
          calculator_summary: summary
        })
      });
      if (response.ok) {
        setSendStatus("sent");
        window.open(CALENDAR_DEMO_LINK, "_blank", "noopener,noreferrer");
      } else {
        setSendStatus("error");
      }
    } catch {
      setSendStatus("error");
    }
  }

  return (
    <section className="calculator-cta-section">
      <div>
        <h2>Bring these numbers to a Saberra demo.</h2>
        <p>
          The calculator is the starting point. The demo maps these assumptions against your actual meetings, email
          threads, ownership patterns, and review needs.
        </p>
        <div className="cta-row">
          <Link className="btn btn-primary" href={demoHref(state)}>
            Book Demo With These Numbers <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <button className="btn btn-secondary" type="button" onClick={copyResults}>
            <ClipboardCopy size={16} aria-hidden="true" /> {copied ? "Copied" : "Copy Results"}
          </button>
          <button className="btn btn-secondary" type="button" onClick={downloadSummary}>
            <Download size={16} aria-hidden="true" /> Download Summary
          </button>
        </div>
      </div>
      <form className="calculator-send-card" onSubmit={sendResults}>
        <h3>Send me my results</h3>
        <p>Submit your results and book a live demo as a thank you for being curious.</p>
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" />
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" required />
        <input value={organization} onChange={(event) => setOrganization(event.target.value)} placeholder="Organization" />
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Optional message" rows={3} />
        <button className="btn btn-primary" type="submit" disabled={sendStatus === "sending"}>
          {sendStatus === "sending" ? "Sending..." : "Send Me My Results"} <Mail size={16} aria-hidden="true" />
        </button>
        {sendStatus === "sent" ? (
          <p>
            Your results were sent. The demo calendar should open automatically.{" "}
            <a href={CALENDAR_DEMO_LINK} target="_blank" rel="noreferrer">
              Open the booking calendar
            </a>
            .
          </p>
        ) : null}
        {sendStatus === "error" ? <p>Something went wrong. Copy or download your results instead.</p> : null}
      </form>
    </section>
  );
}

export function CalculatorPage() {
  const [state, setState] = useState<CalculatorState>(defaultState);
  const [activeStep, setActiveStep] = useState(0);
  const calculatorRef = useRef<HTMLElement>(null);
  const calc = useMemo(() => getCalculations(state), [state]);
  const update = (patch: Partial<CalculatorState>) => setState((current) => ({ ...current, ...patch }));
  const atResults = activeStep === steps.length - 1;
  const goToStep = (step: number) => {
    setActiveStep(Math.min(steps.length - 1, Math.max(0, step)));
    window.setTimeout(() => {
      calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  return (
    <main className="calculator-page">
      <section className="calculator-hero">
        <div className="container calculator-hero-grid">
          <div>
            <h1>What is forgetting already costing your team?</h1>
            <p>
              Estimate your Saberra setup, monthly cost, and potential time savings from turning meetings and emails
              into human-reviewed organizational memory.
            </p>
            <div className="cta-row">
              <a
                className="btn btn-primary"
                href="#calculator"
                onClick={(event) => {
                  event.preventDefault();
                  goToStep(0);
                }}
              >
                Start the Calculator <ArrowRight size={16} aria-hidden="true" />
              </a>
              <Link className="btn btn-secondary" href="/demo/">
                Book a Saberra Demo
              </Link>
            </div>
            <p className="calculator-trust-line">
              Built for Google Workspace + Notion teams. Near-zero behavior change for the people doing the work.
            </p>
          </div>
          <div className="calculator-hero-panel" aria-hidden="true">
            <div className="calculator-mini-card active">Meetings and email</div>
            <div className="calculator-mini-line" />
            <div className="calculator-mini-card review">Human review checkpoint</div>
            <div className="calculator-mini-line" />
            <div className="calculator-mini-card answer">Ask Sera what you already know</div>
          </div>
        </div>
      </section>

      <section className="section tight" id="calculator" ref={calculatorRef}>
        <div className="container calculator-shell">
          <div className="calculator-workspace">
            <div className="calculator-progress" aria-label="Calculator progress">
              {steps.map((step, index) => (
                <button
                  key={step}
                  type="button"
                  className={index === activeStep ? "active" : index < activeStep ? "done" : ""}
                  onClick={() => goToStep(index)}
                >
                  <span>{index + 1}</span>
                  {step}
                </button>
              ))}
            </div>
            <CalculatorValueStrip />
            <CalculatorStep step={0} activeStep={activeStep}>
              <TeamProfileStep state={state} update={update} />
            </CalculatorStep>
            <CalculatorStep step={1} activeStep={activeStep}>
              <CurrentToolsStep state={state} update={update} />
            </CalculatorStep>
            <CalculatorStep step={2} activeStep={activeStep}>
              <WorkflowStep state={state} update={update} />
            </CalculatorStep>
            <CalculatorStep step={3} activeStep={activeStep}>
              <MemoryLeakStep state={state} update={update} />
            </CalculatorStep>
            <CalculatorStep step={4} activeStep={activeStep}>
              <PlanRecommendation state={state} />
            </CalculatorStep>
            <CalculatorStep step={5} activeStep={activeStep}>
              <RoiSummaryCard state={state} />
            </CalculatorStep>
            <div className="calculator-nav-row">
              <button
                className="btn btn-secondary"
                type="button"
                disabled={activeStep === 0}
                onClick={() => goToStep(activeStep - 1)}
              >
                Back
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => setState(defaultState)}>
                <RotateCcw size={16} aria-hidden="true" /> Reset
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => goToStep(activeStep + 1)}
              >
                {atResults ? "Review Results" : "Continue"} <ArrowRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>
          <LiveEstimate state={state} />
        </div>
        <div className="calculator-mobile-sticky">
          <div>
            <span>{formatMoney(calc.annualMemoryWasteCost)}</span>
            <small>estimated annual leak</small>
          </div>
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => goToStep(activeStep + 1)}
          >
            Continue
          </button>
        </div>
      </section>

      <section className="section tight">
        <div className="container">
          <CTASection state={state} />
          <div className="calculator-notes">
            <p>
              Calculator results are estimates and not a formal quote. Google Workspace and Notion subscription
              estimates use public USD annual-plan pricing as of {PRICING_AS_OF}; vendor pricing, taxes, discounts,
              exchange rates, billing terms, seat counts, and plan selection may change the final number.
            </p>
            <p>
              Saberra Core usually requires Google Workspace, a dedicated capture inbox, Notion Business, and one
              Memory Admin. Client-owned subscriptions are separate from Saberra service fees. If Saberra creates,
              migrates, provisions, configures, or administers Google Workspace or Notion accounts, that rollout work is
              scoped and compensated separately based on organization size, seat count, complexity, and implementation
              needs.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
