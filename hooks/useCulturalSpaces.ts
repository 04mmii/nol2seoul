import { useReactQuery } from "./useReactQuery";
import { CulturalSpace } from "../types";

async function fetchCulturalSpaces(): Promise<CulturalSpace[]> {
  const res = await fetch(`/api/seoulapi?type=space`);
  const data = await res.json();
  return data?.culturalSpaceInfo?.row ?? [];
}

export const useCulturalSpaces = () => {
  const { data, isLoading, isError, error } = useReactQuery<CulturalSpace[]>(
    ["culturalSpaces"],
    fetchCulturalSpaces
  );

  return {
    spaces: data ?? [],
    loading: isLoading,
    isError,
    error,
  };
};
