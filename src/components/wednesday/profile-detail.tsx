import type { Profile } from "@/types/profile";
import { Badge } from "@/components/ui/badge";
import { ProfilePhoto } from "@/components/wednesday/profile-photo";

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
export function ProfileDetail({
  profile,
  action,
}: {
  profile: Profile;
  action?: React.ReactNode;
}) {
  return (
    <article className="space-y-4">
      <div className="relative">
        <ProfilePhoto
          name={profile.name}
          src={profile.localPhotoUrl ?? profile.photoUrl}
          className="mx-auto aspect-[4/5] w-full max-w-[300px] rounded-[14px] border-4 border-card shadow-postcard"
        />
        <div className="mt-4 flex items-baseline gap-2">
          <h2 className="font-serif text-3xl text-primary">{profile.name},</h2>
          <span className="font-serif text-2xl text-primary/80">{profile.age}</span>
        </div>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">
          {profile.role} · {profile.city}
        </p>
        <p className="mt-3 font-hand text-2xl leading-snug text-foreground/80">“{profile.story}”</p>
        <div className="mt-3 text-sm text-muted-foreground">
          <p>Languages: <span className="font-semibold text-foreground">{profile.languages.join(", ")}</span></p>
          <p className="mt-1">Currently working on: <span className="font-semibold text-foreground">{profile.workingOn}</span></p>
        </div>
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
        <Row label="Cannabis" value={profile.cannabis} />
        <Row label="Fitness" value={profile.fitness} />
        <Row label="Weekends" value={profile.weekend.join(", ")} />
      </Section>

      <Section title="How they show up">
        <Row label="Communication" value={profile.communication} />
        <Row label="In conflict" value={profile.conflict} />
        <Row label="Wants from a partner" value={profile.partnerSupport} />
        <p className="pt-1 italic text-muted-foreground">“{profile.goodRelationship}”</p>
      </Section>

      <Section title="Personal priorities">
        <p className="text-sm leading-6">{profile.priorities?.map((p, i) => (
          <span key={i} className="block">• {p}</span>
        ))}</p>
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
          {profile.moments.map((m, i) => (
            <p key={i} className="font-hand text-xl text-foreground/80">“{m.caption}”</p>
          ))}
        </Section>
      ) : null}

      {action ? (
        <div className="pt-4">
          <div className="rounded-[14px] border-t border-border pt-4">{action}</div>
        </div>
      ) : null}
    </article>
  );
}
