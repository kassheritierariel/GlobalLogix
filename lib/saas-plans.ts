export const SaaSPlanIds = ["starter", "operations", "enterprise"] as const;
export type SaaSPlanId = (typeof SaaSPlanIds)[number];

export const BillingCycles = ["monthly", "annual"] as const;
export type BillingCycle = (typeof BillingCycles)[number];

export type SaaSPlan = {
  id: SaaSPlanId;
  name: string;
  description: string;
  shipmentLimit: number | null;
  teamMemberLimit: number | null;
  includesClientPortal: boolean;
  includesRealtimeTracking: boolean;
  includesAdvancedExports: boolean;
  includesPrioritySupport: boolean;
};

export const SAAS_PLANS: readonly SaaSPlan[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Pour une agence qui structure son suivi opérationnel.",
    shipmentLimit: 100,
    teamMemberLimit: 3,
    includesClientPortal: true,
    includesRealtimeTracking: true,
    includesAdvancedExports: false,
    includesPrioritySupport: false,
  },
  {
    id: "operations",
    name: "Operations",
    description: "Pour des équipes qui pilotent des flux multimodaux réguliers.",
    shipmentLimit: 1_000,
    teamMemberLimit: 15,
    includesClientPortal: true,
    includesRealtimeTracking: true,
    includesAdvancedExports: true,
    includesPrioritySupport: false,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Pour les agences à volumétrie et besoins de gouvernance avancés.",
    shipmentLimit: null,
    teamMemberLimit: null,
    includesClientPortal: true,
    includesRealtimeTracking: true,
    includesAdvancedExports: true,
    includesPrioritySupport: true,
  },
] as const;

export function getSaaSPlan(planId: string): SaaSPlan | undefined {
  return SAAS_PLANS.find((plan) => plan.id === planId);
}

export function isPlanWithinLimit(used: number, limit: number | null): boolean {
  return limit === null || used < limit;
}
