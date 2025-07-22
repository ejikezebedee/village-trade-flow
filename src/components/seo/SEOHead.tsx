import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  twitterCard?: string;
  structuredData?: object;
  noIndex?: boolean;
}

export function SEOHead({
  title = "VillageMarket - Connect Rural Communities to Global Markets",
  description = "Discover authentic rural products from local communities. Shop handmade crafts, fresh produce, and traditional goods while supporting sustainable village economies.",
  keywords = [
    "rural marketplace", 
    "village products", 
    "handmade crafts", 
    "local produce", 
    "traditional goods", 
    "sustainable shopping",
    "community commerce",
    "artisan products"
  ],
  canonical,
  ogType = "website",
  ogImage = "/og-image.jpg",
  twitterCard = "summary_large_image",
  structuredData,
  noIndex = false
}: SEOHeadProps) {
  const siteName = "VillageMarket";
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const keywordsString = keywords.join(", ");
  const currentUrl = canonical || window.location.href;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsString} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={title} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="author" content="VillageMarket" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      
      {/* Additional Meta for E-commerce */}
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="format-detection" content="telephone=no" />
    </Helmet>
  );
}

// Utility function to generate structured data for products
export function generateProductStructuredData(product: any) {
  return {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "description": product.description,
    "image": Array.isArray(product.images) ? product.images : [product.images],
    "brand": {
      "@type": "Brand",
      "name": product.brand_name || "VillageMarket Artisan"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": product.currency || "USD",
      "price": product.price,
      "availability": product.stock_quantity > 0 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "condition": "https://schema.org/NewCondition"
    },
    "aggregateRating": product.avg_rating > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": product.avg_rating,
      "reviewCount": product.sales_count || 0
    } : undefined,
    "category": product.category
  };
}

// Utility function to generate structured data for product listings
export function generateProductListingStructuredData(products: any[], listingType: string) {
  return {
    "@context": "https://schema.org/",
    "@type": "ItemList",
    "name": `${listingType} - VillageMarket`,
    "description": `Browse our ${listingType.toLowerCase()} collection featuring authentic rural and artisan products`,
    "numberOfItems": products.length,
    "itemListElement": products.map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": product.name,
        "url": `${window.location.origin}/products/${product.id}`,
        "image": Array.isArray(product.images) && product.images.length > 0 
          ? product.images[0] 
          : undefined,
        "offers": {
          "@type": "Offer",
          "price": product.price,
          "priceCurrency": product.currency || "USD"
        }
      }
    }))
  };
}