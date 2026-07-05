import type { Profile } from "@/types/profile";
import { Badge } from "@/components/ui/badge";
import { ProfilePhoto } from "@/components/wednesday/profile-photo";
import { CancellationLines, Stamp } from "@/components/wednesday/stamp";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-dashed border-border pt-4">
      <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-accent">{title}</h3>
      <div className="mt-2 space-y-1.5 text-sm leading-6">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-semibold">{value}</span>
    </p>
  );
}

/** The full postcard-style profile, used in the rank dialog and match reveal. */
export function ProfileDetail({ profile }: { profile: Profile }) {
  return (
    <article className="space-y-4">
      <div className="paper-texture relative overflow-hidden rounded-[18px] border border-border bg-card p-4 shadow-postcard">
        <div className="absolute right-3 top-3 flex items-start gap-2">
          <CancellationLines className="mt-2" />
          <Stamp value="30" />
        </div>
        <ProfilePhoto
          name={profile.name}
          src={profile.localPhotoUrl ?? profile.photoUrl}
          className="h-64 w-full rounded-[12px] border-4 border-card shadow-sm"
        />
        <div className="mt-4 flex items-baseline gap-2">
          <h2 className="font-serif text-3xl text-primary">{profile.name},</h2>
          <span className="font-serif text-2xl text-primary/80">{profile.age}</span>
        </div>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          {profile.role} · {profile.city}
        </p>
        <p className="mt-3 font-hand text-2xl leading-snug text-foreground/80">“{profile.story}”</p>
      </div>

      <Section title="Looking for">
        <Row label="Intent" value={profile.intent} />
        <Row label="Timeline" value={profile.timeline} />
        <Row label="Children" value={profile.children} />
        <Row label="After marriage" value={profile.livingAfterMarriage} />
        <Row label="Moving" value={profile.relocation} />
      </Section>

      <Section title="Work & education">
        <Row label="Work" value={`${profile.role}, ${profile.industry}`} />
        <Row label="Rhythm" value={profile.workLife} />
        <Row label="Education" value={`${profile.qualification}, ${profile.college}`} />
        <Row label="Finances" value={`${profile.financialIndependence} · ${profile.lifestyleExpectation}`} />
      </Section>

      <Section title="Everyday life">
        <Row label="Food" value={profile.food} />
        <Row label="Drinking" value={profile.drinking} />
        <Row label="Smoking" value={profile.smoking} />
        <Row label="Fitness" value={profile.fitness} />
        <Row label="Weekends" value={profile.weekend.join(", ")} />
      </Section>

      <Section title="How they show up">
        <Row label="Communication" value={profile.communication} />
        <Row label="In conflict" value={profile.conflict} />
        <Row label="Wants from a partner" value={profile.partnerSupport} />
        <p className="pt-1 italic text-muted-foreground">“{profile.goodRelationship}”</p>
      </Section>

      <Section title="Things they enjoy">
        <div className="flex flex-wrap gap-1.5 pt-1">
          {profile.interests.map((interest) => (
            <Badge key={interest}>{interest}</Badge>
          ))}
        </div>
        <p className="pt-2">
          <span className="text-muted-foreground">Can talk for hours about: </span>
          <span className="font-semibold">{profile.talkForHours}</span>
        </p>
        <Row label="Watching" value={profile.favouriteShow} />
        <Row label="Listening to" value={profile.listeningTo} />
      </Section>

      {profile.moments.length > 0 ? (
        <Section title="A moment from their world">
          <p className="font-hand text-xl text-foreground/80">“{profile.moments[0].caption}”</p>
        </Section>
      ) : null}
    </article>
  );
}
