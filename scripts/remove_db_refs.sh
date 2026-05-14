#!/bin/bash
# Remove all user-visible database references from Veri9

set -e
cd "$(dirname "$0")/.."

echo "=== Cleaning app/about/AboutClient.tsx ==="
sed -i "s/Architected our real-time multi-database verification engine/Architected our real-time verification engine/" app/about/AboutClient.tsx
sed -i "s/Manages our 9+ database integrations and trust score algorithm/Manages our verification intelligence and trust score algorithm/" app/about/AboutClient.tsx
sed -i "s/Expert in GS1 standards and global supply chain transparency/Expert in global supply chain transparency and brand protection/" app/about/AboutClient.tsx
sed -i "s/We show you exactly which databases we query, what they returned, and how we calculate your trust score/We show you exactly how we verify each product and how we calculate your trust score/" app/about/AboutClient.tsx
sed -i "s/First prototype scans 3 databases/First prototype verifies products across multiple sources/" app/about/AboutClient.tsx
sed -i "s/Expanded to 9 databases\. Launched/Expanded verification coverage to 9+ global sources. Launched/" app/about/AboutClient.tsx
sed -i "s/Partnered with GS1 and launched brand registration/Launched brand registration and partnership program/" app/about/AboutClient.tsx
sed -i "s/label: 'Databases'/label: 'Data Sources'/g" app/about/AboutClient.tsx
sed -i "s/label: 'Databases Queried'/label: 'Sources Queried'/" app/about/AboutClient.tsx
sed -i "s/against 9+ globally trusted databases — from the FDA's drug database to Open Food Facts to GS1 country registries —/against our advanced verification engine — spanning regulatory records, brand registries, and global product intelligence —/" app/about/AboutClient.tsx

echo "=== Cleaning app/donate/DonateClient.tsx ==="
sed -i "s/our databases fresh, and the service free/our verification engine running, and the service free/" app/donate/DonateClient.tsx
sed -i "s/label: 'Databases Queried'/label: 'Sources Queried'/" app/donate/DonateClient.tsx

echo "=== Cleaning app/privacy/PrivacyClient.tsx ==="
sed -i "s/and database coverage//" app/privacy/PrivacyClient.tsx

echo "=== Cleaning app/dashboard/DashboardClient.tsx ==="
sed -i "s/'Open Food Facts'/'Product Intelligence'/" app/dashboard/DashboardClient.tsx
sed -i "s/'OpenFDA Drug DB'/'Drug Intelligence'/" app/dashboard/DashboardClient.tsx
sed -i "s/'Open Beauty Facts'/'Cosmetics Intelligence'/" app/dashboard/DashboardClient.tsx
sed -i "s/'UPC Item Database'/'Product Registry'/" app/dashboard/DashboardClient.tsx
sed -i "s/'Datakick DB'/'Grocery Intelligence'/" app/dashboard/DashboardClient.tsx
sed -i "s/'Open Library'/'Publication Registry'/" app/dashboard/DashboardClient.tsx
sed -i "s/'GS1 Company DB'/'Trade Item Registry'/" app/dashboard/DashboardClient.tsx
sed -i "s/'Querying GS1 registry…'/'Querying trade registries…'/" app/dashboard/DashboardClient.tsx
sed -i "s/'Checking FCC database…'/'Checking regulatory records…'/" app/dashboard/DashboardClient.tsx
sed -i "s/'Querying Open Food Facts…'/'Querying product intelligence…'/" app/dashboard/DashboardClient.tsx
sed -i "s/'Checking OpenFDA database…'/'Checking drug registries…'/" app/dashboard/DashboardClient.tsx
sed -i "s/'Cross-referencing GS1…'/'Cross-referencing trade data…'/" app/dashboard/DashboardClient.tsx
sed -i "s/'Scanning UPC databases…'/'Scanning product registries…'/" app/dashboard/DashboardClient.tsx
sed -i "s/'Checking USDA FoodData…'/'Checking food safety data…'/" app/dashboard/DashboardClient.tsx
sed -i "s/'Verifying with Go-UPC…'/'Running cross-reference checks…'/" app/dashboard/DashboardClient.tsx
sed -i "s/Checking GS1, FCC, brand pattern databases/Checking trade registries, regulatory records, and brand patterns/" app/dashboard/DashboardClient.tsx
sed -i "s/Cross-referencing 18+ global databases/Cross-referencing 18+ global intelligence sources/" app/dashboard/DashboardClient.tsx
sed -i "s/item not in our databases, NOT a fake/item not in our system, NOT a fake/" app/dashboard/DashboardClient.tsx
sed -i "s/no database matched the product at all/no source matched the product at all/" app/dashboard/DashboardClient.tsx
sed -i "s/multiple trusted databases — safe to purchase/multiple trusted sources — safe to purchase/" app/dashboard/DashboardClient.tsx
sed -i "s/label: 'NOT IN DATABASE'/label: 'NOT FOUND'/" app/dashboard/DashboardClient.tsx
sed -i "s/Product not found in our databases'/Product not found in our system'/" app/dashboard/DashboardClient.tsx
sed -i "s/no public database has a record yet/no public record has been found yet/" app/dashboard/DashboardClient.tsx
sed -i "s/label: 'GS1 Prefix'/label: 'Registration Prefix'/" app/dashboard/DashboardClient.tsx
sed -i "s/keeps the databases fresh and the service running/keeps the verification engine running and the service free for everyone/" app/dashboard/DashboardClient.tsx
sed -i "s/Product not found in databases'/Product not found in our system'/" app/dashboard/DashboardClient.tsx
sed -i "s/fetch fresh data from all databases/fetch fresh data from all sources/" app/dashboard/DashboardClient.tsx
sed -i "s/Full product details from 18+ global databases/Full product details from 18+ global intelligence sources/" app/dashboard/DashboardClient.tsx
sed -i "s/fresh lookup from all databases on your next scan/fresh lookup from all sources on your next scan/" app/dashboard/DashboardClient.tsx

echo "=== Cleaning app/layout.tsx ==="
sed -i "s/9+ global databases including GS1, FDA, and Open Food Facts/advanced intelligence and global product records/" app/layout.tsx
sed -i "s/Cross-reference 9+ global databases to/Cross-reference global intelligence sources to/" app/layout.tsx
sed -i "s/\"GS1 lookup\"/\"Barcode lookup\"/" app/layout.tsx

echo "=== Cleaning app/page.tsx ==="
sed -i "s/cross-referencing across 30+ global databases/cross-referencing across 30+ global intelligence sources/" app/page.tsx
sed -i "s/{ num: '30+', label: 'Databases' }/{ num: '30+', label: 'Data Sources' }/" app/page.tsx
sed -i "s/title: 'Cross-Reference Databases'/title: 'AI-Powered Analysis'/" app/page.tsx
sed -i "s/We instantly check 30+ global databases including GS1, OpenFDA, USDA and more simultaneously/We instantly cross-reference 30+ global intelligence sources to verify product authenticity/" app/page.tsx
sed -i "s/\['GS1', 'OpenFDA', 'USDA', 'EAN'\]/['Registries', 'Regulatory', 'Safety', 'Trade']/" app/page.tsx

echo "=== Cleaning app/faq/FaqClient.tsx ==="
sed -i "s/It cross-references 9+ global databases including GS1, FDA, and Open Food Facts/It cross-references 9+ global intelligence sources to verify product authenticity/" app/faq/FaqClient.tsx
sed -i "s/multiple global databases including the GS1 registry (which tracks over 300 million products), FDA databases, and open-source product databases/multiple global intelligence sources including trade registries (which track over 300 million products), regulatory records, and product intelligence networks/" app/faq/FaqClient.tsx
sed -i "s/multiple authoritative databases to provide/multiple authoritative sources to provide/" app/faq/FaqClient.tsx
sed -i "s/through its databases\. This/through its verification engine. This/" app/faq/FaqClient.tsx
sed -i "s/or simply a product not yet in our databases\./or simply a product not yet in our system./" app/faq/FaqClient.tsx
sed -i "s/What databases does Veri9 check/What sources does Veri9 check/" app/faq/FaqClient.tsx
sed -i "s/Veri9 checks the GS1 global registry (300M+ products), FDA drug and device databases, Open Food Facts, Open Beauty Facts, and several other open-source product databases/Veri9 checks global trade registries (300M+ products), regulatory records, food and cosmetics intelligence networks, and several other product intelligence sources/" app/faq/FaqClient.tsx
sed -i "s/all GS1-registered product categories/all barcode-registered product categories/" app/faq/FaqClient.tsx
sed -i "s/It accesses the GS1 international registry which/It accesses international trade registries which/" app/faq/FaqClient.tsx
sed -i "s/uses GS1 barcodes/uses standard barcodes/" app/faq/FaqClient.tsx
sed -i "s/improve our database and/improve our system and/" app/faq/FaqClient.tsx

echo "=== Cleaning app/api-docs/ApiDocsClient.tsx ==="
sed -i "s/against all 9+ global databases/against all 9+ global intelligence sources/" app/api-docs/ApiDocsClient.tsx
sed -i "s/from our databases without/from our verification engine without/" app/api-docs/ApiDocsClient.tsx
sed -i "s/not found in any database/not found in our system/" app/api-docs/ApiDocsClient.tsx

echo "=== Cleaning app/blog/BlogClient.tsx ==="
sed -i "s/cross-references 9+ databases to/cross-references global intelligence sources to/" app/blog/BlogClient.tsx
# Replace the full excerpt for the open-data post
sed -i "74s/.*/    excerpt: 'How open data and public registries are making product verification accessible to everyone.',/" app/blog/BlogClient.tsx

echo "=== Cleaning app/blog/[slug]/BlogPostClient.tsx ==="
sed -i "s/FDA\/CPSC recall databases/regulatory recall records/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/the official FDA recall database at/the official FDA recall listings at/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/directory and recall database in real time/directory and recall records in real time/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/carries a GS1-certified barcode/carries a certified barcode/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/encode a GS1 Company Prefix/encode a company prefix/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/calculated using the GS1 Mod-10 algorithm/calculated using the Mod-10 algorithm/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/The Database Network/The Verification Network/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/cross-referencing against multiple authoritative databases/cross-referencing against multiple authoritative sources/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/before any database lookups occur/before any further lookups occur/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/GS1 Global Registry:/Global Trade Registry:/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/GS1 Company Prefix assignments/company prefix assignments/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/Open Food Facts:/Food Product Intelligence:/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/A community-maintained database of over 3 million food products/A comprehensive record of over 3 million food products/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/FDA NDC Database:/Pharmaceutical Registry:/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/UPC Database:/Product Registry:/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/A comprehensive registry covering hundreds of millions/A comprehensive record covering hundreds of millions/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/the GS1 company prefix is extracted/the company prefix is extracted/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/parallel API calls are made to relevant product databases/parallel queries are made to relevant product intelligence sources/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/product name, category, and manufacturer details from the database are/product name, category, and manufacturer details are/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/checked against the FDA, CPSC, and our proprietary recall aggregation feed/checked against regulatory records and our proprietary recall aggregation feed/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/access to proprietary databases/access to proprietary systems/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/open databases like Open Food Facts (now covering over 3 million food products), the FDA's National Drug Code directory, GS1's global product registry, and the European Medicines Verification Organisation's database provide the foundation/public product registries, government-maintained drug directories, global trade item records, and pharmaceutical verification systems provide the foundation/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/Platforms like Veri9 aggregate data from these open databases/Platforms like Veri9 aggregate data from these public sources/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/against authoritative databases, can instantly reveal/against authoritative sources, can instantly reveal/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/including Open Food Facts (for formula and baby food), the CPSC's recall database (for toys/including food product records (for formula and baby food), safety recall registries (for toys/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/NHTSA) maintains a database of recalled child restraint systems/NHTSA) maintains records of recalled child restraint systems/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/to check against this database before/to check against this registry before/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/The Foundation: Open Product Databases/The Foundation: Open Product Records/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/Several open databases form the backbone/Several open data initiatives form the backbone/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/Open Food Facts is perhaps the most impressive: a community-maintained, freely licensed database/Community-maintained, freely licensed food product registries now cover/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/of food products from around the world, now covering over 3 million products in more than 170 countries. Contributed by volunteers/more than 3 million products in 170+ countries. Contributed by volunteers/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/Open Food Facts provides product/These resources provide product/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/The FDA's National Drug Code database makes/The FDA's National Drug Code directory makes/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/GS1, the non-profit organization that maintains the global barcode standard, publishes lookup services for its company prefix registry/Global trade item standards organizations publish lookup services for their company prefix registries/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/While full product-level data in the GS1 registry requires/While full product-level data requires/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/Government Open Data Initiatives/Government Open Data Initiatives/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/The CPSC's recall database, the FDA's MedWatch system, the NHTSA's vehicle and equipment recall database/The CPSC's recall listings, the FDA's MedWatch system, the NHTSA's vehicle and equipment recall records/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/Open data databases provide/Open data sources provide/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/won't appear in any database until/won't appear in any record until/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/Database completeness varies/Coverage completeness varies/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/while major databases are updated/while major sources are updated/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/And open databases are inherently/And open systems are inherently/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/a community-maintained database/a community-maintained resource/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/A product that appears in one database but not others/A product that appears in one source but not others/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/shows inconsistencies between databases/shows inconsistencies between sources/" "app/blog/[slug]/BlogPostClient.tsx"
sed -i "s/cross-border linkage of product databases/cross-border linkage of product records/" "app/blog/[slug]/BlogPostClient.tsx"

echo "=== Cleaning app/cookies/CookiesClient.tsx ==="
sed -i "s/and database provider/and backend provider/" app/cookies/CookiesClient.tsx

echo "=== Cleaning app/careers/CareersClient.tsx ==="
sed -i "s/product database pipelines/product intelligence pipelines/" app/careers/CareersClient.tsx
sed -i "s/Work with GS1, FDA, USDA and other global data sources/Work with global data sources and verification systems/" app/careers/CareersClient.tsx

echo "=== Cleaning app/terms/TermsClient.tsx ==="
sed -i "s/against publicly available databases to/against global intelligence sources to/" app/terms/TermsClient.tsx

echo "=== Cleaning lib/seo.ts ==="
sed -i "s/Veri9 cross-references 9+ global databases including GS1, FDA, and open food facts to detect counterfeits/Veri9 cross-references 9+ global intelligence sources to detect counterfeits/" lib/seo.ts
sed -i "s/Cross-reference 9+ global databases to/Cross-reference global intelligence sources to/" lib/seo.ts
sed -i "s/against GS1, FDA, and 9+ global databases/against 9+ global intelligence sources/" lib/seo.ts
sed -i "s/cross-references global databases to/cross-references global intelligence sources to/" lib/seo.ts
sed -i "s/what databases we check/what sources we check/" lib/seo.ts
sed -i "s/barcode-verification-101-how-gs1-databases-work/barcode-verification-101-how-verification-sources-work/g" lib/seo.ts
sed -i "s/How GS1 Databases Work/How Verification Sources Work/g" lib/seo.ts
sed -i "s/GS1 global standards, UPC\/EAN barcode formats, and how Veri9 uses these sources/barcode standards, UPC\/EAN formats, and how Veri9 uses these sources/" lib/seo.ts
sed -i "s/GS1 standards, and how Veri9/barcode standards, and how Veri9/" lib/seo.ts

echo "=== Cleaning lib/jsonld.ts ==="
sed -i "s/It cross-references 9+ global databases including GS1, FDA, and Open Food Facts/It cross-references 9+ global intelligence sources to verify product authenticity/" lib/jsonld.ts
sed -i "s/multiple global databases including the GS1 registry (which tracks over 300 million products), FDA databases, and open-source product databases/multiple global intelligence sources including trade registries (which track over 300 million products), regulatory records, and product intelligence networks/" lib/jsonld.ts
sed -i "s/multiple authoritative databases to provide/multiple authoritative sources to provide/" lib/jsonld.ts
sed -i "s/through its databases\. This/through its verification engine. This/" lib/jsonld.ts
sed -i "s/or simply a product not yet in our databases\./or simply a product not yet in our system./" lib/jsonld.ts
sed -i "s/all GS1-registered product categories/all barcode-registered product categories/" lib/jsonld.ts
sed -i "s/It accesses the GS1 international registry which/It accesses international trade registries which/" lib/jsonld.ts
sed -i "s/uses GS1 barcodes/uses standard barcodes/" lib/jsonld.ts

echo "=== Cleaning app/sitemap.ts ==="
sed -i "s/barcode-verification-101-how-gs1-databases-work/barcode-verification-101-how-verification-sources-work/" app/sitemap.ts

echo "=== Cleaning lib/platform-config.ts ==="
sed -i "s/with 30+ databases/with advanced verification/" lib/platform-config.ts

echo "=== All done! ==="
