/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KAKAO_MAP_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// kakao type is declared in types.ts
