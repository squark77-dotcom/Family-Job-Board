import { useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import {
  Bone, Flame, Clock, Cat, Dog, Star, Skull, CheckSquare, Square,
  ChefHat, CalendarDays, Users, Heart, Zap, AlertTriangle
} from 'lucide-react';

const RECIPES = [
  {
    id: 1, name: "Sloppy Kibble Casserole", species: "dog", time: "12 min",
    chaos: 2, fav: true, tag: "WEEKNIGHT SLOP",
    blurb: "Three ingredients. Zero dignity. Your dog will scream-wag through the whole thing.",
    ingredients: ["1 cup kibble (the good stuff)", "2 tbsp pumpkin purée", "1 sad spoonful of plain yogurt"],
  },
  {
    id: 2, name: "Tuna Riot Bowl", species: "cat", time: "6 min",
    chaos: 4, fav: false, tag: "CAT APPROVED-ISH",
    blurb: "Warning: your cat will yell at you the entire prep time. That's the recipe working.",
    ingredients: ["½ can tuna in water", "1 quail egg, cracked with attitude", "pinch of dried bonito flakes"],
  },
  {
    id: 3, name: "Birthday Mud Cake (No Mud)", species: "dog", time: "35 min",
    chaos: 5, fav: true, tag: "PARTY ANIMAL",
    blurb: "Peanut butter, banana, oat flour. Frosted with greek yogurt. Decorated with one (1) bone.",
    ingredients: ["1 ripe banana, mashed angrily", "½ cup oat flour", "2 tbsp peanut butter (xylitol-free!!)", "greek yogurt 'frosting'"],
  },
  {
    id: 4, name: "Frozen Goblin Pops", species: "both", time: "4 hrs (freezer does the work)",
    chaos: 1, fav: false, tag: "SUMMER SURVIVAL",
    blurb: "Bone broth ice cubes with a blueberry trapped inside like a tiny treasure. Pets lose their minds.",
    ingredients: ["low-sodium bone broth", "blueberries", "an ice tray you'll never get back"],
  },
];

const PLAN = [
  { day: "MON", meal: "Sloppy Kibble Casserole", note: "double batch — Tuesday-you will be grateful" },
  { day: "TUE", meal: "Leftover casserole", note: "told you" },
  { day: "WED", meal: "Tuna Riot Bowl", note: "wear ear protection" },
  { day: "THU", meal: "Frozen Goblin Pops + kibble", note: "lazy day. allowed." },
  { day: "FRI", meal: "Tuna Riot Bowl, round two", note: "cat demanded it in writing" },
  { day: "SAT", meal: "Birthday Mud Cake", note: "it's nobody's birthday. who cares." },
  { day: "SUN", meal: "Goblin Pops + belly rubs", note: "rest day for the chef" },
];

const CREW = [
  {
    name: "Marisol Vega", role: "Chief Slop Officer", img: "photo-1438761681033-6461ffad8d80",
    bio: "Former line cook at a real restaurant. Now plates raw beef hearts for a chihuahua named Diablo. Says it's a lateral move.",
    pet: "Diablo, 4 lbs of menace",
  },
  {
    name: "Theo Okafor", role: "Director of Treat Science", img: "photo-1507003211169-0a1dd7228f2d",
    bio: "Has a chemistry degree and uses it exclusively to figure out why cats hate Tuesdays. No conclusions yet.",
    pet: "Professor Wiggles (cat, tenured)",
  },
  {
    name: "June Park", role: "Taste Tester Wrangler", img: "photo-1544723795-3fb6469f5b39",
    bio: "Manages a focus group of 11 dogs and 3 extremely unimpressed cats. Owns more lint rollers than shirts.",
    pet: "Beans, Toast & Gravy (the dogs)",
  },
  {
    name: "Rocco DiMarco", role: "Vice President of Vibes", img: "photo-1500648767791-00dcc994a43e",
    bio: "Wrote every label on this site. Banned from using the word 'nourish'. Used it twice anyway. We're watching him.",
    pet: "A goldfish he insists counts",
  },
];

const TornDivider = ({ flip = false, color = "#181410" }) => (
  <div
    aria-hidden
    className="w-full h-[18px]"
    style={{
      background: color,
      clipPath: flip
        ? "polygon(0 100%, 4% 30%, 9% 80%, 15% 20%, 21% 70%, 28% 35%, 34% 85%, 41% 25%, 48% 65%, 55% 15%, 62% 75%, 69% 30%, 76% 80%, 83% 20%, 90% 60%, 96% 25%, 100% 100%)"
        : "polygon(0 0, 4% 70%, 9% 20%, 15% 80%, 21% 30%, 28% 65%, 34% 15%, 41% 75%, 48% 35%, 55% 85%, 62% 25%, 69% 70%, 76% 20%, 83% 80%, 90% 40%, 96% 75%, 100% 0)",
    }}
  />
);

const ChaosMeter = ({ level }) => (
  <div className="flex items-center gap-[2px]">
    {[1, 2, 3, 4, 5].map((n) => (
      <Flame
        key={n}
        size={14}
        strokeWidth={2.5}
        className={n <= level ? "text-[#d62411] fill-[#d62411]" : "text-[#181410]/25"}
      />
    ))}
  </div>
);

export default function App() {
  const [tab, setTab] = useState("recipes");
  const [favs, setFavs] = useState(RECIPES.filter(r => r.fav).map(r => r.id));
  const [done, setDone] = useState([0, 1]);
  const [openRecipe, setOpenRecipe] = useState(1);
  const [hovering, setHovering] = useState(false);

  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);
  const sx = useSpring(mx, { stiffness: 400, damping: 28 });
  const sy = useSpring(my, { stiffness: 400, damping: 28 });
  const trailX = useSpring(mx, { stiffness: 90, damping: 18 });
  const trailY = useSpring(my, { stiffness: 90, damping: 18 });

  useEffect(() => {
    const move = (e) => { mx.set(e.clientX); my.set(e.clientY); };
    const over = (e) => {
      setHovering(!!e.target.closest("button, a, [data-hover]"));
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseover", over); };
  }, [mx, my]);

  const toggleFav = (id) => setFavs(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
  const toggleDone = (i) => setDone(d => d.includes(i) ? d.filter(x => x !== i) : [...d, i]);

  const tabs = [
    { id: "recipes", label: "The Slop", icon: ChefHat },
    { id: "plan", label: "Week of Chaos", icon: CalendarDays },
    { id: "crew", label: "The Goblins", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#e8e0cc] text-[#181410] relative overflow-x-hidden" style={{ cursor: "none", fontFamily: "'Archivo', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Rock+Salt&family=Archivo:wght@400;500;700;900&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{ __html: `
        * { cursor: none !important; }
        .marker { font-family: 'Permanent Marker', cursive; }
        .scrawl { font-family: 'Rock Salt', cursive; }
        .grain::before {
          content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 5; opacity: .55;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.18'/%3E%3C/svg%3E");
        }
        .tape {
          position: absolute; width: 90px; height: 26px; background: rgba(232, 169, 18, 0.72);
          box-shadow: 0 1px 3px rgba(0,0,0,.2); mix-blend-mode: multiply;
          clip-path: polygon(2% 8%, 98% 0, 100% 90%, 4% 100%);
        }
        .torn-card {
          clip-path: polygon(0% 2%, 3% 0%, 97% 1%, 100% 4%, 99% 96%, 96% 100%, 4% 99%, 0% 95%);
        }
        .sticker-wobble:hover { transform: rotate(-2deg) scale(1.02); }
        .strike { text-decoration: line-through; text-decoration-thickness: 3px; text-decoration-color: #d62411; }
        ::selection { background: #d62411; color: #e8e0cc; }
      `}} />

      <div className="grain" />

      {/* custom cursor */}
      <motion.div className="fixed z-[100] pointer-events-none" style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}>
        <motion.div animate={{ scale: hovering ? 1.6 : 1, rotate: hovering ? -25 : 12 }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
          <Bone size={26} className="text-[#181410] fill-[#e8a912]" strokeWidth={2.5} />
        </motion.div>
      </motion.div>
      <motion.div className="fixed z-[99] pointer-events-none w-10 h-10 rounded-full border-2 border-dashed border-[#d62411]/60"
        style={{ x: trailX, y: trailY, translateX: "-50%", translateY: "-50%" }} />

      {/* ===== HEADER ===== */}
      <header className="bg-[#181410] text-[#e8e0cc] relative">
        <div className="max-w-[640px] mx-auto px-6 pt-10 pb-12 relative">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 -rotate-2">
              <div className="bg-[#d62411] p-1.5 rotate-6"><Dog size={18} strokeWidth={2.5} /></div>
              <span className="marker text-xl tracking-wide">GRUBBY PAWS</span>
            </div>
            <span className="scrawl text-[10px] text-[#e8a912] rotate-2">est. in someone's garage, 1996</span>
          </div>

          <h1 className="marker text-[52px] leading-[0.95] mb-4">
            THE <span className="text-[#e8a912]">CHAOS</span><br />
            KITCHEN <span className="text-[#d62411]">COOKBOOK</span>
          </h1>

          <p className="text-[15px] leading-relaxed text-[#e8e0cc]/80 max-w-[480px] font-medium">
            Recipes, meal plans, and the unhinged humans who make them. We feed pets like
            they're tiny food critics with zero table manners — because they are.
          </p>

          <div className="absolute top-6 right-6 rotate-12 bg-[#e8a912] text-[#181410] px-3 py-1.5 marker text-xs torn-card hidden sm:block">
            VET-CHECKED. CAT-DISRESPECTED.
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            {["#noKibbleShame", "#sloppyButSafe", "#90sDogcore"].map((t, i) => (
              <span key={t} className={`text-[11px] font-bold px-2.5 py-1 border-2 border-[#e8e0cc]/40 ${i === 1 ? "rotate-1" : "-rotate-1"}`}>{t}</span>
            ))}
          </div>
        </div>
        <TornDivider flip color="#181410" />
      </header>

      {/* ===== TABS ===== */}
      <main className="max-w-[640px] mx-auto px-6 pb-24 -mt-2 relative z-10">
        <nav className="flex gap-2 mt-8 mb-8">
          {tabs.map((t, i) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 px-2 marker text-sm transition-all duration-150 torn-card border-2
                  ${active ? "bg-[#d62411] text-[#e8e0cc] border-[#181410] -rotate-1 shadow-[4px_4px_0_#181410]" : "bg-[#dcd2b8] border-[#181410]/30 hover:bg-[#e8a912] hover:border-[#181410] " + (i % 2 ? "rotate-1" : "-rotate-1")}`}
              >
                <Icon size={15} strokeWidth={2.5} />
                {t.label}
              </button>
            );
          })}
        </nav>

        <AnimatePresence mode="wait">
          {/* ===== RECIPES ===== */}
          {tab === "recipes" && (
            <motion.section key="recipes" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <div className="flex items-baseline justify-between mb-5">
                <h2 className="scrawl text-lg">today's specials ↓</h2>
                <span className="text-xs font-bold text-[#181410]/60">{RECIPES.length} recipes · {favs.length} favorited</span>
              </div>

              <div className="space-y-5">
                {RECIPES.map((r, i) => {
                  const open = openRecipe === r.id;
                  return (
                    <article key={r.id} className={`relative bg-[#f4eedb] torn-card border-2 border-[#181410] shadow-[5px_5px_0_rgba(24,20,16,0.85)] transition-transform duration-150 sticker-wobble ${i % 2 ? "rotate-[0.6deg]" : "-rotate-[0.6deg]"}`}>
                      <div className="tape" style={{ top: -10, left: i % 2 ? "65%" : "8%", transform: `rotate(${i % 2 ? 4 : -5}deg)` }} />
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="inline-block bg-[#181410] text-[#e8a912] text-[10px] font-black tracking-widest px-2 py-0.5 mb-2 -rotate-1">{r.tag}</span>
                            <h3 className="marker text-2xl leading-tight">{r.name}</h3>
                          </div>
                          <button onClick={() => toggleFav(r.id)} className="shrink-0 mt-1 transition-transform hover:scale-125 hover:-rotate-12">
                            <Heart size={22} strokeWidth={2.5} className={favs.includes(r.id) ? "fill-[#d62411] text-[#d62411]" : "text-[#181410]/40"} />
                          </button>
                        </div>

                        <p className="text-[13px] leading-relaxed mt-2 text-[#181410]/75 font-medium">{r.blurb}</p>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-[12px] font-bold">
                          <span className="flex items-center gap-1.5"><Clock size={14} strokeWidth={2.5} /> {r.time}</span>
                          <span className="flex items-center gap-1.5">
                            {r.species === "cat" ? <Cat size={14} strokeWidth={2.5} /> : r.species === "dog" ? <Dog size={14} strokeWidth={2.5} /> : <><Dog size={14} strokeWidth={2.5} /><Cat size={14} strokeWidth={2.5} /></>}
                            {r.species === "both" ? "equal-opportunity" : r.species}
                          </span>
                          <span className="flex items-center gap-1.5">chaos: <ChaosMeter level={r.chaos} /></span>
                        </div>

                        <button
                          onClick={() => setOpenRecipe(open ? null : r.id)}
                          className="mt-4 marker text-sm bg-[#e8a912] border-2 border-[#181410] px-3 py-1.5 -rotate-1 hover:bg-[#d62411] hover:text-[#e8e0cc] hover:rotate-1 transition-all shadow-[3px_3px_0_#181410]"
                        >
                          {open ? "hide the goods ↑" : "show me the goods ↓"}
                        </button>

                        <AnimatePresence>
                          {open && (
                            <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="mt-4 pt-4 border-t-2 border-dashed border-[#181410]/30 space-y-2">
                                {r.ingredients.map((ing) => (
                                  <li key={ing} className="flex items-start gap-2 text-[13px] font-medium">
                                    <Zap size={13} className="mt-0.5 text-[#d62411] shrink-0" strokeWidth={3} />
                                    {ing}
                                  </li>
                                ))}
                                <li className="scrawl text-[11px] text-[#5a7d2a] pt-1">— mix, serve, accept zero gratitude</li>
                              </div>
                            </motion.ul>
                          )}
                        </AnimatePresence>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="mt-8 flex items-start gap-3 bg-[#181410] text-[#e8e0cc] p-4 torn-card rotate-[0.5deg]">
                <AlertTriangle size={18} className="text-[#e8a912] shrink-0 mt-0.5" strokeWidth={2.5} />
                <p className="text-[12px] leading-relaxed font-medium">
                  Legal made us say it: every recipe is reviewed by an actual veterinary nutritionist.
                  The jokes are ours. The science is hers. Never feed xylitol, grapes, onions, or your own dinner.
                </p>
              </div>
            </motion.section>
          )}

          {/* ===== MEAL PLAN ===== */}
          {tab === "plan" && (
            <motion.section key="plan" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <div className="flex items-baseline justify-between mb-5">
                <h2 className="scrawl text-lg">this week's damage ↓</h2>
                <span className="text-xs font-bold text-[#181410]/60">{done.length}/7 days survived</span>
              </div>

              <div className="bg-[#f4eedb] torn-card border-2 border-[#181410] shadow-[5px_5px_0_rgba(24,20,16,0.85)] relative -rotate-[0.4deg]">
                <div className="tape" style={{ top: -12, left: "40%", transform: "rotate(-3deg)" }} />
                <div className="divide-y-2 divide-dashed divide-[#181410]/25">
                  {PLAN.map((d, i) => {
                    const isDone = done.includes(i);
                    return (
                      <button key={d.day} onClick={() => toggleDone(i)} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[#e8a912]/25 transition-colors group">
                        <span className={`marker text-lg w-12 shrink-0 ${i === 5 ? "text-[#d62411]" : ""}`}>{d.day}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-[14px] leading-snug ${isDone ? "strike text-[#181410]/50" : ""}`}>{d.meal}</p>
                          <p className="scrawl text-[10px] text-[#5a7d2a] mt-1 truncate">{d.note}</p>
                        </div>
                        <span className="shrink-0 transition-transform group-hover:rotate-6">
                          {isDone
                            ? <CheckSquare size={22} strokeWidth={2.5} className="text-[#d62411]" />
                            : <Square size={22} strokeWidth={2.5} className="text-[#181410]/40" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6">
                {[
                  { label: "BOWLS LICKED CLEAN", val: "13", icon: Star },
                  { label: "FLOORS DESTROYED", val: "2", icon: Skull },
                  { label: "TREATS 'TESTED' BY STAFF", val: "??", icon: Bone },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className={`bg-[#181410] text-[#e8e0cc] p-3 torn-card text-center ${i === 1 ? "rotate-1" : "-rotate-1"}`}>
                      <Icon size={16} className="mx-auto text-[#e8a912]" strokeWidth={2.5} />
                      <p className="marker text-2xl mt-1">{s.val}</p>
                      <p className="text-[9px] font-black tracking-wider mt-0.5 text-[#e8e0cc]/70">{s.label}</p>
                    </div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {/* ===== CREW ===== */}
          {tab === "crew" && (
            <motion.section key="crew" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <div className="flex items-baseline justify-between mb-5">
                <h2 className="scrawl text-lg">who let these people cook ↓</h2>
                <span className="text-xs font-bold text-[#181410]/60">4 humans · 16 animals · 1 goldfish (disputed)</span>
              </div>

              <div className="space-y-6">
                {CREW.map((m, i) => (
                  <article key={m.name} className={`relative bg-[#f4eedb] torn-card border-2 border-[#181410] shadow-[5px_5px_0_rgba(24,20,16,0.85)] p-5 ${i % 2 ? "rotate-[0.6deg]" : "-rotate-[0.6deg]"}`}>
                    <div className="tape" style={{ top: -10, left: i % 2 ? "10%" : "60%", transform: `rotate(${i % 2 ? -4 : 5}deg)` }} />
                    <div className="flex gap-4">
                      <div className="shrink-0 relative">
                        <div className="w-[88px] h-[88px] border-2 border-[#181410] overflow-hidden grayscale contrast-125 rotate-[-2deg]" style={{ clipPath: "polygon(2% 4%, 98% 0%, 100% 95%, 0% 100%)" }}>
                          <img src={`https://images.unsplash.com/${m.img}?w=200&h=200&fit=crop`} alt={m.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-[#d62411] p-1 rotate-12 border border-[#181410]">
                          {i % 2 ? <Cat size={12} className="text-[#e8e0cc]" strokeWidth={3} /> : <Dog size={12} className="text-[#e8e0cc]" strokeWidth={3} />}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <h3 className="marker text-xl leading-tight">{m.name}</h3>
                        <p className="inline-block bg-[#e8a912] text-[10px] font-black tracking-widest px-2 py-0.5 mt-1 -rotate-1 border border-[#181410]">{m.role.toUpperCase()}</p>
                        <p className="text-[12.5px] leading-relaxed mt-2 text-[#181410]/75 font-medium">{m.bio}</p>
                        <p className="scrawl text-[10px] text-[#5a7d2a] mt-2">household: {m.pet}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-8 text-center">
                <button className="marker text-base bg-[#d62411] text-[#e8e0cc] border-2 border-[#181410] px-6 py-3 -rotate-1 shadow-[4px_4px_0_#181410] hover:rotate-1 hover:bg-[#181410] hover:text-[#e8a912] transition-all">
                  Join the kennel — we're hiring →
                </button>
                <p className="scrawl text-[10px] text-[#181410]/60 mt-3">benefits include unlimited dog hair on everything you own</p>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="bg-[#181410] text-[#e8e0cc] relative">
        <TornDivider color="#181410" />
        <div className="max-w-[640px] mx-auto px-6 py-10 -mt-1">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="marker text-lg">GRUBBY PAWS <span className="text-[#d62411]">CHAOS KITCHEN</span></p>
              <p className="text-[11px] text-[#e8e0cc]/60 font-medium mt-1">Brooklyn garage → Portland warehouse → still smells like liver treats.</p>
            </div>
            <p className="scrawl text-[10px] text-[#e8a912] rotate-[-2deg]">no pets were underfed<br />in the making of this site</p>
          </div>
        </div>
      </footer>
    </div>
  );
}