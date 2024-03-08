import "./App.css";
import { MainPage } from "./MainPage";
import "./styles.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route element={<>Not found</>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
