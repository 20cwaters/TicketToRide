import type { ReactNode } from 'react';

interface Props {
  onClose: () => void;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="font-display mb-1.5 text-base font-bold text-brass-400">{title}</h3>
      <div className="space-y-2 text-sm leading-relaxed text-parchment-200/85">
        {children}
      </div>
    </section>
  );
}

export default function RulesModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="panel flex max-h-[92vh] w-full max-w-lg flex-col rounded-b-none sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-3.5">
          <h2 className="font-display text-lg font-bold">How to play</h2>
          <button
            className="rounded p-1 text-parchment-200/50 hover:text-parchment-50"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="scrollbar-slim space-y-5 overflow-y-auto px-5 py-4">
          <Section title="The goal">
            <p>
              Score the most points by claiming train routes between cities,
              completing your destination tickets, and building the longest
              continuous path.
            </p>
          </Section>

          <Section title="On your turn — do ONE of these">
            <p>
              <strong>1. Draw 2 train cards</strong> — from the 5 face-up cards or
              blind from the deck. Exception: taking a face-up <em>locomotive</em>{' '}
              uses your whole turn (and you can't take one as your second card).
            </p>
            <p>
              <strong>2. Claim a route</strong> — tap a route on the map and pay a
              set of cards matching its color and length (e.g. a blue 3-route costs
              3 blue cards). <span className="text-parchment-200/60">Gray routes</span>{' '}
              accept any single color. Locomotives are wild and count as any color.
            </p>
            <p>
              <strong>3. Draw destination tickets</strong> — take 3 new tickets and
              keep at least 1. Only do this when you're confident: unfinished
              tickets subtract their points at the end!
            </p>
          </Section>

          <Section title="Destination tickets">
            <p>
              Each ticket names two cities and a point value. Connect them with an
              unbroken chain of <em>your own</em> routes to earn the points; fail
              and you lose the same amount. Your tickets are secret until the end.
            </p>
          </Section>

          <Section title="Routes & blocking">
            <p>
              A claimed route belongs to that player alone — claiming routes your
              opponents need is a big part of the game. Some city pairs have double
              routes: two players can each take one track, but in 2–3 player games
              only one of the two tracks may be used at all.
            </p>
            <p>
              Route points: 1&nbsp;car&nbsp;=&nbsp;1, 2&nbsp;=&nbsp;2, 3&nbsp;=&nbsp;4,
              4&nbsp;=&nbsp;7, 5&nbsp;=&nbsp;10, 6&nbsp;=&nbsp;15.
            </p>
          </Section>

          <Section title="End of the game">
            <p>
              You start with 45 plastic trains and spend one per route segment.
              When any player finishes a turn with 2 or fewer trains left, everyone
              (including them) gets one final turn.
            </p>
            <p>
              Then: route points + completed tickets − failed tickets, and the
              player(s) with the longest continuous path earn a 10-point bonus.
              Highest total wins!
            </p>
          </Section>

          <Section title="Reading the board">
            <p>
              • Colored slots are unclaimed routes (dashed outline = gray/any color).
              <br />• Solid train cars with a light border are claimed routes, in
              the owner's color.
              <br />• Red-ringed cities are the endpoints of your unfinished tickets.
            </p>
          </Section>
        </div>

        <div className="border-t border-ink-700 p-4">
          <button className="btn-primary w-full" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
