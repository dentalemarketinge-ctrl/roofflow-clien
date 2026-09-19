import { useState, useRef } from 'react';
import {
  Download,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  Sparkles,
  Smartphone,
  ExternalLink,
  Shield,
  ArrowRight,
  Maximize2
} from 'lucide-react';

interface FeatureDesign {
  id: string;
  number: string;
  tag: string;
  title: string;
  highlightWords: string[];
  subhead: string;
  screenshot: string;
  mockupType: 'browser' | 'mobile';
  bullets: {
    num: string;
    title: string;
    desc: string;
  }[];
  ctaText: string;
  caption: string;
}

const FEATURE_DESIGNS: FeatureDesign[] = [
  {
    id: 'pipeline',
    number: '01',
    tag: 'ROOFER FLOW AI™ • OPERATIONS COMMAND',
    title: 'ONE SYSTEM. YOUR ENTIRE ROOFING OPERATION.',
    highlightWords: ['ONE', 'SYSTEM.', 'ENTIRE'],
    subhead: 'Stop letting $50,000 in roofing leads get buried in text messages, voicemails, or truck notepads.',
    screenshot: '/screenshots/pipeline.png',
    mockupType: 'browser',
    bullets: [
      { num: '01', title: 'Live Lead Intelligence', desc: 'Instant status tracking from New Lead to AI Qualifying to Job Won.' },
      { num: '02', title: 'Instant Score & Filter', desc: 'Every inquiry scored by roof age, leak severity, and insurance claim status.' },
      { num: '03', title: 'Zero Lost Revenue', desc: 'Drag-and-drop pipeline keeps your entire sales crew aligned on the next job.' },
    ],
    ctaText: "DM 'PIPELINE' FOR A FREE WORKSPACE DEMO",
    caption: `Where do your leads go when you're 25 feet up on a roof?

Most roofers run a $1M+ operation on sticky notes, scattered text threads, and mental memory. That works until you miss a $18,000 storm restoration claim and your competitor across town closes it.

Roofer Flow AI gives you one crystal-clear command center:
⚡ Instant lead capture from Google, Facebook & phone calls
⚡ Automatic qualification with roof age, leak location & claim status
⚡ Zero lost quotes, zero manual paperwork

Simple. Visual. Built specifically for roofing contractors.

📲 DM us "PIPELINE" to test the live workspace.

#roofingcontractor #roofers #roofingcompany #roofingbusiness #roofinglife #roofingindustry #stormrestoration #rooferflow #roofingbusinessowner #roofingcontractors`,
  },
  {
    id: 'ai-assistant',
    number: '02',
    tag: 'ROOFER FLOW AI™ • CONVERSATIONAL AI',
    title: 'TURN CONVERSATIONS INTO BOOKED INSPECTIONS.',
    highlightWords: ['CONVERSATIONS', 'BOOKED', 'INSPECTIONS.'],
    subhead: 'Answers homeowner inquiries in seconds, qualifies roof damage, and books the inspection automatically.',
    screenshot: '/screenshots/ai-assistant.png',
    mockupType: 'browser',
    bullets: [
      { num: '01', title: '8-Second SMS Response', desc: 'Homeowners receive a friendly, personalized reply before they ever call another roofer.' },
      { num: '02', title: 'Deep Roof Diagnostics', desc: 'Asks the exact right questions: active leak, hail storm impact, roof age, and insurance claims.' },
      { num: '03', title: 'Direct Calendar Sync', desc: 'Locks in morning or afternoon inspection slots straight to your dispatch schedule.' },
    ],
    ctaText: "DM 'CONVERT' TO TEST THE AI RECEPTIONIST",
    caption: `Homeowners with leaks don't wait 4 hours for you to check your voicemail. They hire the first roofer who texts back.

With our 24/7 AI Assistant:
1️⃣ Homeowner texts or submits a request.
2️⃣ The AI responds in under 8 seconds.
3️⃣ It asks the exact right qualifying questions (emergency leak, hail strike, roof age).
4️⃣ It books the inspection directly into your calendar.

Your crew stays focused on the roof. Your calendar stays filled with qualified estimates.

💬 DM "CONVERT" to see a live demo of the conversation flow.

#roofer #roofingcontractor #roofingtechnology #speedtolead #contractorsoftware #stormdamage #roofinspection #roofingautomation`,
  },
  {
    id: 'missed-calls',
    number: '03',
    tag: 'ROOFER FLOW AI™ • REVENUE RECOVERY',
    title: 'MISSED CALL? RECOVERED IN 8 SECONDS.',
    highlightWords: ['MISSED', 'CALL?', 'RECOVERED'],
    subhead: 'When you are on a ladder or driving your truck, every unanswered call triggers an immediate text-back.',
    screenshot: '/screenshots/missed-calls.png',
    mockupType: 'browser',
    bullets: [
      { num: '01', title: 'Instant Call Interception', desc: 'The moment a call goes unanswered, an automatic personalized text is fired to the homeowner.' },
      { num: '02', title: 'Sounds 100% Human', desc: '"Hey, this is Mike from Apex Roofing—I’m currently on a roof. How can I help with your home today?"' },
      { num: '03', title: 'Prevents Competitor Calls', desc: 'Engages the caller before they can click the next roofing ad on Google.' },
    ],
    ctaText: "DM 'RECOVER' TO STOP LOSING CALLS",
    caption: `62% of calls to roofing contractors go unanswered while crews are actively on roofs.

And what does a homeowner with a leaking ceiling do when they hear your voicemail? They hang up and dial the next roofer on Google.

With Roofer Flow AI Missed Call Recovery:
📞 Call goes unanswered
⚡ System texts them back in 8 seconds
💬 AI diagnoses their roof concern and schedules the assessment

One recovered roof replacement pays for this system for 3 entire years.

📩 DM "RECOVER" to activate this on your business line.

#roofingbusiness #rooferslife #missedcall #speedtolead #roofingcontractors #contractorleads #roofreplacement`,
  },
  {
    id: 'scheduling',
    number: '04',
    tag: 'ROOFER FLOW AI™ • FIELD SCHEDULING',
    title: 'ZERO NO-SHOWS. AUTOMATED INSPECTION SCHEDULE.',
    highlightWords: ['ZERO', 'NO-SHOWS.', 'AUTOMATED'],
    subhead: 'Real-time dispatch calendar for roof inspections, adjuster meetings, and crew installations.',
    screenshot: '/screenshots/scheduling.png',
    mockupType: 'browser',
    bullets: [
      { num: '01', title: '2-Way Calendar Sync', desc: 'Seamless synchronization with Google Calendar, Outlook, and your estimator dispatch.' },
      { num: '02', title: 'Automated SMS Reminders', desc: '24-hour and 2-hour text confirmations eliminate wasted 45-minute estimator drives.' },
      { num: '03', title: '1-Click Rescheduling', desc: 'Homeowners can confirm or change time slots with one tap instead of ghosting your team.' },
    ],
    ctaText: "DM 'SCHEDULE' TO STREAMLINE INSPECTIONS",
    caption: `Driving 40 minutes across town just to find nobody home is the single most expensive waste of time in roofing.

Our automated scheduling system handles the entire pre-appointment sequence:
📅 Syncs with your estimators' availability
📲 Sends automated 24h & 2h SMS reminders
🔄 Gives homeowners a 1-tap option to confirm or reschedule

Keep your estimators on the road closing contracts, not sitting outside locked gates.

👉 DM "SCHEDULE" to see the appointment calendar in action.

#roofingjobs #roofingoperations #fieldservice #roofestimator #roofestimate #roofrepairs #roofingcontractor`,
  },
  {
    id: 'routes',
    number: '05',
    tag: 'ROOFER FLOW AI™ • LOGISTICS & DISPATCH',
    title: 'OPTIMIZE ESTIMATOR ROUTES. CUT FUEL & DRIVE TIME.',
    highlightWords: ['OPTIMIZE', 'ROUTES.', 'CUT', 'TIME.'],
    subhead: 'Build a practical field schedule, send live homeowner ETAs, and launch routes to Google Maps in 1 click.',
    screenshot: '/screenshots/routes.png',
    mockupType: 'browser',
    bullets: [
      { num: '01', title: 'Smart Route Sequencing', desc: 'Re-orders inspection stops logically to cut back-and-forth cross-town zigzagging.' },
      { num: '02', title: 'Automated Homeowner ETAs', desc: 'Broadcasts SMS updates: "Our inspector is 15 minutes away from your home."' },
      { num: '03', title: 'Mobile GPS Ready', desc: '1-click handoff directly into Google Maps or Apple Maps for your field drivers.' },
    ],
    ctaText: "DM 'ROUTE' TO OPTIMIZE YOUR TRUCKS",
    caption: `Gas is expensive. Estimator time is even more expensive.

If your sales reps are driving back and forth across town in a zigzag pattern, you are burning hundreds of dollars in fuel and losing 2 inspection slots every single day.

Roofer Flow Route Planner:
🗺️ Automatically arranges stops for the shortest drive time
📍 Sends automated live ETA texts to waiting homeowners
🚗 Launches directly into Google Maps on your phone

Fit 2 more roof estimates into every single day without working later.

📩 DM "ROUTE" for details.

#roofingfleet #roofinglogistics #roofingsales #roofingcrew #commercialroofing #residentialroofing`,
  },
  {
    id: 'quotes',
    number: '06',
    tag: 'ROOFER FLOW AI™ • ESTIMATE BUILDER',
    title: 'INTERACTIVE QUOTES. ACCURATE TO THE PENNY.',
    highlightWords: ['INTERACTIVE', 'QUOTES.', 'ACCURATE'],
    subhead: 'Calculate roof pitch, square footage, waste percentage, and send official SMS proposals in 90 seconds.',
    screenshot: '/screenshots/quotes.png',
    mockupType: 'browser',
    bullets: [
      { num: '01', title: 'Built-in Waste Math', desc: 'Select squares and pitch (6/12, 8/12)—system automatically calculates waste and shingle counts.' },
      { num: '02', title: 'Add-on Accessories', desc: '1-click toggles for seamless 6-inch gutters, ice & water shield, and ventilation upgrades.' },
      { num: '03', title: 'Instant SMS & PDF Proposal', desc: 'Send the official proposal directly to the homeowner’s smartphone before leaving their driveway.' },
    ],
    ctaText: "DM 'QUOTE' FOR THE ESTIMATE BUILDER",
    caption: `Homeowners sign with the roofer who gives them a clear, professional proposal first.

If it takes you 3 days to send a handwritten quote, you've already lost the deal.

With Roofer Flow AI Quote Builder:
📐 Enter squares, pitch & waste allowance
🔨 Select shingle tiers and add-ons (gutters, ice/water shield)
📲 Hit "Send Quote via SMS" right from your truck

Clean, professional, itemized proposals that build instant trust.

💬 DM "QUOTE" to see how fast you can build proposals.

#roofquote #roofestimate #roofingproposal #roofingsalespro #roofingcontractor #roofingnation`,
  },
  {
    id: 'contracts',
    number: '07',
    tag: 'ROOFER FLOW AI™ • E-SIGNATURES',
    title: 'LEGALLY BINDING CONTRACTS. SIGNED ON THE SPOT.',
    highlightWords: ['LEGALLY', 'BINDING', 'CONTRACTS.'],
    subhead: 'Storm contingency agreements and digital sign-off templates with DocuSign/HelloSign compliance.',
    screenshot: '/screenshots/contracts.png',
    mockupType: 'browser',
    bullets: [
      { num: '01', title: 'Storm Contingency Agreements', desc: 'Lock in insurance negotiation rights before the insurance adjuster arrives on the scene.' },
      { num: '02', title: 'Mobile Touch-Sign', desc: 'Homeowners sign with their finger right in their driveway or via secure SMS link.' },
      { num: '03', title: 'Permanent Audit Trail', desc: 'Time-stamped, encrypted contract PDFs stored automatically in the customer file.' },
    ],
    ctaText: "DM 'CONTRACT' FOR DIGITAL E-SIGN",
    caption: `Never let a customer say "I'll think about it" after you spent an hour on their roof documenting hail damage.

Our digital contract workflow allows you to lock in storm contingency agreements and retail replacement contracts on the spot:

✍️ Homeowner signs with their finger on phone or iPad
📑 Legally binding templates for Storm, Retail, and Commercial TPO
🔒 Instant PDF copies emailed to homeowner and company office

Stop printing paper contracts and chasing physical signatures.

📩 DM "CONTRACT" to automate your customer agreements.

#roofingbusiness #roofinglife #insuranceclaims #stormdamage #haildamage #roofcontracts #contractorpro`,
  },
  {
    id: 'invoices',
    number: '08',
    tag: 'ROOFER FLOW AI™ • PROGRESS BILLING',
    title: '3-PART PROGRESS BILLING. GET PAID ON TIME.',
    highlightWords: ['3-PART', 'PROGRESS', 'BILLING.'],
    subhead: 'Manage insurance draws (ACV Deposit, Material Delivery, Final RCV) and instant Stripe payouts.',
    screenshot: '/screenshots/invoices.png',
    mockupType: 'browser',
    bullets: [
      { num: '01', title: 'Draw #1: ACV Deposit (40%)', desc: 'Automatically generated upon contract signing to secure your project schedule.' },
      { num: '02', title: 'Draw #2: Materials (30%)', desc: 'Invoiced the day Owens Corning or GAF shingles arrive on the customer’s driveway.' },
      { num: '03', title: 'Draw #3: Final Completion (30%)', desc: 'Depreciation draw sent to homeowner & insurance company with certificate of completion.' },
    ],
    ctaText: "DM 'INVOICE' FOR PROGRESS BILLING",
    caption: `Cash flow kills roofing companies faster than lack of work.

If you don't collect deposits upfront, you're financing your customers' roofs out of your own pocket.

Roofer Flow AI automates the standard 3-part roofing billing sequence:
1️⃣ Draw #1: Initial ACV Deposit (40%)
2️⃣ Draw #2: Material Delivery Day (30%)
3️⃣ Draw #3: Final Completion & RCV Depreciation (30%)

Send invoices via SMS with 1-click credit card or ACH payment links.

📲 DM "INVOICE" to clean up your invoicing process today.

#roofingcashflow #contractorbilling #roofingfinancing #roofingmoney #roofingbusinessowner #roofingcompany`,
  },
  {
    id: 'payments',
    number: '09',
    tag: 'ROOFER FLOW AI™ • CASH LEDGER',
    title: 'TRACK EVERY DOLLAR. ZERO UNCOLLECTED BALANCES.',
    highlightWords: ['TRACK', 'EVERY', 'DOLLAR.', 'ZERO'],
    subhead: 'Unified financial ledger combining credit card deposits, checks, bank transfers, and cash receipts.',
    screenshot: '/screenshots/payments.png',
    mockupType: 'browser',
    bullets: [
      { num: '01', title: 'Instant Stripe Payouts', desc: 'Collect deposits with 1 tap; funds deposited directly into your business checking account.' },
      { num: '02', title: 'Check & Cash Logging', desc: 'Record offline checks and cashier payments with automated digital receipt generation.' },
      { num: '03', title: 'Zero Uncollected Balances', desc: 'Automatic reminder notifications for unpaid balances before warranties are issued.' },
    ],
    ctaText: "DM 'PAY' TO STREAMLINE PAYMENTS",
    caption: `How much money is currently outstanding on roofs you completed last month?

If you have to check 3 bank accounts, a folder of paper checks, and your QuickBooks to answer that, you have a leak in your cash flow.

With Roofer Flow AI Payments:
💳 Credit card, debit card & ACH processing
📝 Record offline insurance checks in seconds
📊 Real-time ledger of collected cash vs. outstanding receivables

Get paid faster and know your exact numbers every single day.

👉 DM "PAY" to modernize your payment collection.

#roofingfinancials #roofingmoney #contractorlife #roofingbusiness #roofingledger #stripepayments`,
  },
  {
    id: 'before-after',
    number: '10',
    tag: 'ROOFER FLOW AI™ • CRAFTSMANSHIP PROOF',
    title: 'BEFORE & AFTER EVIDENCE. WIN CLAIMS & TRUST.',
    highlightWords: ['BEFORE', '&', 'AFTER', 'EVIDENCE.'],
    subhead: 'High-resolution pre-inspection drone damage photos paired with completed 50-year system showcases.',
    screenshot: '/screenshots/before-after.png',
    mockupType: 'browser',
    bullets: [
      { num: '01', title: 'Insurance-Grade Documentation', desc: 'Capture pre-inspection drone scans showing hail strikes, missing shingles, and ridge damage.' },
      { num: '02', title: 'Completed Craftsmanship Showcase', desc: 'Store finished architectural shingle transformations with full warranty audit captions.' },
      { num: '03', title: 'Instant Homeowner Proof', desc: 'Share a beautiful transformation web link with homeowners and prospective clients.' },
    ],
    ctaText: "DM 'PHOTO' FOR EVIDENCE VAULT",
    caption: `Roofing is a visual business. Homeowners don't climb onto their roofs—they judge your work by the photos you show them.

And insurance adjusters don't approve claims without undeniable photographic evidence of storm damage.

Our Before & After Photo System:
📸 Document pre-loss hail strikes and ridge damage with drone scans
🏠 Showcase completed 50-year architectural shingle transformations
📑 Attach photo evidence directly to insurance estimates and customer proposals

Turn your craftsmanship into your best sales tool.

📲 DM "PHOTO" to see the photo evidence vault in action.

#roofingphotos #droneroofing #roofdamage #stormrestoration #roofreplacement #beforeandafter #roofingcontractor`,
  },
  {
    id: 'team',
    number: '11',
    tag: 'ROOFER FLOW AI™ • CREW MANAGEMENT',
    title: 'MANAGE YOUR FIELD CREWS & SALES REPS.',
    highlightWords: ['MANAGE', 'YOUR', 'FIELD', 'CREWS.'],
    subhead: 'Monitor active field estimators, production crew supervisors, certifications, and live availability.',
    screenshot: '/screenshots/team.png',
    mockupType: 'browser',
    bullets: [
      { num: '01', title: 'Role-Based Permissions', desc: 'Hail Inspectors, Production Supervisors, Commercial Roof Auditors, and Claims Specialists.' },
      { num: '02', title: '1-Click SMS Onboarding', desc: 'Send an instant text invite to newly hired field estimators to get them running in 60 seconds.' },
      { num: '03', title: 'HAAG & Tier Tracking', desc: 'Store certifications, license numbers, and track who is on-duty in the field right now.' },
    ],
    ctaText: "DM 'TEAM' TO SCALE YOUR CREW",
    caption: `You can't scale past 7 figures if every customer question, crew assignment, and estimator lead has to go through your personal cell phone.

Roofer Flow Team Management:
👷‍♂️ Manage Hail Inspectors, Crew Supervisors & Insurance Specialists
📲 1-click SMS onboarding for new sales reps
📍 Track field availability and assign inspections based on service zones

Build a real roofing company that runs smoothly even when you take a weekend off.

💬 DM "TEAM" to see how to organize your field personnel.

#roofingcrew #roofingsales #roofingculture #contractorteam #roofingcompany #roofingcontractor #roofingoperations`,
  },
  {
    id: 'roi-dashboard',
    number: '12',
    tag: 'ROOFER FLOW AI™ • VERIFIED FINANCIALS',
    title: 'REAL-TIME REVENUE. NO MORE SPREADSHEET GUESSWORK.',
    highlightWords: ['REAL-TIME', 'REVENUE.', 'NO', 'GUESSWORK.'],
    subhead: 'Calculated directly from verified signed contracts, issued invoices, and recorded cash flow.',
    screenshot: '/screenshots/roi-dashboard.png',
    mockupType: 'browser',
    bullets: [
      { num: '01', title: 'Signed Contract Value', desc: 'Live total of all legally binding replacement contracts closed this month.' },
      { num: '02', title: 'Contract-to-Cash Velocity', desc: 'Track contracted vs. invoiced vs. collected cash percentages in real time.' },
      { num: '03', title: 'True Profit Clarity', desc: 'No vanity metrics—pure financial records grounded in real roofing jobs.' },
    ],
    ctaText: "DM 'ROI' FOR REVENUE INTELLIGENCE",
    caption: `How do you know if your roofing company actually made money this month?

Revenue is vanity. Cash in the bank is reality.

The Roofer Flow ROI Dashboard tracks your verified financial health in real time:
💰 Signed Contract Value (Jobs won)
📑 Total Invoiced (Billing in progress)
💵 Payments Collected (Cash realized)
📈 Invoiced-to-Collected conversion rate

Stop guessing your profit margin. Know your exact numbers every morning.

👉 DM "ROI" for a private walkthrough.

#roofingprofit #roofingnumbers #businessanalytics #roofingfinances #roofingbusiness #contractorlife`,
  },
  {
    id: 'reviews',
    number: '13',
    tag: 'ROOFER FLOW AI™ • REPUTATION ENGINE',
    title: 'MORE 5-STAR REVIEWS. AUTOMATICALLY.',
    highlightWords: ['MORE', '5-STAR', 'REVIEWS.', 'AUTOMATICALLY.'],
    subhead: 'Monitor your 4.9+ Google rating and automatically trigger 1-click SMS review links upon job completion.',
    screenshot: '/screenshots/reviews.png',
    mockupType: 'browser',
    bullets: [
      { num: '01', title: 'Triggered at Cleanup', desc: 'The moment your crew finishes nail sweeps and signs off, the homeowner receives an SMS.' },
      { num: '02', title: 'Google Maps 3-Pack Boost', desc: 'Consistent 5-star verified reviews push your company to the top of local Google searches.' },
      { num: '03', title: 'Reputation Shield', desc: 'Direct feedback routing ensures 100% customer satisfaction before public posting.' },
    ],
    ctaText: "DM 'REVIEWS' TO DOMINATE GOOGLE MAPS",
    caption: `Why does your competitor with worse workmanship have 180 Google reviews while you only have 22?

Because they have an automated system, and you are manually asking homeowners and hoping they remember.

With Roofer Flow Review Automation:
⭐ The moment a roof is marked "Complete", the homeowner gets a polite SMS.
⭐ 1 tap opens your Google Business Profile review screen.
⭐ You collect 10–20 fresh five-star reviews every single month on autopilot.

Rank #1 on Google Maps in your city without paying for expensive SEO agencies.

📲 DM "REVIEWS" to automate your 5-star reputation.

#googlereviews #reputationmanagement #localseo #roofingseo #roofingcontractor #roofers`,
  },
  {
    id: 'marketing',
    number: '14',
    tag: 'ROOFER FLOW AI™ • SOCIAL & REPUTATION HUB',
    title: 'DOMINATE YOUR SERVICE AREA ON GOOGLE & SOCIAL.',
    highlightWords: ['DOMINATE', 'YOUR', 'SERVICE', 'AREA.'],
    subhead: 'Manage Google Business Profile, Facebook, Instagram, and storm updates from one single command center.',
    screenshot: '/screenshots/marketing.png',
    mockupType: 'browser',
    bullets: [
      { num: '01', title: 'Single Multi-Channel Hub', desc: 'Connect Google, Facebook, Instagram & YouTube in one unified command center.' },
      { num: '02', title: 'AI Post Drafting', desc: 'Generate storm alert broadcasts and seasonal maintenance tips in 10 seconds.' },
      { num: '03', title: 'Storm Ingestion Ready', desc: 'Target specific hail zones and push verified local updates to prospective homeowners.' },
    ],
    ctaText: "DM 'MARKETING' TO GROW LOCAL PRESENCE",
    caption: `When a severe hail storm hits your county, the roofer who communicates fastest gets 80% of the insurance replacement jobs.

Our Social & Marketing Hub lets you:
📍 Sync your Google Business Profile & local service areas
📢 Draft emergency storm damage advisories with AI in 15 seconds
📲 Publish updates across Google, Facebook & Instagram with one click

Be the known, trusted roofing authority in your community before storms even make landfall.

📩 DM "MARKETING" to see our multi-channel social engine.

#stormdamage #hailstorm #roofingmarketing #digitalmarketing #socialmediamarketing #roofingbusiness`,
  },
];

export default function InstagramStudioPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5'>('1:1');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const activeFeature = FEATURE_DESIGNS[selectedIndex];

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(activeFeature.caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSlide = (feature: FeatureDesign) => {
    // Generate a downloadable canvas image of the exact slide
    const canvas = document.createElement('canvas');
    const width = 1080;
    const height = aspectRatio === '1:1' ? 1080 : 1350;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background gradient (Dark obsidian emerald)
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#060B08');
    bgGradient.addColorStop(0.5, '#0A130E');
    bgGradient.addColorStop(1, '#050907');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Subtle Gold Radial Glow
    const radialGlow = ctx.createRadialGradient(width / 2, 280, 50, width / 2, 280, 500);
    radialGlow.addColorStop(0, 'rgba(212, 175, 55, 0.12)');
    radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    // Gold decorative outer border
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 4;
    ctx.strokeRect(32, 32, width - 64, height - 64);

    // Corner decorative accents
    ctx.fillStyle = '#D4AF37';
    const corners = [
      [32, 32],
      [width - 32, 32],
      [32, height - 32],
      [width - 32, height - 32],
    ];
    corners.forEach(([x, y]) => {
      ctx.fillRect(x - 6, y - 6, 12, 12);
    });

    // Tag / Category
    ctx.font = '600 20px "Outfit", sans-serif';
    ctx.fillStyle = '#D4AF37';
    ctx.textAlign = 'center';
    ctx.fillText(feature.tag, width / 2, 85);

    // Title (Playfair Display / Serif style)
    ctx.font = '700 44px "Playfair Display", Georgia, serif';
    ctx.fillStyle = '#FFFFFF';
    const words = feature.title.split(' ');
    let line1 = '';
    let line2 = '';
    words.forEach((word) => {
      if ((line1 + ' ' + word).length < 32) {
        line1 += (line1 ? ' ' : '') + word;
      } else {
        line2 += (line2 ? ' ' : '') + word;
      }
    });
    ctx.fillText(line1, width / 2, 145);
    if (line2) {
      ctx.fillStyle = '#E5C158';
      ctx.fillText(line2, width / 2, 198);
    }

    // Subhead
    ctx.font = '400 22px "Inter", sans-serif';
    ctx.fillStyle = '#A3B3AA';
    ctx.fillText(feature.subhead.slice(0, 70) + (feature.subhead.length > 70 ? '...' : ''), width / 2, 240);

    // Screenshot Image load
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = feature.screenshot;
    img.onload = () => {
      // Mockup window frame
      const frameX = 80;
      const frameY = 275;
      const frameW = width - 160;
      const frameH = aspectRatio === '1:1' ? 490 : 640;

      // Window background and border
      ctx.fillStyle = '#101713';
      ctx.fillRect(frameX, frameY, frameW, frameH);
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
      ctx.lineWidth = 2;
      ctx.strokeRect(frameX, frameY, frameW, frameH);

      // Window top bar
      ctx.fillStyle = '#18241E';
      ctx.fillRect(frameX, frameY, frameW, 36);
      ctx.fillStyle = '#FF5F56';
      ctx.beginPath();
      ctx.arc(frameX + 20, frameY + 18, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFBD2E';
      ctx.beginPath();
      ctx.arc(frameX + 38, frameY + 18, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#27C93F';
      ctx.beginPath();
      ctx.arc(frameX + 56, frameY + 18, 6, 0, Math.PI * 2);
      ctx.fill();

      // Draw image inside window
      ctx.drawImage(img, frameX + 2, frameY + 38, frameW - 4, frameH - 40);

      // Value Badges (3 bullets at bottom)
      const bottomStartY = frameY + frameH + 35;
      const colW = (width - 160) / 3;

      feature.bullets.forEach((bullet, bIdx) => {
        const bx = 80 + bIdx * colW;
        ctx.fillStyle = '#D4AF37';
        ctx.font = '700 18px "Outfit", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`[${bullet.num}] ${bullet.title}`, bx + 10, bottomStartY);

        ctx.fillStyle = '#8E9E95';
        ctx.font = '400 15px "Inter", sans-serif';
        ctx.fillText(bullet.desc.slice(0, 32) + '...', bx + 10, bottomStartY + 24);
      });

      // Bottom CTA bar
      ctx.fillStyle = '#141F18';
      ctx.fillRect(80, height - 90, width - 160, 50);
      ctx.strokeStyle = '#D4AF37';
      ctx.strokeRect(80, height - 90, width - 160, 50);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 18px "Outfit", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(feature.ctaText, width / 2, height - 58);

      // Trigger download
      const link = document.createElement('a');
      link.download = `roofer-flow-${feature.id}-${aspectRatio}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    // If image is cached/instant
    if (img.complete) {
      img.onload?.(new Event('load'));
    }
  };

  return (
    <div className="ig-studio-layout">
      {/* Top Header */}
      <header className="ig-studio-header">
        <div className="ig-studio-brand">
          <div className="ig-brand-badge">
            <Sparkles size={18} className="gold-icon" />
            <span>ROOFER FLOW AI™</span>
          </div>
          <h1 className="ig-studio-title">Instagram Feature Design Studio</h1>
          <p className="ig-studio-subtitle">
            14 production-ready, luxury dark-and-gold Instagram feed designs created from your live software screenshots.
          </p>
        </div>

        <div className="ig-studio-controls">
          <div className="ig-toggle-group">
            <button
              type="button"
              className={`ig-toggle-btn ${aspectRatio === '1:1' ? 'active' : ''}`}
              onClick={() => setAspectRatio('1:1')}
            >
              1:1 Square (Feed)
            </button>
            <button
              type="button"
              className={`ig-toggle-btn ${aspectRatio === '4:5' ? 'active' : ''}`}
              onClick={() => setAspectRatio('4:5')}
            >
              4:5 Portrait (Recommended)
            </button>
          </div>

          <div className="ig-toggle-group">
            <button
              type="button"
              className={`ig-toggle-btn ${viewMode === 'single' ? 'active' : ''}`}
              onClick={() => setViewMode('single')}
            >
              <Eye size={15} /> Single View
            </button>
            <button
              type="button"
              className={`ig-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Layers size={15} /> All 14 Grid
            </button>
          </div>
        </div>
      </header>

      {/* Feature Selector Tabs */}
      <nav className="ig-features-nav">
        {FEATURE_DESIGNS.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            className={`ig-feature-tab ${idx === selectedIndex ? 'active' : ''}`}
            onClick={() => {
              setSelectedIndex(idx);
              setViewMode('single');
            }}
          >
            <span className="tab-number">{item.number}</span>
            <span className="tab-name">{item.id.replace('-', ' ')}</span>
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      {viewMode === 'single' ? (
        <div className="ig-studio-workspace">
          {/* Visual Slide Canvas */}
          <div className="ig-canvas-column">
            <div className="ig-canvas-header">
              <div className="canvas-info">
                <span>Slide {selectedIndex + 1} of {FEATURE_DESIGNS.length}</span>
                <strong>{activeFeature.tag}</strong>
              </div>
              <div className="canvas-actions">
                <button
                  type="button"
                  className="ig-btn ig-btn-secondary"
                  onClick={() => setSelectedIndex((prev) => (prev > 0 ? prev - 1 : FEATURE_DESIGNS.length - 1))}
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                <button
                  type="button"
                  className="ig-btn ig-btn-secondary"
                  onClick={() => setSelectedIndex((prev) => (prev < FEATURE_DESIGNS.length - 1 ? prev + 1 : 0))}
                >
                  Next <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  className="ig-btn ig-btn-gold"
                  onClick={() => handleDownloadSlide(activeFeature)}
                >
                  <Download size={16} /> Download High-Res PNG
                </button>
              </div>
            </div>

            {/* The Actual Rendered Instagram Graphic */}
            <div className={`ig-post-card ratio-${aspectRatio.replace(':', '-')}`}>
              {/* Outer Luxury Gold Border & Corner Accents */}
              <div className="ig-card-border" />
              <div className="ig-corner c-tl" />
              <div className="ig-corner c-tr" />
              <div className="ig-corner c-bl" />
              <div className="ig-corner c-br" />

              {/* Card Header */}
              <div className="ig-card-header">
                <span className="ig-card-tag">{activeFeature.tag}</span>
                <h2 className="ig-card-title">
                  {activeFeature.title}
                </h2>
                <p className="ig-card-subhead">{activeFeature.subhead}</p>
              </div>

              {/* The Screenshot Device Frame */}
              <div className="ig-mockup-frame">
                <div className="ig-mockup-topbar">
                  <div className="mockup-dots">
                    <span className="dot red" />
                    <span className="dot yellow" />
                    <span className="dot green" />
                  </div>
                  <div className="mockup-url">roofflow.app/operations/{activeFeature.id}</div>
                  <div className="mockup-badge">LIVE DEMO</div>
                </div>
                <div className="ig-mockup-body">
                  <img
                    src={activeFeature.screenshot}
                    alt={activeFeature.title}
                    className="ig-mockup-img"
                  />
                  <div className="ig-mockup-glow" />
                </div>
              </div>

              {/* 3 Core Value Props */}
              <div className="ig-card-bullets">
                {activeFeature.bullets.map((b) => (
                  <div key={b.num} className="ig-bullet-item">
                    <div className="bullet-header">
                      <span className="bullet-num">{b.num}</span>
                      <strong className="bullet-title">{b.title}</strong>
                    </div>
                    <p className="bullet-desc">{b.desc}</p>
                  </div>
                ))}
              </div>

              {/* Bottom CTA Bar */}
              <div className="ig-card-footer">
                <div className="ig-cta-pill">
                  <Sparkles size={16} className="gold-icon" />
                  <span>{activeFeature.ctaText}</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          </div>

          {/* Copywriting & Caption Column */}
          <div className="ig-copy-column">
            <div className="ig-copy-card">
              <div className="copy-card-header">
                <h3>Instagram Post Copy & Caption</h3>
                <button
                  type="button"
                  className="ig-btn ig-btn-copy"
                  onClick={handleCopyCaption}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy Caption'}
                </button>
              </div>

              <div className="copy-box">
                <pre>{activeFeature.caption}</pre>
              </div>

              <div className="copy-tips">
                <h4>💡 How to post this for maximum trust:</h4>
                <ul>
                  <li><strong>Format:</strong> Post as a 4:5 portrait carousel. Slide 1 is this feature design; Slide 2 can be a zoom-in on the exact text message or proposal; Slide 3 is the call to action.</li>
                  <li><strong>First Comment:</strong> Pin a comment: <em>"Want to test our AI receptionist live on your phone? Dial our demo line or DM 'FLOW'."</em></li>
                  <li><strong>Hashtags:</strong> Already optimized for US and Canadian roofing contractors and storm restoration companies.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* All 14 Grid Overview */
        <div className="ig-grid-workspace">
          {FEATURE_DESIGNS.map((feature, idx) => (
            <div key={feature.id} className="ig-grid-item">
              <div className="grid-item-header">
                <span className="grid-badge">{feature.number}</span>
                <h4>{feature.id.toUpperCase()}</h4>
                <button
                  type="button"
                  className="grid-view-btn"
                  onClick={() => {
                    setSelectedIndex(idx);
                    setViewMode('single');
                  }}
                >
                  Edit / View <Maximize2 size={13} />
                </button>
              </div>

              <div className="grid-thumbnail-wrap">
                <img src={feature.screenshot} alt={feature.title} />
              </div>

              <div className="grid-item-body">
                <h5>{feature.title}</h5>
                <p>{feature.subhead}</p>
                <div className="grid-actions">
                  <button
                    type="button"
                    className="ig-btn ig-btn-gold ig-btn-sm"
                    onClick={() => handleDownloadSlide(feature)}
                  >
                    <Download size={13} /> PNG
                  </button>
                  <button
                    type="button"
                    className="ig-btn ig-btn-secondary ig-btn-sm"
                    onClick={() => {
                      navigator.clipboard.writeText(feature.caption);
                      alert(`Copied caption for ${feature.title}!`);
                    }}
                  >
                    <Copy size={13} /> Caption
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
