import { useState } from "react";
import { TaskList } from "./pages/TaskList.js";
import { TaskDetail } from "./pages/TaskDetail.js";

export function App() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 1200, margin: "0 auto", padding: "1rem" }}>
      <header style={{ borderBottom: "2px solid #dee2e6", marginBottom: "1.5rem", paddingBottom: "1rem" }}>
        <h1 style={{ margin: 0 }}>
          <span style={{ color: "#0d6efd" }}>Cloud</span>Pilot
        </h1>
        <small style={{ color: "#6c757d" }}>AIエージェント連携マルチクラウド デプロイ・監視ツール</small>
      </header>

      <main>
        {selectedTaskId ? (
          <TaskDetail taskId={selectedTaskId} onBack={() => { setSelectedTaskId(null); }} />
        ) : (
          <TaskList onSelectTask={setSelectedTaskId} />
        )}
      </main>
    </div>
  );
}
