import { useCallback, useEffect } from "react";
import { ScalarType, useExecutorchModule, type TensorPtr } from "react-native-executorch";

import { FEATURE_COUNT } from "../constants/model";
import { useModelStore } from "../stores/modelStore";

export interface UseTabularModelResult {
  isReady: boolean;
  predict: (features: number[]) => Promise<number>;
}

export function useTabularModel(): UseTabularModelResult {
  const setMlp = useModelStore((s) => s.setMlp);
  const setError = useModelStore((s) => s.setError);

  const mod = useExecutorchModule({
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modelSource: require("../../assets/models/mlp.pte"),
  });

  useEffect(() => {
    if (mod.isReady) setMlp("ready");
    else if (mod.error) {
      setMlp("error");
      setError(String(mod.error));
    } else setMlp("loading");
  }, [mod.isReady, mod.error, setMlp, setError]);

  const predict = useCallback(
    async (features: number[]): Promise<number> => {
      if (!mod.isReady) throw new Error("MLP not ready");
      if (features.length !== FEATURE_COUNT) {
        throw new Error(
          `Expected ${FEATURE_COUNT} features, got ${features.length}`
        );
      }
      const input: TensorPtr = {
        dataPtr: new Float32Array(features),
        sizes: [1, FEATURE_COUNT],
        scalarType: ScalarType.FLOAT,
      };
      const out = await mod.forward([input]);
      const first = out[0];
      if (!first) throw new Error("MLP returned empty output");
      const buf = first.dataPtr as Float32Array;
      const logit = buf[0] ?? 0;
      return 1 / (1 + Math.exp(-logit));
    },
    [mod]
  );

  return { isReady: Boolean(mod.isReady), predict };
}
