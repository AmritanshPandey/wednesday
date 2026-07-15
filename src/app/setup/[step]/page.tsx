"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  IconBrandInstagram,
  IconBrandLinkedin,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconCup,
  IconEye,
  IconHeart,
  IconMapPin,
  IconMountain,
  IconPhoto,
  IconPencil,
  IconPlus,
  IconX
} from "@tabler/icons-react";
import { cn } from "@/lib/utils/cn";
import { ChipMultiSelect, ChipSelect } from "@/components/ui/chip";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RangeSelector } from "@/components/ui/range-selector";
import { Textarea } from "@/components/ui/textarea";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Callout, FieldBlock, StepShell, SETUP_STEP_COUNT } from "@/components/setup/step-shell";
import { RubberStamp } from "@/components/wednesday/rubber-stamp";
import { reachSetupStep, toggleDealBreaker, updatePreferences, updateProfile, uploadProfilePhoto } from "@/lib/app/actions";
import { useDemoState } from "@/lib/app/store";
import type { Profile } from "@/types/profile";
import type { PreferenceSectionKey, Preferences } from "@/types/preferences";
import {
  CANNABIS,
  CHILDREN_VIEWS,
  CITIES,
  COMMUNICATION_STYLES,
  CONFLICT_STYLES,
  DRINKING,
  FINANCIAL_INDEPENDENCE,
  FITNESS,
  FOODS,
  GENDERS,
  INTENTS,
  INTERESTS,
  LANGUAGES,
  LIFESTYLE_EXPECTATIONS,
  LIVING_AFTER_MARRIAGE,
  PARTNER_SUPPORT,
  PARTNER_WITH_KIDS,
  PREF_CANNABIS,
  PREF_CHILDREN,
  PREF_CITY,
  PREF_DRINKING,
  PREF_FINANCE,
  PREF_FOOD,
  PREF_RELIGION,
  PREF_RELOCATION,
  PREF_SMOKING,
  PREF_TIMELINE,
  PRIORITIES,
  QUALIFICATIONS,
  RELIGIONS,
  RELOCATION,
  SMOKING,
  TAX_BRACKETS,
  TIMELINES,
  WEEKENDS,
  WORK_LIVES,
  WORK_STATUSES
} from "@/lib/profile-options";

const STEP_META: Record<number, { title: string; subtitle: string }> = {
  1: { title: "A little about you", subtitle: "A few details to help us find compatible people." },
  2: { title: "What you do", subtitle: "Share a little about your work and education." },
  3: { title: "What brings you here?", subtitle: "Help us introduce you to people who want something similar." },
  4: { title: "Financial outlook", subtitle: "Shared expectations matter for long-term compatibility. This is used privately, to improve introductions." },
  5: { title: "Your everyday life", subtitle: "The small day-to-day things matter too." },
  6: { title: "How you show up", subtitle: "Help people understand how you communicate, care, and handle real life together." },
  7: { title: "Looking ahead", subtitle: "Share the plans and possibilities that will shape your life together." },
  8: { title: "The things you enjoy", subtitle: "Add the little things that make you, you." },
  9: { title: "A little more of your world", subtitle: "Choose up to 3 visual prompts that feel like you." },
  10: { title: "Put a face to your profile", subtitle: "Add a few clear photos so people can get a real sense of you." },
  11: { title: "Verify it's really you", subtitle: "Link a social profile so our team can confirm you're a real person serious about meeting someone." },
  12: { title: "Who would you like to meet?", subtitle: "Set the things that matter most. You can change them anytime." }
};

const MIN_PROFILE_AGE = 18;
const MAX_PROFILE_AGE = 80;
const MIN_PREFERENCE_AGE = 22;
const MAX_PREFERENCE_AGE = 35;
const MAX_VISUAL_PROMPTS = 3;
const MAX_PROFILE_PHOTOS = 4;
const MOMENT_CONTEXT_LIMIT = 150;

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
}

function dateYearsAgo(years: number) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return toDateInputValue(date);
}

function birthDateFromAge(age: number) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - age);
  date.setMonth(0, 1);
  return toDateInputValue(date);
}

function calculateAge(dateOfBirth: string) {
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  if (!year || !month || !day) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const parsedDate = new Date(year, month - 1, day);
  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - year;
  const birthdayHasPassed =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);

  if (!birthdayHasPassed) age -= 1;
  return age >= 0 ? age : null;
}

function normalizeOption(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function cleanCustomInterest(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function ImageUploadSlot({
  src,
  label,
  onPreview,
  className,
  action = "add",
  slot = "main",
  framed = false
}: {
  src?: string;
  label: string;
  onPreview: (url: string) => void;
  className?: string;
  action?: "add" | "edit";
  slot?: string;
  /** Album treatment: photo corners once an image is mounted. */
  framed?: boolean;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Choose an image under 5 MB.");
      return;
    }

    // Show it instantly, then swap in the durable R2 URL once uploaded.
    onPreview(URL.createObjectURL(file));
    setError(null);
    setUploading(true);
    const url = await uploadProfilePhoto(file, slot);
    setUploading(false);
    if (url) onPreview(url);
  }

  return (
    <div>
      <label className="block">
        <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={onChange} />
        <span
          className={cn(
            "relative flex cursor-pointer items-center justify-center overflow-hidden rounded-[18px] border-2 bg-muted text-muted-foreground transition hover:bg-secondary",
            src ? "border-solid border-border" : "border-dashed border-primary",
            className
          )}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={label} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <IconPhoto className="h-9 w-9" stroke={1.8} />
          )}
          {framed && src ? (
            <>
              <span className="photo-corner left-1.5 top-1.5" />
              <span className="photo-corner right-1.5 top-1.5 rotate-90" />
              <span className="photo-corner bottom-1.5 left-1.5 -rotate-90" />
              <span className="photo-corner bottom-1.5 right-1.5 rotate-180" />
            </>
          ) : null}
          {uploading ? (
            <span className="absolute inset-0 flex items-center justify-center bg-foreground/30 text-xs font-bold text-card">
              Uploading…
            </span>
          ) : null}
          <span className="absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-postcard">
            {action === "edit" ? <IconPencil className="h-5 w-5" stroke={2.2} /> : <IconPlus className="h-7 w-7" stroke={2.2} />}
          </span>
        </span>
      </label>
      {error ? <p className="mt-2 text-xs font-semibold text-destructive">{error}</p> : null}
    </div>
  );
}

export default function SetupStepPage() {
  const params = useParams<{ step: string }>();
  const router = useRouter();
  const state = useDemoState();
  const step = Number(params.step);
  const profile = state.profile;
  const [customInterest, setCustomInterest] = React.useState("");
  const [activeMomentIndex, setActiveMomentIndex] = React.useState(0);
  const [showPhotoConfirm, setShowPhotoConfirm] = React.useState(false);
  const [linkedinInput, setLinkedinInput] = React.useState("");
  const [instagramInput, setInstagramInput] = React.useState("");
  const interestOptions = React.useMemo(() => {
    const base = new Set(INTERESTS.map(normalizeOption));
    const custom = profile.interests.filter((interest) => !base.has(normalizeOption(interest)));
    return [...INTERESTS, ...custom];
  }, [profile.interests]);

  React.useEffect(() => {
    if (!Number.isInteger(step) || step < 1 || step > SETUP_STEP_COUNT) router.replace("/setup/1");
  }, [step, router]);
  if (!Number.isInteger(step) || step < 1 || step > SETUP_STEP_COUNT) return null;

  const meta = STEP_META[step];
  const birthDateValue = profile.dateOfBirth ?? birthDateFromAge(profile.age);
  const ageFromBirthDate = calculateAge(birthDateValue);
  const hasValidBirthDate =
    ageFromBirthDate !== null && ageFromBirthDate >= MIN_PROFILE_AGE && ageFromBirthDate <= MAX_PROFILE_AGE;
  const shownAge = hasValidBirthDate ? ageFromBirthDate : profile.age;
  const minBirthDate = dateYearsAgo(MAX_PROFILE_AGE);
  const maxBirthDate = dateYearsAgo(MIN_PROFILE_AGE);
  const moments = profile.moments.length > 0 ? profile.moments : [{ title: "", caption: "" }];
  const activeMoment = Math.min(activeMomentIndex, moments.length - 1);
  const extraPhotoUrls = profile.extraPhotoUrls ?? [];

  function next() {
    reachSetupStep(step + 1);
    router.push(step === SETUP_STEP_COUNT ? "/setup/review" : `/setup/${step + 1}`);
  }

  const set = (patch: Partial<Profile>) => updateProfile(patch);
  const setBirthDate = (dateOfBirth: string) => {
    const age = calculateAge(dateOfBirth);
    set(age === null ? { dateOfBirth } : { dateOfBirth, age });
  };
  const toggleList = (key: "languages" | "weekend" | "priorities" | "interests") => (value: string) => {
    const current = profile[key];
    set({ [key]: current.includes(value) ? current.filter((item) => item !== value) : [...current, value] });
  };
  const addCustomInterest = () => {
    const nextInterest = cleanCustomInterest(customInterest);
    if (!nextInterest) return;

    const existing =
      interestOptions.find((interest) => normalizeOption(interest) === normalizeOption(nextInterest)) ?? nextInterest;
    if (!profile.interests.some((interest) => normalizeOption(interest) === normalizeOption(existing))) {
      set({ interests: [...profile.interests, existing] });
    }
    setCustomInterest("");
  };
  const updateMoment = (index: number, patch: Partial<Profile["moments"][number]>) => {
    const current = profile.moments.length > 0 ? profile.moments : [{ title: "", caption: "" }];
    const nextMoments = current.map((moment, itemIndex) => (itemIndex === index ? { ...moment, ...patch } : moment));
    set({ moments: nextMoments });
  };
  const addMoment = () => {
    const current = profile.moments.length > 0 ? profile.moments : [];
    if (current.length >= MAX_VISUAL_PROMPTS) return;
    set({ moments: [...current, { title: "", caption: "" }] });
    setActiveMomentIndex(current.length);
  };
  const setPhotoAt = (index: number, url: string) => {
    if (index === 0) {
      set({ localPhotoUrl: url });
      return;
    }

    const nextPhotos = [...extraPhotoUrls];
    nextPhotos[index - 1] = url;
    set({ extraPhotoUrls: nextPhotos });
  };

  const bothPhotosPresent = Boolean((profile.localPhotoUrl ?? profile.photoUrl) && extraPhotoUrls[0]);

  return (
    <StepShell
      step={step}
      title={meta.title}
      subtitle={meta.subtitle}
      onNext={step === 10 && bothPhotosPresent ? () => setShowPhotoConfirm(true) : next}
      onSecondary={step === 9 || step === 10 ? next : undefined}
      backHref={step === 1 ? "/" : `/setup/${step - 1}`}
      nextLabel={step === SETUP_STEP_COUNT ? "Review my profile" : step === 9 || step === 10 ? "Continue" : "Next"}
      secondaryLabel={step === 9 || step === 10 ? "Skip" : undefined}
      nextDisabled={step === 1 && (profile.name.trim().length === 0 || !hasValidBirthDate)}
      headerTitle={step === SETUP_STEP_COUNT ? "Compatibility" : "Profile setup"}
    >
      {step === 1 ? (
        <>
          <FieldBlock label="Your given name" help="Only your first name is shown.">
            <Input value={profile.name} onChange={(event) => set({ name: event.target.value })} />
          </FieldBlock>
          <FieldBlock label="Date of birth" help="Use your real date of birth. We will only show your age on your profile.">
            <DatePicker
              value={birthDateValue}
              min={minBirthDate}
              max={maxBirthDate}
              onChange={setBirthDate}
            />
          </FieldBlock>
          <Callout title={hasValidBirthDate ? `You're ${shownAge}` : "Enter a valid date of birth"}>
            Make sure your date of birth is correct before moving on.
          </Callout>
          <FieldBlock label="Your gender">
            <ChipSelect options={GENDERS} value={profile.gender} onChange={(value) => set({ gender: value })} />
          </FieldBlock>
          <FieldBlock label="City">
            <ChipSelect options={CITIES} value={profile.city} onChange={(value) => set({ city: value })} />
          </FieldBlock>
          <FieldBlock label="Religion">
            <ChipSelect options={RELIGIONS} value={profile.religion} onChange={(value) => set({ religion: value })} />
          </FieldBlock>
          <FieldBlock label="Languages you're comfortable in">
            <ChipMultiSelect options={LANGUAGES} values={profile.languages} onToggle={toggleList("languages")} />
          </FieldBlock>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <FieldBlock label="What best describes your work right now?">
            <ChipSelect options={WORK_STATUSES} value={profile.workStatus} onChange={(value) => set({ workStatus: value })} />
          </FieldBlock>
          <FieldBlock label="What's your current role?">
            <Input value={profile.role} onChange={(event) => set({ role: event.target.value })} />
          </FieldBlock>
          <FieldBlock label="Which industry do you work in?">
            <Input value={profile.industry} onChange={(event) => set({ industry: event.target.value })} />
          </FieldBlock>
          <FieldBlock label="What does your work life usually look like?">
            <ChipSelect options={WORK_LIVES} value={profile.workLife} onChange={(value) => set({ workLife: value })} />
          </FieldBlock>
          <FieldBlock label="Highest qualification">
            <ChipSelect options={QUALIFICATIONS} value={profile.qualification} onChange={(value) => set({ qualification: value })} />
          </FieldBlock>
          <FieldBlock label="College or university">
            <Input value={profile.college} onChange={(event) => set({ college: event.target.value })} />
          </FieldBlock>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <FieldBlock label="What are you looking for?">
            <div className="space-y-3">
              {INTENTS.map((intent) => {
                const selected = profile.intent === intent;
                return (
                  <button
                    key={intent}
                    type="button"
                    onClick={() => set({ intent })}
                    className={`flex w-full items-center gap-3 rounded-[16px] border px-4 py-4 text-left text-sm font-semibold transition ${
                      selected ? "border-primary bg-secondary" : "border-gold bg-card hover:bg-secondary/60"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        selected ? "border-primary" : "border-input"
                      }`}
                    >
                      {selected ? <span className="h-2.5 w-2.5 rounded-full bg-primary" /> : null}
                    </span>
                    {intent}
                  </button>
                );
              })}
            </div>
          </FieldBlock>
          <FieldBlock label="Marriage timeline">
            <ChipSelect options={TIMELINES} value={profile.timeline} onChange={(value) => set({ timeline: value })} />
          </FieldBlock>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <FieldBlock label="Current tax bracket" help="Never shown on your profile. Used only for compatibility.">
            <ChipSelect options={TAX_BRACKETS} value={profile.taxBracket} onChange={(value) => set({ taxBracket: value })} />
          </FieldBlock>
          <FieldBlock label="Financial independence">
            <ChipSelect
              options={FINANCIAL_INDEPENDENCE}
              value={profile.financialIndependence}
              onChange={(value) => set({ financialIndependence: value })}
            />
          </FieldBlock>
          <FieldBlock label="Lifestyle expectations">
            <ChipSelect
              options={LIFESTYLE_EXPECTATIONS}
              value={profile.lifestyleExpectation}
              onChange={(value) => set({ lifestyleExpectation: value })}
            />
          </FieldBlock>
        </>
      ) : null}

      {step === 5 ? (
        <>
          <FieldBlock label="Drinking">
            <ChipSelect options={DRINKING} value={profile.drinking} onChange={(value) => set({ drinking: value })} />
          </FieldBlock>
          <FieldBlock label="Smoking">
            <ChipSelect options={SMOKING} value={profile.smoking} onChange={(value) => set({ smoking: value })} />
          </FieldBlock>
          <FieldBlock label="Cannabis">
            <ChipSelect options={CANNABIS} value={profile.cannabis} onChange={(value) => set({ cannabis: value })} />
          </FieldBlock>
          <FieldBlock label="Food preference">
            <ChipSelect options={FOODS} value={profile.food} onChange={(value) => set({ food: value })} />
          </FieldBlock>
          <FieldBlock label="What does your ideal weekend usually look like?">
            <ChipMultiSelect options={WEEKENDS} values={profile.weekend} onToggle={toggleList("weekend")} />
          </FieldBlock>
          <FieldBlock label="How does fitness fit into your life?">
            <ChipSelect options={FITNESS} value={profile.fitness} onChange={(value) => set({ fitness: value })} />
          </FieldBlock>
        </>
      ) : null}

      {step === 6 ? (
        <>
          <FieldBlock label="How do you naturally show up?">
            <ChipSelect
              options={COMMUNICATION_STYLES}
              value={profile.communication}
              onChange={(value) => set({ communication: value })}
            />
          </FieldBlock>
          <FieldBlock label="When something feels off, what do you usually do?">
            <ChipSelect options={CONFLICT_STYLES} value={profile.conflict} onChange={(value) => set({ conflict: value })} />
          </FieldBlock>
          <FieldBlock label="What you appreciate most from a partner">
            <ChipSelect options={PARTNER_SUPPORT} value={profile.partnerSupport} onChange={(value) => set({ partnerSupport: value })} />
          </FieldBlock>
          <FieldBlock label="What does a good relationship feel like to you?">
            <Textarea value={profile.goodRelationship} onChange={(event) => set({ goodRelationship: event.target.value })} />
          </FieldBlock>
          <FieldBlock label="What are you working on in yourself right now?">
            <Textarea value={profile.workingOn} onChange={(event) => set({ workingOn: event.target.value })} />
          </FieldBlock>
        </>
      ) : null}

      {step === 7 ? (
        <>
          <FieldBlock label="How do you feel about having children?">
            <ChipSelect options={CHILDREN_VIEWS} value={profile.children} onChange={(value) => set({ children: value })} />
          </FieldBlock>
          <FieldBlock label="Would you be open to a partner who already has children?">
            <ChipSelect options={PARTNER_WITH_KIDS} value={profile.partnerWithKids} onChange={(value) => set({ partnerWithKids: value })} />
          </FieldBlock>
          <FieldBlock label="What kind of living arrangement do you imagine after marriage?">
            <ChipSelect
              options={LIVING_AFTER_MARRIAGE}
              value={profile.livingAfterMarriage}
              onChange={(value) => set({ livingAfterMarriage: value })}
            />
          </FieldBlock>
          <FieldBlock label="Where are you open to moving?">
            <ChipSelect options={RELOCATION} value={profile.relocation} onChange={(value) => set({ relocation: value })} />
          </FieldBlock>
          <FieldBlock label="What feels most important in the next few years?" help="Pick up to three.">
            <ChipMultiSelect options={PRIORITIES} values={profile.priorities} onToggle={toggleList("priorities")} />
          </FieldBlock>
        </>
      ) : null}

      {step === 8 ? (
        <>
          <FieldBlock label="What do you enjoy doing?" help="Pick at least three.">
            <div className="space-y-4">
              <ChipMultiSelect options={interestOptions} values={profile.interests} onToggle={toggleList("interests")} />
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={customInterest}
                  onChange={(event) => setCustomInterest(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCustomInterest();
                    }
                  }}
                  placeholder="Add your own"
                  aria-label="Add your own interest"
                />
                <button
                  type="button"
                  onClick={addCustomInterest}
                  disabled={cleanCustomInterest(customInterest).length === 0}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <IconPlus className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>
          </FieldBlock>
          <FieldBlock label="What's a show or movie you always go back to?">
            <Input value={profile.favouriteShow} onChange={(event) => set({ favouriteShow: event.target.value })} />
          </FieldBlock>
          <FieldBlock label="What are you listening to lately?">
            <Input value={profile.listeningTo} onChange={(event) => set({ listeningTo: event.target.value })} />
          </FieldBlock>
          <FieldBlock label="What can you talk about for hours?">
            <Input value={profile.talkForHours} onChange={(event) => set({ talkForHours: event.target.value })} />
          </FieldBlock>
        </>
      ) : null}

      {step === 9 ? (
        <>
          <div>
            <p className="mb-2.5 text-[15px] font-bold text-foreground">Add a moment</p>
            <ImageUploadSlot
              src={moments[activeMoment]?.imageUrl}
              label={`Visual prompt ${activeMoment + 1}`}
              className="aspect-[1.75]"
              slot={`moment-${activeMoment}`}
              onPreview={(url) => updateMoment(activeMoment, { imageUrl: url })}
            />
          </div>

          {moments.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {moments.map((moment, index) => (
                <button
                  key={`${moment.title ?? "moment"}-${index}`}
                  type="button"
                  onClick={() => setActiveMomentIndex(index)}
                  className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                    activeMoment === index ? "border-primary bg-primary text-primary-foreground" : "border-gold bg-card hover:bg-secondary"
                  }`}
                >
                  Moment {index + 1}
                </button>
              ))}
            </div>
          ) : null}

          <FieldBlock label="Prompt title" help="Give this moment a title">
            <Input
              value={moments[activeMoment]?.title ?? ""}
              onChange={(event) => updateMoment(activeMoment, { title: event.target.value })}
              placeholder="e.g. My kind of weekend"
            />
          </FieldBlock>

          <FieldBlock label="Add a little context to this photo">
            <Textarea
              value={moments[activeMoment]?.caption ?? ""}
              maxLength={MOMENT_CONTEXT_LIMIT}
              onChange={(event) => updateMoment(activeMoment, { caption: event.target.value })}
              className="min-h-40"
            />
            <p className="mt-2 text-right text-xs font-bold text-muted-foreground">
              {(moments[activeMoment]?.caption ?? "").length}/{MOMENT_CONTEXT_LIMIT}
            </p>
          </FieldBlock>

          <button
            type="button"
            onClick={addMoment}
            disabled={moments.length >= MAX_VISUAL_PROMPTS}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-full border border-primary text-base font-bold text-primary transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
          >
            <IconPlus className="h-5 w-5" stroke={2.2} />
            Add another prompt
          </button>
        </>
      ) : null}

      {step === 10 ? (
        <>
          <Callout title="Photo requirements">
            <ul className="space-y-1 font-semibold text-primary">
              <li>One headshot, one full photo (about knees up)</li>
              <li>Face the camera, in simple backgrounds and good lighting</li>
              <li>No sunglasses, hats, or anything obscuring your face</li>
              <li>No heavy filters, black &amp; white photos, or group shots</li>
            </ul>
          </Callout>

          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: MAX_PROFILE_PHOTOS }, (_, index) => {
              const src = index === 0 ? profile.localPhotoUrl ?? profile.photoUrl : extraPhotoUrls[index - 1];
              const label = index === 0 ? "Headshot" : index === 1 ? "Full Photo" : `Additional photo ${index}`;
              const subtitle =
                index === 0 ? "Just your face and shoulders" : index === 1 ? "From about the knees up" : "Optional";
              return (
                <div key={index}>
                  <p className="mb-0.5 font-serif text-lg text-foreground">{label}</p>
                  <p className="mb-2.5 text-xs leading-5 text-muted-foreground">{subtitle}</p>
                  <ImageUploadSlot
                    src={src}
                    label={label}
                    action={src ? "edit" : "add"}
                    className="aspect-[0.86]"
                    slot={index === 0 ? "headshot" : `full-photo-${index}`}
                    onPreview={(url) => setPhotoAt(index, url)}
                    framed
                  />
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {step === 11 ? (
        <SocialsStep
          linkedinInput={linkedinInput}
          instagramInput={instagramInput}
          onLinkedinInputChange={setLinkedinInput}
          onInstagramInputChange={setInstagramInput}
          linkedinHandle={profile.linkedinHandle ?? ""}
          instagramHandle={profile.instagramHandle ?? ""}
          onAddLinkedin={() => {
            const value = linkedinInput.trim();
            if (!value) return;
            set({ linkedinHandle: value });
            setLinkedinInput("");
          }}
          onAddInstagram={() => {
            const value = instagramInput.trim();
            if (!value) return;
            set({ instagramHandle: value });
            setInstagramInput("");
          }}
        />
      ) : null}

      {step === 12 ? <CompatibilityStep /> : null}

      <Dialog
        open={showPhotoConfirm}
        onOpenChange={setShowPhotoConfirm}
        title="Before you submit your photos"
        description="Every photo is reviewed by our team. These will delay your application:"
      >
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border-[1.5px] border-primary/30 text-primary">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-primary/40">
            <IconEye className="h-5 w-5" stroke={1.8} />
          </span>
        </span>
        <ul className="space-y-3">
          {[
            "Wearing sunglasses or a hat",
            "Not looking at the camera in your headshot",
            "Phone or object covering your face",
            "Black & white or heavy filters"
          ].map((mistake) => (
            <li key={mistake} className="flex items-center gap-3 text-sm font-semibold text-foreground">
              <IconX className="h-4 w-4 shrink-0 text-destructive" stroke={2.5} />
              {mistake}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-center font-serif text-sm italic text-muted-foreground">
          A quick check now saves you from resubmitting later.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setShowPhotoConfirm(false)}
            className="flex h-12 items-center justify-center rounded-full border border-gold bg-card text-sm font-bold text-foreground transition hover:bg-secondary"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={() => {
              setShowPhotoConfirm(false);
              next();
            }}
            className="flex h-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
          >
            Submit photos
          </button>
        </div>
      </Dialog>
    </StepShell>
  );
}

// ---- Socials verification ---------------------------------------------

function SocialsStep({
  linkedinInput,
  instagramInput,
  onLinkedinInputChange,
  onInstagramInputChange,
  linkedinHandle,
  instagramHandle,
  onAddLinkedin,
  onAddInstagram
}: {
  linkedinInput: string;
  instagramInput: string;
  onLinkedinInputChange: (value: string) => void;
  onInstagramInputChange: (value: string) => void;
  linkedinHandle: string;
  instagramHandle: string;
  onAddLinkedin: () => void;
  onAddInstagram: () => void;
}) {
  return (
    <>
      <Callout>
        To help keep our members safe from fake or duplicate accounts, we ask every member to link at least one
        social profile as part of onboarding. This helps our team verify that you are a real person who is serious
        about meeting someone.
      </Callout>

      <SocialCard
        icon={<IconBrandLinkedin className="h-5 w-5 text-[#0A66C2]" stroke={1.9} />}
        name="LinkedIn"
        description="Your study or career path."
        placeholder="Paste URL or type username"
        value={linkedinInput}
        onValueChange={onLinkedinInputChange}
        onAdd={onAddLinkedin}
        savedHandle={linkedinHandle}
      />

      <SocialCard
        icon={<IconBrandInstagram className="h-5 w-5 text-[#C1358F]" stroke={1.9} />}
        name="Instagram"
        description="Your Instagram handle."
        placeholder="@ yourhandle"
        value={instagramInput}
        onValueChange={onInstagramInputChange}
        onAdd={onAddInstagram}
        savedHandle={instagramHandle}
      />

      <p className="text-center font-serif text-sm italic leading-6 text-muted-foreground">
        We review every application individually. You will receive a note once your profile is approved.
      </p>
    </>
  );
}

function SocialCard({
  icon,
  name,
  description,
  placeholder,
  value,
  onValueChange,
  onAdd,
  savedHandle
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  onAdd: () => void;
  savedHandle: string;
}) {
  return (
    <div className="paper-texture rounded-[18px] border border-border p-5 shadow-sm">
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-border bg-card shadow-sm">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-serif text-xl leading-tight text-foreground">{name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <Input value={value} onChange={(event) => onValueChange(event.target.value)} placeholder={placeholder} />
        <button
          type="button"
          onClick={onAdd}
          disabled={value.trim().length === 0}
          className="flex h-12 shrink-0 items-center justify-center rounded-full bg-primary px-7 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Add
        </button>
      </div>
      {savedHandle ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-[12px] bg-secondary/60 py-2 pl-4 pr-3">
          <span className="handwritten min-w-0 truncate text-xl text-primary">{savedHandle}</span>
          <RubberStamp>Received</RubberStamp>
        </div>
      ) : null}
    </div>
  );
}

// ---- Partner preferences with deal-breaker toggles -------------------

function PreferenceSection({
  title,
  section,
  children
}: {
  title: string;
  section: PreferenceSectionKey;
  children: React.ReactNode;
}) {
  const state = useDemoState();
  const isDealBreaker = state.preferences.dealBreakers[section];
  return (
    <section
      className={`paper-texture rounded-[18px] border p-4 shadow-sm transition ${isDealBreaker ? "border-primary/50" : "border-border"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] font-bold">{title}</p>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-bold uppercase tracking-wide ${isDealBreaker ? "text-primary" : "text-muted-foreground"}`}>
            Deal-breaker
          </span>
          <ToggleSwitch checked={isDealBreaker} onChange={() => toggleDealBreaker(section)} label={`${title} deal-breaker`} />
        </div>
      </div>
      <div className="mt-3">{children}</div>
      {isDealBreaker ? (
        <p className="mt-3 text-xs font-semibold text-primary">We will never introduce someone who doesn't meet this.</p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">A preference, not a filter — we will weigh it, not enforce it.</p>
      )}
    </section>
  );
}

function renderPreferenceSection(section: PreferenceSectionKey, prefs: Preferences) {
  switch (section) {
    case "age":
      return (
        <PreferenceSection title="Age range" section="age">
          <RangeSelector
            min={MIN_PREFERENCE_AGE}
            max={MAX_PREFERENCE_AGE}
            value={{ min: prefs.ageMin, max: prefs.ageMax }}
            onChange={(value) => updatePreferences({ ageMin: value.min, ageMax: value.max })}
          />
        </PreferenceSection>
      );
    case "city":
      return (
        <PreferenceSection title="Where they live" section="city">
          <ChipSelect options={PREF_CITY} value={prefs.cityPref} onChange={(value) => updatePreferences({ cityPref: value })} />
        </PreferenceSection>
      );
    case "religion":
      return (
        <PreferenceSection title="Cultural or religious preference" section="religion">
          <ChipSelect
            options={PREF_RELIGION}
            value={prefs.religionPref}
            onChange={(value) => updatePreferences({ religionPref: value })}
          />
        </PreferenceSection>
      );
    case "timeline":
      return (
        <PreferenceSection title="Marriage timeline" section="timeline">
          <ChipSelect
            options={PREF_TIMELINE}
            value={prefs.timelinePref}
            onChange={(value) => updatePreferences({ timelinePref: value })}
          />
        </PreferenceSection>
      );
    case "children":
      return (
        <PreferenceSection title="Views on children" section="children">
          <ChipSelect
            options={PREF_CHILDREN}
            value={prefs.childrenPref}
            onChange={(value) => updatePreferences({ childrenPref: value })}
          />
        </PreferenceSection>
      );
    case "relocation":
      return (
        <PreferenceSection title="Future location plans" section="relocation">
          <ChipSelect
            options={PREF_RELOCATION}
            value={prefs.relocationPref}
            onChange={(value) => updatePreferences({ relocationPref: value })}
          />
        </PreferenceSection>
      );
    case "finance":
      return (
        <PreferenceSection title="Financial outlook" section="finance">
          <ChipSelect
            options={PREF_FINANCE}
            value={prefs.financePref}
            onChange={(value) => updatePreferences({ financePref: value })}
          />
        </PreferenceSection>
      );
    case "smoking":
      return (
        <PreferenceSection title="Smoking" section="smoking">
          <ChipSelect
            options={PREF_SMOKING}
            value={prefs.smokingPref}
            onChange={(value) => updatePreferences({ smokingPref: value })}
          />
        </PreferenceSection>
      );
    case "drinking":
      return (
        <PreferenceSection title="Drinking" section="drinking">
          <ChipSelect
            options={PREF_DRINKING}
            value={prefs.drinkingPref}
            onChange={(value) => updatePreferences({ drinkingPref: value })}
          />
        </PreferenceSection>
      );
    case "cannabis":
      return (
        <PreferenceSection title="Cannabis" section="cannabis">
          <ChipSelect
            options={PREF_CANNABIS}
            value={prefs.cannabisPref}
            onChange={(value) => updatePreferences({ cannabisPref: value })}
          />
        </PreferenceSection>
      );
    case "food":
      return (
        <PreferenceSection title="Food" section="food">
          <ChipSelect options={PREF_FOOD} value={prefs.foodPref} onChange={(value) => updatePreferences({ foodPref: value })} />
        </PreferenceSection>
      );
    default:
      return null;
  }
}

type CompatibilityCategoryId = "basics" | "roots" | "family" | "everyday";

const COMPATIBILITY_CATEGORIES: {
  id: CompatibilityCategoryId;
  label: string;
  subtitle: string;
  icon: typeof IconMapPin;
  minutes: number;
  sections: PreferenceSectionKey[];
}[] = [
  {
    id: "basics",
    label: "The Basics",
    subtitle: "Age and where they live",
    icon: IconMapPin,
    minutes: 1,
    sections: ["age", "city"]
  },
  {
    id: "roots",
    label: "Roots & Values",
    subtitle: "What grounds you",
    icon: IconHeart,
    minutes: 1,
    sections: ["religion", "finance"]
  },
  {
    id: "family",
    label: "Family & Future",
    subtitle: "Where you're both heading",
    icon: IconMountain,
    minutes: 2,
    sections: ["timeline", "children", "relocation"]
  },
  {
    id: "everyday",
    label: "Everyday Life",
    subtitle: "How you live day-to-day",
    icon: IconCup,
    minutes: 2,
    sections: ["smoking", "drinking", "cannabis", "food"]
  }
];

function CompatibilityStep() {
  const state = useDemoState();
  const prefs = state.preferences;
  const [activeCategory, setActiveCategory] = React.useState<CompatibilityCategoryId | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = React.useState(0);
  const [visitedSections, setVisitedSections] = React.useState<Set<PreferenceSectionKey>>(new Set());

  const category = COMPATIBILITY_CATEGORIES.find((item) => item.id === activeCategory) ?? null;

  if (!category) {
    return (
      <>
        <p className="font-serif text-sm italic leading-6 text-muted-foreground">
          Your answers shape who we introduce you to. You can complete sections in any order.
        </p>
        {COMPATIBILITY_CATEGORIES.map((item) => {
          const done = item.sections.every((section) => visitedSections.has(section));
          const Icon = item.icon;
          return (
            <div key={item.id} className="paper-texture relative rounded-[18px] border border-border p-5 shadow-sm">
              {done ? <RubberStamp className="absolute right-4 top-4">Done</RubberStamp> : null}
              <span className="flex h-12 w-12 items-center justify-center rounded-full border-[1.5px] border-primary/30 text-primary">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-primary/40">
                  <Icon className="h-4.5 w-4.5" stroke={1.7} />
                </span>
              </span>
              <p className="letterpress mt-3.5 font-serif text-[22px] leading-tight text-foreground">{item.label}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.subtitle}</p>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                <IconClock className="h-3.5 w-3.5" stroke={2.2} />
                {item.sections.length} questions · ~{item.minutes} min
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory(item.id);
                  setActiveQuestionIndex(0);
                }}
                className={cn(
                  "mt-4 flex h-12 w-full items-center justify-center rounded-full text-sm font-bold transition",
                  done
                    ? "border border-gold bg-card text-foreground hover:bg-secondary"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                {done ? "Revisit" : "Start"}
              </button>
            </div>
          );
        })}
      </>
    );
  }

  const section = category.sections[activeQuestionIndex];
  const isLastQuestion = activeQuestionIndex === category.sections.length - 1;

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary">{category.label}</p>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Question {activeQuestionIndex + 1} of {category.sections.length}
        </p>
      </div>
      <div className="flex gap-1.5">
        {category.sections.map((_, index) => (
          <span
            key={index}
            className={cn("h-1.5 flex-1 rounded-full", index <= activeQuestionIndex ? "bg-primary" : "bg-muted")}
          />
        ))}
      </div>

      {renderPreferenceSection(section, prefs)}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            if (activeQuestionIndex === 0) setActiveCategory(null);
            else setActiveQuestionIndex((index) => index - 1);
          }}
          className="flex h-12 items-center justify-center gap-1.5 rounded-full border border-input text-sm font-bold text-foreground transition hover:bg-secondary"
        >
          <IconChevronLeft className="h-4 w-4" stroke={2.4} />
          {activeQuestionIndex === 0 ? "Back" : "Previous"}
        </button>
        <button
          type="button"
          onClick={() => {
            setVisitedSections((prev) => new Set(prev).add(section));
            if (isLastQuestion) setActiveCategory(null);
            else setActiveQuestionIndex((index) => index + 1);
          }}
          className="flex h-12 items-center justify-center gap-1.5 rounded-full bg-primary text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
        >
          {isLastQuestion ? "Finish" : "Next"}
          <IconChevronRight className="h-4 w-4" stroke={2.4} />
        </button>
      </div>
    </>
  );
}
