import { tasteAnalyzerAgent } from "./tasteAnalyzer.agent";
import { inventoryResearcherAgent } from "./inventoryResearcher.agent";
import { recommendationCuratorAgent } from "./recommendationCurator.agent";

export const orchestratorAgent = async (prompt: string) => {
  const tasteProfile = await tasteAnalyzerAgent(prompt);
  const matches = await inventoryResearcherAgent(tasteProfile);
  const recommendations = await recommendationCuratorAgent(matches);

  return {
    tasteProfile,
    matches,
    recommendations,
  };
};
