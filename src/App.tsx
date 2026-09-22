import TelegramBackdrop from "./scene/TelegramBackdrop";
import CrtOverlay from "./components/CrtOverlay";
import PanelContainer from "./components/PanelContainer";
import HeroIdentity from "./components/HeroIdentity";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0 }}>
      <TelegramBackdrop />
      <HeroIdentity />
      <CrtOverlay />
      <PanelContainer />
    </div>
  );
}

export default App;
