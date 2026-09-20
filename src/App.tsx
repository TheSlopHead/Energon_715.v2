import BustScene from "./scene/BustScene";
import TelegramBackdrop from "./scene/TelegramBackdrop";
import CrtOverlay from "./components/CrtOverlay";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh", margin: 0, padding: 0 }}>
      <TelegramBackdrop />
      <BustScene />
      <CrtOverlay />
    </div>
  );
}

export default App;
