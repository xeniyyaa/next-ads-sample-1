"use client";

import Script from "next/script";

export default function NextAdsScript() {
  return <Script src="https://api-dev.next-ads-server-dev.com/script/tag.js?websiteId=8" 
  strategy="afterInteractive" />;
}
