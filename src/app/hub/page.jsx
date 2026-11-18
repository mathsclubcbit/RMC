import { createAdminClient } from "@/lib/supabase/server";
import HubStatic from "./HubStatic";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getHubData() {
    const supabase = createAdminClient();

    const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "hub")
        .single();

    if (error || !data) {
        return { categories: [] };
    }

    return data.value || { categories: [] };
}

export default async function HubPage() {
    const hubData = await getHubData();

    // Passing data to the Client Component
    return <HubStatic initialData={hubData} />;
}
