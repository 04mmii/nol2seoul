import { useEffect, useState } from "react";

export const useKakaoLoader = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_KAKAO_MAP_API_KEY;

    if (!apiKey) {
      const msg = "VITE_KAKAO_MAP_API_KEY 환경변수가 설정되지 않았습니다.";
      console.error(msg);
      setError(msg);
      return;
    }

    // 이미 로드 완료된 경우
    if (window.kakao?.maps) {
      try {
        window.kakao.maps.load(() => {
          setIsLoaded(true);
        });
      } catch (e) {
        setError("카카오맵 초기화 실패");
      }
      return;
    }

    const existingScript = document.getElementById("kakao-map-script");
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.kakao?.maps) {
          window.kakao.maps.load(() => setIsLoaded(true));
        } else {
          setError("카카오맵 SDK 로드 후 초기화 실패");
        }
      });
      existingScript.addEventListener("error", () => {
        setError("카카오맵 SDK 스크립트 로드 실패");
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "kakao-map-script";
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services,clusterer&autoload=false`;
    script.async = true;

    script.onload = () => {
      if (window.kakao?.maps) {
        window.kakao.maps.load(() => {
          setIsLoaded(true);
        });
      } else {
        setError("카카오맵 SDK 로드 후 kakao.maps 객체를 찾을 수 없습니다.");
      }
    };

    script.onerror = () => {
      const msg = "카카오맵 SDK 로드 실패 - API 키 또는 도메인 설정을 확인하세요.";
      console.error(msg, { apiKey: apiKey.slice(0, 4) + "..." });
      setError(msg);
    };

    document.head.appendChild(script);
    // cleanup에서 스크립트 제거하지 않음 (재사용을 위해)
  }, []);

  return { isLoaded, error };
};
