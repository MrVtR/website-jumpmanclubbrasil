import { getSettings } from "@/lib/sanity/client";
import Contact from "./contato";

export default async function ContactPage() {
  const settings = await getSettings();
  return <Contact settings={settings} />;
}

// export const revalidate = 60;
