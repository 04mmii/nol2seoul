import { useEffect, useState } from "react";

export const useKakaoLoader = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 이미 로드 완료된 경우
    if (window.kakao?.maps) {
      window.kakao.maps.load(() => {
        setIsLoaded(true);
      });
      return;
    }

    const existingScript = document.getElementById("kakao-map-script");
    if (existingScript) {
      // 스크립트 태그는 있지만 아직 로드 안 된 경우 대기
      existingScript.addEventListener("load", () => {
        window.kakao.maps.load(() => {
          setIsLoaded(true);
        });
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-map-script";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${
      import.meta.env.VITE_KAKAO_MAP_API_KEY
    }&libraries=services,clusterer&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        setIsLoaded(true);
      });
    };

    script.onerror = () => {
      console.error("카카오맵 SDK 로드 실패 - API 키 또는 도메인 설정을 확인하세요.");
    };

    document.head.appendChild(script);
    // cleanup에서 스크립트 제거하지 않음 (재사용을 위해)
  }, []);

  return { isLoaded };
};
