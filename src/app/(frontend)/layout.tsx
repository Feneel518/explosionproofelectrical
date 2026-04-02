import Footer from "@/components/frontend/Footer";
import Navbar from "@/components/frontend/Navbar";
import MagneticLightCursor from "@/lib/actions/frontend/MagneticLightCursor";
import type { Metadata } from "next";
import Script from "next/script";
import {
  COMPANY_ADDRESS,
  COMPANY_EMAIL,
  COMPANY_GSTIN,
  SITE_BRAND,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_SHORT_NAME,
  SITE_URL,
} from "@/lib/seo/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Flameproof & Explosion-Proof Electrical Manufacturer`,
    template: "%s | ExEC",
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_SHORT_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Industrial Manufacturing",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_BRAND,
    title: `${SITE_NAME} | Flameproof & Explosion-Proof Electrical Manufacturer`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Flameproof Manufacturer`,
      },
    ],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Flameproof & Explosion-Proof Electrical Manufacturer`,
    description: SITE_DESCRIPTION,
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  other: {
    "geo.region": "IN-GJ",
    "geo.placename": "Vapi",
    "geo.position": "20.3893;72.9106",
    ICBM: "20.3893, 72.9106",
  },
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function FrontendLayout({ children }: Readonly<LayoutProps>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    alternateName: SITE_SHORT_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/asset/fullLogo.png`,
    email: COMPANY_EMAIL,
    taxID: COMPANY_GSTIN,
    address: {
      "@type": "PostalAddress",
      ...COMPANY_ADDRESS,
    },
    areaServed: [
      "Vapi",
      "Gujarat",
      "India",
      "Silvassa",
      "Daman",
      "Valsad",
    ],
  };

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE_NAME,
    image: `${SITE_URL}/asset/fullLogo.png`,
    url: SITE_URL,
    email: COMPANY_EMAIL,
    address: {
      "@type": "PostalAddress",
      ...COMPANY_ADDRESS,
    },
    priceRange: "$$",
    areaServed: "India",
    description: SITE_DESCRIPTION,
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: SITE_SHORT_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/catalog?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <div className="max-w-screen-2xl mx-auto text-white max-lg:mx-4 flex flex-col min-h-screen">
      <Script
        id="organization-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Script
        id="local-business-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      <Script
        id="website-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      <div className="flex-1">
        <Navbar />
        <div>{children}</div>
      </div>
      <Footer />
      <MagneticLightCursor />
    </div>
  );
}
