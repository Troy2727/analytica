import { supabase } from "@/config/supabase";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface TrackingData {
  domain: string;
  url: string;
  event: 'session_start' | 'pageview' | 'session_end';
  source?: string;
  operatingSystem?: string;
  deviceType?: string;
  browserName?: string;
}

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

// Vercel adds these geo headers to every request in production
function getLocation(request: NextRequest) {
  const city = request.headers.get("x-vercel-ip-city");
  const region = request.headers.get("x-vercel-ip-country-region");
  const countryCode = request.headers.get("x-vercel-ip-country");
  return {
    city: city ? decodeURIComponent(city) : "Unknown",
    region: region || "Unknown",
    country: countryCode ? countryNames.of(countryCode) || "Unknown" : "Unknown",
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as TrackingData;
    const { 
      domain, 
      url, 
      event, 
      source,
      operatingSystem,
      deviceType,
      browserName,
    } = data;
    
    const { city, region, country } = getLocation(request);

    if (!url.includes(domain)) {
      return NextResponse.json(
        { error: "Domain mismatch" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (event === "pageview") {
      const { error } = await supabase
        .from("page_views")
        .insert([{ 
          domain, 
          page: url,
          city,
          region,
          country,
          operating_system: operatingSystem || 'Unknown',
          device_type: deviceType || 'Unknown',
          browser_name: browserName || 'Unknown',
        }]);

      if (error) throw error;
    }

    if (event === "session_start") {
      const { error } = await supabase
        .from("visits")
        .insert([{ 
          website_id: domain, 
          source: source || "direct",
        }]);

      if (error) throw error;
    }

    return NextResponse.json(
      { success: true, data }, 
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error processing tracking request:', error);
    return NextResponse.json(
      { error: "Failed to process tracking request" },
      { status: 500, headers: corsHeaders }
    );
  }
}