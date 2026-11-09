// Main app - composes chrome + selected page + tweaks

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layout": "editorial",
  "accent": "#ff5a3c",
  "showTicker": true,
  "density": "comfortable"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [activeNav, setActiveNav] = React.useState("home");

  React.useEffect(() => {
    document.documentElement.style.setProperty("--tangerine", tweaks.accent);
  }, [tweaks.accent]);

  // sync hash
  React.useEffect(() => {
    const onHash = () => {
      const h = location.hash.slice(1) || "home";
      setActiveNav(h);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = (id) => {
    location.hash = id;
    setActiveNav(id);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const renderPage = () => {
    switch (activeNav) {
      case "events": return <EventsPage />;
      case "map": return <MapPage />;
      case "night": return <NightPage />;
      case "stories": return <StoriesPage />;
      case "my": return <MyPage />;
      case "detail": return <DetailPage onBack={() => navigate("home")} />;
      default:
        if (tweaks.layout === "bulletin") return <BulletinLayout />;
        if (tweaks.layout === "index") return <IndexLayout />;
        return <EditorialLayout onDetail={() => navigate("detail")} />;
    }
  };

  return (
    <div className="page">
      <UtilityBar />
      <Header activeNav={activeNav} setActiveNav={navigate} />
      {tweaks.showTicker && activeNav !== "map" && <Ticker />}
      <main>{renderPage()}</main>
      {activeNav !== "map" && <Footer />}

      <TweaksPanel title="Tweaks">
        <TweakSection label="페이지">
          <TweakSelect
            label="현재 페이지"
            value={activeNav}
            onChange={navigate}
            options={[
              { value: "home", label: "홈 (랜딩)" },
              { value: "events", label: "문화행사" },
              { value: "map", label: "지도탐색" },
              { value: "night", label: "야경명소" },
              { value: "stories", label: "스토리" },
              { value: "my", label: "마이페이지" },
              { value: "detail", label: "행사 상세" },
            ]}
          />
        </TweakSection>
        {activeNav === "home" && (
          <TweakSection label="홈 레이아웃 변형">
            <TweakSelect
              label="레이아웃"
              value={tweaks.layout}
              onChange={v => setTweak("layout", v)}
              options={[
                { value: "editorial", label: "Editorial — 매거진" },
                { value: "bulletin", label: "Bulletin — 핀 보드" },
                { value: "index", label: "Index — 목록·타이포" },
              ]}
            />
          </TweakSection>
        )}
        <TweakSection label="전역 설정">
          <TweakToggle
            label="상단 티커"
            value={tweaks.showTicker}
            onChange={v => setTweak("showTicker", v)}
          />
          <TweakColor
            label="포인트 컬러"
            value={tweaks.accent}
            onChange={v => setTweak("accent", v)}
            options={["#ff5a3c", "#2746ff", "#e54223", "#16a34a"]}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
