import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { processCampaignCharges } from "@/inngest/functions/process-campaign-charges";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processCampaignCharges],
});
