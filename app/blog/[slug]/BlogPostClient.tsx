'use client'

import Link from 'next/link'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

// ---------------------------------------------------------------------------
// Blog post data — mirrors the list on /blog
// ---------------------------------------------------------------------------
const POSTS: Record<string, {
  title: string
  category: string
  author: string
  date: string
  readTime: string
  content: React.ReactNode
}> = {
  'how-to-spot-counterfeit-electronics': {
    title: 'How to Spot Counterfeit Electronics: A Complete Guide',
    category: 'Consumer Safety',
    author: 'Dr. Sarah Chen',
    date: 'January 15, 2025',
    readTime: '8 min read',
    content: (
      <>
        <p>Counterfeit electronics are flooding online marketplaces at an unprecedented rate. From fake USB chargers that can start fires to counterfeit smartphones loaded with spyware, the stakes have never been higher for consumers. This guide walks you through the most reliable methods to verify electronics before you buy — and how Veri9 makes the process instant.</p>

        <h2>Why Fake Electronics Are Dangerous</h2>
        <p>Unlike counterfeit handbags or clothing, fake electronics pose direct safety risks. Substandard lithium batteries have caused house fires. Counterfeit chargers lacking proper insulation have electrocuted users. Fake IoT devices have been used as entry points for home network breaches. The problem is compounded by sophisticated packaging that is nearly indistinguishable from the real thing.</p>

        <h2>1. Check the Barcode</h2>
        <p>Every legitimate electronic product sold through major retail channels carries a certified barcode. Scan it with Veri9 to instantly cross-reference against the manufacturer's official product registry. A genuine barcode will return a verified brand name, product category, and manufacturer details. A fake or recycled barcode will either return no match or a mismatch — a red flag.</p>

        <h2>2. Inspect the Build Quality</h2>
        <p>Run your finger along the seam of the device. Genuine products from reputable manufacturers have tight, uniform tolerances. Counterfeits often have uneven gaps, rough plastic edges, or slightly misaligned logos. Screen quality is another giveaway: genuine OLED and LCD panels have consistent backlighting, while fakes often show uneven brightness or color banding at the edges.</p>

        <h2>3. Verify the Serial Number</h2>
        <p>Most major electronics brands — Apple, Samsung, Sony, Dell — offer serial number lookup portals on their official websites. Enter the serial number found on the device's packaging, battery compartment, or Settings menu. A genuine product will return warranty and registration details. If the portal returns "invalid" or "not found," the product may be counterfeit or stolen.</p>

        <h2>4. Scan the QR Code</h2>
        <p>Many modern electronics include a QR code on the packaging that links to an official product authentication page. Veri9's QR scanner verifies that the destination URL is hosted by the genuine manufacturer's domain, checks for HTTPS encryption, and flags suspicious redirect chains that are commonly used in counterfeit authentication scams.</p>

        <h2>5. Buy from Authorized Retailers</h2>
        <p>Purchasing directly from the manufacturer's website or an authorized retailer is the single most effective way to avoid counterfeits. Check the manufacturer's official website for a list of authorized sellers. Prices that seem too good to be true — more than 20–30% below retail — are a major warning sign, especially on third-party marketplace listings.</p>

        <h2>Red Flags at a Glance</h2>
        <ul>
          <li>Packaging that feels thin or has blurry printing</li>
          <li>Missing or photocopied warranty card</li>
          <li>Accessories (cable, charger) that feel unusually light or flimsy</li>
          <li>Barcode that doesn't scan or returns a mismatch</li>
          <li>No safety certifications (CE, FCC, UL) or certifications that look slightly "off"</li>
          <li>Seller with limited history or predominantly negative reviews</li>
        </ul>

        <h2>Use Veri9 for Instant Verification</h2>
        <p>Veri9 combines barcode scanning, serial number lookup, QR code verification, and AI-powered photo analysis into a single app. In under five seconds, you can cross-reference your product against official manufacturer registries, regulatory recall records, and our global counterfeit intelligence network. Download Veri9 and scan before you buy — your safety is worth the five seconds.</p>
      </>
    ),
  },

  'fda-recall-alert-january-2025': {
    title: 'FDA Recall Alert: What You Need to Know This January',
    category: 'Recall Alerts',
    author: 'Michael Torres',
    date: 'January 12, 2025',
    readTime: '5 min read',
    content: (
      <>
        <p>The FDA has issued several significant recalls affecting over-the-counter medications, dietary supplements, and medical devices this January. Here is a summary of the most important recalls, how to check whether your products are affected, and how to use Veri9 to stay protected going forward.</p>

        <h2>January 2025 Notable Recalls</h2>
        <p>The FDA's MedWatch system has logged recalls across multiple categories this month. While we always recommend checking the official FDA recall listings at <strong>fda.gov/safety/recalls-market-withdrawals-safety-alerts</strong> for the definitive list, here are the categories that have seen elevated activity this January:</p>

        <ul>
          <li><strong>OTC pain relievers:</strong> Several private-label ibuprofen and acetaminophen products recalled due to potential superpotency — tablets may contain significantly more active ingredient than labelled.</li>
          <li><strong>Dietary supplements:</strong> Multiple weight-loss supplements recalled after undeclared pharmaceutical ingredients were identified, including sibutramine, a controlled substance removed from the US market in 2010.</li>
          <li><strong>Blood pressure monitors:</strong> Certain home blood pressure monitors recalled due to software errors that may cause inaccurate readings, leading patients to under- or over-medicate.</li>
          <li><strong>Eye drops:</strong> Several preservative-free eye drop products recalled due to contamination concerns identified during manufacturing facility inspections.</li>
        </ul>

        <h2>How to Check if Your Products Are Affected</h2>
        <p>The fastest way to check any medication or supplement is to scan its barcode with Veri9. Our platform integrates with the FDA's National Drug Code (NDC) directory and recall records in real time. If a product's NDC matches an active recall, Veri9 will flag it immediately with recall details, lot numbers, and instructions.</p>

        <p>Alternatively, visit fda.gov and use the recall search tool with the product name, lot number, or UPC code. Always check the lot number on your product against the recall notice — many recalls only affect specific manufacturing lots.</p>

        <h2>What to Do If Your Product Is Recalled</h2>
        <p>Stop using the product immediately. Do not return it to the shelf or resell it. Follow the recall notice's instructions, which typically include returning the product to the place of purchase for a refund or disposing of it safely. If you have experienced any adverse health effects, contact your healthcare provider and report the issue to the FDA via MedWatch at 1-800-FDA-1088.</p>

        <h2>Stay Ahead of Recalls with Veri9</h2>
        <p>Veri9 sends push notifications when products you have previously scanned are later recalled. Scan your medicine cabinet and supplement shelf today to build your personal product history — and let Veri9 watch them for you.</p>
      </>
    ),
  },

  'the-economics-of-counterfeiting': {
    title: 'The $4.5 Trillion Counterfeiting Economy and How Technology Is Fighting Back',
    category: 'Industry',
    author: 'Emma Williams',
    date: 'January 8, 2025',
    readTime: '12 min read',
    content: (
      <>
        <p>The global counterfeit economy has grown to staggering proportions. According to the OECD and EUIPO, trade in counterfeit and pirated goods reached $4.5 trillion annually as of 2022 — surpassing the GDP of most nations. From fake pharmaceuticals and electronics to counterfeit food and cosmetics, the problem touches virtually every product category and every corner of the world.</p>

        <h2>The Scale of the Problem</h2>
        <p>The United States Customs and Border Protection (CBP) seizes tens of thousands of counterfeit shipments every year, with an estimated seizure value of over $2 billion annually. Yet experts believe these seizures represent only a small fraction of total counterfeit trade. The rise of e-commerce and direct-to-consumer shipping from overseas has made enforcement exponentially more difficult — each parcel must be inspected individually, and the sheer volume of international packages makes comprehensive screening virtually impossible.</p>

        <p>The human cost is equally alarming. The World Health Organization estimates that up to 1 in 10 medicines sold in low- and middle-income countries is substandard or falsified. In markets where regulatory oversight is limited, counterfeit pesticides, fertilizers, and veterinary medicines threaten food security. Fake auto parts — particularly counterfeit brake pads and airbag components — have been linked to traffic fatalities worldwide.</p>

        <h2>Why Traditional Enforcement Is Failing</h2>
        <p>Brand protection teams at major corporations spend hundreds of millions of dollars annually on anti-counterfeiting measures, from holographic labels and covert inks to serialized QR codes and blockchain-based supply chain tracking. Yet counterfeiters adapt rapidly. Sophisticated criminal networks in manufacturing hubs can replicate security holograms within months of their introduction. The economic incentives are simply too powerful: margins on counterfeit luxury goods can exceed 1,000%, and the legal consequences in many jurisdictions are minimal.</p>

        <p>Law enforcement faces jurisdictional challenges that further complicate prosecution. A counterfeit product may be manufactured in one country, packaged in another, shipped through a third, and sold to consumers in a fourth. International cooperation, while improving, remains slow compared to the agility of criminal networks.</p>

        <h2>How AI and Open Data Are Changing the Game</h2>
        <p>The most promising recent development in anti-counterfeiting is the democratization of verification technology. For decades, product authentication was the exclusive domain of brand protection specialists with access to proprietary systems. Today, a combination of open data initiatives and AI-powered mobile applications has put that power in the hands of every consumer.</p>

        <p>Public product registries, government-maintained drug directories, global trade item records, and pharmaceutical verification systems provide the foundation for consumer-facing verification tools. These datasets, combined with machine learning models trained on millions of product images, enable real-time authenticity checks that would have required laboratory analysis a decade ago.</p>

        <h2>The Role of Consumer-Driven Verification</h2>
        <p>Platforms like Veri9 aggregate data from these public sources alongside proprietary brand partnerships and a growing community of verified user reports. When a consumer scans a barcode, that data point — whether it returns a verified match or a suspicious mismatch — contributes to a continuously improving intelligence network. Patterns of counterfeit activity in specific product categories or geographic regions emerge from this aggregated data, enabling faster detection of new counterfeit campaigns.</p>

        <p>This crowd-sourced intelligence model represents a fundamental shift in the economics of anti-counterfeiting. Rather than relying solely on reactive enforcement after products reach market, consumer verification creates a real-time early warning system. A spike in barcode mismatches for a specific product in a specific region can alert brand protection teams to a new counterfeit insertion in the supply chain within days rather than months.</p>

        <h2>The Path Forward</h2>
        <p>Technology alone cannot eliminate counterfeiting — it is ultimately an enforcement, policy, and economic challenge. However, widespread adoption of consumer verification tools raises the risk and cost for counterfeiters by making their products harder to sell undetected. As verification becomes a standard consumer habit — as routine as checking reviews before an online purchase — the demand signal for counterfeit goods weakens.</p>

        <p>The convergence of AI, open data, and mobile technology has created an inflection point in the fight against counterfeits. The next decade will determine whether this technology advantage can translate into meaningful reductions in counterfeit market share — and the human harm that comes with it.</p>
      </>
    ),
  },

  'barcode-verification-explained': {
    title: 'Barcode Verification Explained: How Your Phone Can Detect Fakes',
    category: 'Technology',
    author: 'Dr. Sarah Chen',
    date: 'January 5, 2025',
    readTime: '6 min read',
    content: (
      <>
        <p>Every product barcode tells a story — if you know how to read it. The humble black-and-white striped label affixed to virtually every retail product encodes a wealth of information that, when cross-referenced against authoritative sources, can instantly reveal whether a product is genuine, recalled, mislabeled, or counterfeit. Here is how it works.</p>

        <h2>The Anatomy of a Barcode</h2>
        <p>Most consumer products carry either a UPC-A (12-digit) or EAN-13 (13-digit) barcode. The digits encode a company prefix — a globally unique identifier assigned to the brand owner — followed by an item reference number and a single check digit calculated using the Mod-10 algorithm. This mathematical structure means that any barcode with an invalid check digit is either misprinted or fabricated.</p>

        <p>Veri9 performs this checksum validation instantly as the first step in any barcode scan. A failed checksum immediately flags a product as suspicious, even before any further lookups occur. Counterfeit manufacturers frequently reuse barcodes from genuine products or generate random numbers without understanding the underlying checksum algorithm — making this a surprisingly effective first-pass filter.</p>

        <h2>The Verification Network</h2>
        <p>A valid checksum means the barcode is structurally legitimate, but it doesn't confirm the product is genuine. The real power comes from cross-referencing against multiple authoritative sources simultaneously:</p>

        <ul>
          <li><strong>Global Trade Registry:</strong> The authoritative source for company prefix assignments. Veri9 verifies that the company prefix in the barcode belongs to the brand name on the packaging — a mismatch indicates a counterfeit or mislabeled product.</li>
          <li><strong>Food Product Intelligence:</strong> A comprehensive record of over 3 million food products, including ingredients, nutritional data, and product images. Mismatches in product name or category flag potential fakes.</li>
          <li><strong>Pharmaceutical Registry:</strong> The National Drug Code directory covers every pharmaceutical product legally marketed in the United States. Every medication's barcode can be verified against this registry.</li>
          <li><strong>Product Registry:</strong> A comprehensive record covering hundreds of millions of consumer products across all categories.</li>
          <li><strong>Brand Partnership Data:</strong> For participating brands, Veri9 has direct access to the manufacturer's own product registry, enabling verification at the individual unit level.</li>
        </ul>

        <h2>What Happens in 5 Seconds</h2>
        <p>When you scan a barcode with Veri9, the following happens in the background in under five seconds: the barcode value is decoded and the checksum validated; the company prefix is extracted and looked up to identify the brand owner; parallel queries are made to relevant product intelligence sources; product name, category, and manufacturer details are compared against the packaging; active recall status is checked against regulatory records and our proprietary recall aggregation feed; and a confidence score is calculated and displayed alongside the verification result.</p>

        <h2>The Limits of Barcode Verification</h2>
        <p>Barcode verification is powerful but not infallible. A counterfeit manufacturer who sources genuine packaging — or purchases a legitimate product solely for its label — can create a counterfeit that passes barcode checks. This is why Veri9 layers multiple verification methods: QR code authentication, serial number lookup, and AI-powered photo analysis complement barcode scanning to create a multi-factor verification system that is substantially harder to defeat.</p>

        <h2>Getting Started</h2>
        <p>Open Veri9, tap the camera icon, and point it at any product barcode. The scanner works in both bright sunlight and dim indoor lighting, and can read standard 1D barcodes, 2D QR codes, and DataMatrix codes used in pharmaceutical packaging. Scan anything — your pantry, medicine cabinet, online purchase when it arrives — and let Veri9's verification network do the rest.</p>
      </>
    ),
  },

  'protecting-your-family-from-fake-baby-products': {
    title: 'Protecting Your Family from Counterfeit Baby Products',
    category: 'Consumer Safety',
    author: 'Lisa Park',
    date: 'December 28, 2024',
    readTime: '7 min read',
    content: (
      <>
        <p>For parents, few things are more terrifying than discovering that a product you trusted to nourish or protect your child was counterfeit. Yet fake baby products are among the most commonly seized counterfeits at US borders — and many that slip through end up in the hands of families who have no way of knowing their product is fake. Here is what every parent needs to know.</p>

        <h2>The Scope of the Problem</h2>
        <p>The categories most frequently targeted by counterfeiters in the baby product market include infant formula, diapers and wipes, baby monitors, car seats, teething and developmental toys, and topical products such as diaper rash creams and baby sunscreens. The consequences of fake products in these categories range from nutritional deficiency (counterfeit formula with incorrect nutrient concentrations) to chemical exposure (fake personal care products with undeclared harsh ingredients) to physical injury (counterfeit car seats that fail in crashes).</p>

        <p>The 2008 melamine contamination scandal in Chinese infant formula — which killed at least six infants and sickened 300,000 — demonstrated the catastrophic potential of adulterated baby food products. While that scandal involved domestic market fraud rather than international counterfeiting, it illustrated the vulnerability of infant nutrition products to substitution fraud. Counterfeit formula sold in US markets has been found to contain incorrect protein-to-carbohydrate ratios, insufficient vitamins and minerals, and in some cases, potentially harmful additives.</p>

        <h2>Red Flags to Watch For</h2>
        <p>Counterfeit baby products often originate from third-party sellers on major e-commerce platforms. While these platforms have improved their anti-counterfeiting programs significantly, the sheer volume of listings makes comprehensive screening impossible. Warning signs include prices significantly below retail, seller accounts with limited history, packaging with subtle printing imperfections, products that feel different from previous purchases, and listings that show the product "sold by" a third party rather than the brand or an authorized retailer.</p>

        <h2>Scan Before Every Purchase</h2>
        <p>Veri9's barcode scanner cross-references baby products against multiple intelligence sources including food product records (for formula and baby food), safety recall registries (for toys, car seats, and baby gear), and direct brand partnerships. For infant formula specifically, Veri9 verifies the product's registration with the FDA's infant formula notification program — a mandatory requirement for all commercially marketed infant formula in the United States.</p>

        <h2>Car Seat Safety</h2>
        <p>Counterfeit car seats are among the most dangerous fake baby products, as they may pass visual inspection while failing catastrophically in a crash. The National Highway Traffic Safety Administration (NHTSA) maintains records of recalled child restraint systems. Scan the car seat's barcode or enter its model number in Veri9 to check against this registry before installing the seat in your vehicle.</p>

        <h2>Building a Safe Product History</h2>
        <p>Veri9 allows you to save verified products to a personal product history. When you scan and verify a box of diapers or a can of formula, that product is saved to your history. If that product is subsequently recalled, you receive an immediate push notification — no more manually checking recall websites. For parents managing multiple children and dozens of products, this passive recall monitoring can be genuinely lifesaving.</p>
      </>
    ),
  },

  'open-data-movement-product-authenticity': {
    title: 'The Open Data Movement and Product Authenticity',
    category: 'Industry',
    author: 'James Rivera',
    date: 'December 22, 2024',
    readTime: '9 min read',
    content: (
      <>
        <p>The open data movement — the philosophy that data generated or maintained with public resources should be freely accessible to the public — has quietly revolutionized product authenticity verification. Information that once required institutional access and expensive licensing are now available to any developer, researcher, or application builder with an internet connection. The result is a new generation of consumer-facing verification tools that would have been technically and economically impossible just a decade ago.</p>

        <h2>The Foundation: Open Product Records</h2>
        <p>Several open data initiatives form the backbone of modern product verification infrastructure. Community-maintained, freely licensed food product registries now cover more than 3 million products in 170+ countries. Contributed by volunteers scanning products in supermarkets, pharmacies, and online stores, These resources provide product names, ingredient lists, nutritional data, additives, allergens, and product images — all under an open license that allows commercial use.</p>

        <p>The FDA's National Drug Code directory makes the complete registry of pharmaceutical products legally marketed in the United States freely available for download and API access. Every drug product — prescription, OTC, and biological — has a unique NDC that links to the manufacturer, labeler, product name, dosage form, strength, and packaging configuration. This dataset enables any application to verify whether a medication's barcode corresponds to a legitimately registered drug product.</p>

        <p>Global trade item standards organizations publish lookup services for their company prefix registries — enabling verification that a barcode's encoded company prefix matches the brand appearing on the packaging. While full product-level data requires a paid subscription, the company prefix lookup is freely available and provides a critical first-pass verification layer.</p>

        <h2>Government Open Data Initiatives</h2>
        <p>Beyond product records, government open data initiatives have made recall and safety data freely accessible. The CPSC's recall listings, the FDA's MedWatch system, the NHTSA's vehicle and equipment recall records, and the European Commission's RAPEX rapid alert system for dangerous non-food products all provide machine-readable data feeds that can be integrated into consumer applications. Veri9 aggregates recall data from all of these sources, updated multiple times daily, to provide real-time recall status checks for any scanned product.</p>

        <h2>The Community Intelligence Layer</h2>
        <p>Open data sources provide verified, authoritative information — but they are necessarily retrospective. A newly counterfeited product won't appear in any record until it has been detected, analyzed, and reported. This is where community-driven intelligence becomes essential. Platforms that aggregate user-reported counterfeit sightings — with appropriate verification mechanisms to filter out false reports — can detect new counterfeit campaigns days or weeks before they appear in official enforcement notices.</p>

        <p>This community intelligence layer is most effective when it combines data from multiple sources: barcode scan patterns (unusually high rates of "no match" results for a specific product may indicate counterfeit activity), user-submitted photos analyzed by computer vision models for packaging anomalies, and direct reports from brand protection teams who have identified new counterfeits in the field.</p>

        <h2>Challenges and Limitations</h2>
        <p>The open data model is not without limitations. Coverage completeness varies significantly by product category and geography — food products in Europe and North America are well-covered; consumer electronics and household goods less so. Data freshness is another challenge: while major sources are updated regularly, the lag between a product's market launch and its appearance in open records can be weeks or months. And open systems are inherently vulnerable to manipulation — a motivated counterfeiter could, in theory, submit fraudulent product data to a community-maintained resource.</p>

        <p>Robust verification systems address these limitations by layering multiple data sources and using consistency checks across sources. A product that appears in one source but not others, or shows inconsistencies between sources, triggers a deeper analysis rather than an automatic pass or fail.</p>

        <h2>The Road Ahead</h2>
        <p>The open data movement continues to expand. New initiatives are extending open product data to categories like cosmetics, textiles, and construction materials. International cooperation is improving the cross-border linkage of product records. And the growing adoption of digital product passports — a concept being formalized in EU regulation — promises to create a standardized, machine-readable authenticity layer for physical products built on open standards. The combination of these trends suggests that comprehensive, real-time product authenticity verification is moving from a specialized capability to a universal consumer right.</p>
      </>
    ),
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function BlogPostPage({ slug }: { slug: string }) {
  const post = POSTS[slug]

  // ---- 404-style "post not found" ----
  if (!post) {
    return (
      <>
        <Navbar />
        <div style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, -apple-system, sans-serif',
          gap: 16,
          padding: '40px 24px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '4rem' }}>📄</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Article Not Found
          </h1>
          <p style={{ fontSize: '1rem', color: '#64748b', maxWidth: 480, margin: 0 }}>
            This blog post doesn&apos;t exist or may have been removed.
          </p>
          <Link
            href="/blog"
            style={{
              marginTop: 8,
              padding: '12px 28px',
              background: '#6366f1',
              color: '#fff',
              borderRadius: 10,
              fontWeight: 600,
              fontSize: '0.95rem',
              textDecoration: 'none',
            }}
          >
            ← Back to Blog
          </Link>
        </div>
        <Footer />
      </>
    )
  }

  const categoryColor: Record<string, string> = {
    'Consumer Safety': '#10b981',
    'Recall Alerts': '#ef4444',
    'Industry': '#6366f1',
    'Technology': '#3b82f6',
  }

  return (
    <>
      <Navbar />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        padding: '80px 24px 60px',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          {/* Category badge */}
          <span style={{
            display: 'inline-block',
            background: categoryColor[post.category] ?? '#6366f1',
            color: '#fff',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '4px 12px',
            borderRadius: 100,
            marginBottom: 20,
          }}>
            {post.category}
          </span>

          <h1 style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
            fontWeight: 900,
            color: '#fff',
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
            marginBottom: 24,
          }}>
            {post.title}
          </h1>

          {/* Meta */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '1rem',
              flexShrink: 0,
            }}>
              {post.author.charAt(0)}
            </div>
            <div>
              <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '0.9rem', margin: 0 }}>{post.author}</p>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>{post.date} · {post.readTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Article body */}
      <main style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '56px 24px 80px',
        fontFamily: 'Inter, Georgia, serif',
      }}>
        {/* Back link */}
        <Link
          href="/blog"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: '#6366f1',
            fontWeight: 600,
            fontSize: '0.88rem',
            textDecoration: 'none',
            marginBottom: 40,
          }}
        >
          ← All Articles
        </Link>

        {/* Prose */}
        <div style={{
          fontSize: '1.05rem',
          lineHeight: 1.85,
          color: '#1e293b',
        }}>
          <style>{`
            .blog-prose h2 {
              font-size: 1.35rem;
              font-weight: 800;
              color: #0f172a;
              margin: 40px 0 16px;
              letter-spacing: -0.02em;
            }
            .blog-prose p {
              margin: 0 0 20px;
              color: #334155;
            }
            .blog-prose ul {
              margin: 0 0 20px 0;
              padding-left: 24px;
            }
            .blog-prose li {
              margin-bottom: 10px;
              color: #334155;
            }
            .blog-prose strong {
              color: #0f172a;
            }
          `}</style>
          <div className="blog-prose">
            {post.content}
          </div>
        </div>

        {/* Divider */}
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '48px 0' }} />

        {/* CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
          border: '1px solid #c7d2fe',
          borderRadius: 16,
          padding: '32px 36px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e1b4b', margin: '0 0 8px' }}>
            Verify any product in seconds
          </p>
          <p style={{ fontSize: '0.95rem', color: '#4338ca', margin: '0 0 24px' }}>
            Scan barcodes, QR codes, and product photos with Veri9 — for free.
          </p>
          <Link
            href="/dashboard?tab=scanner"
            style={{
              display: 'inline-block',
              padding: '13px 32px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'none',
            }}
          >
            Open Scanner →
          </Link>
        </div>
      </main>

      <Footer />
    </>
  )
}
