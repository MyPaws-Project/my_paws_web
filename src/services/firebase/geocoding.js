const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export async function geocodeAddress(address) {
  try {
    if (!GOOGLE_MAPS_KEY) {
      console.error("Missing Google Maps API key");
      return null;
    }

    if (!address?.trim()) return null;

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${GOOGLE_MAPS_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK" || !data.results?.length) return null;

    const { lat, lng } = data.results[0].geometry.location;
    return { latitude: lat, longitude: lng };
  } catch (err) {
    console.error("GEOCODE fetch failed:", err);
    return null;
  }
}