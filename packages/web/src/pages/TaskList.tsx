import { useState, useEffect } from "react";
import { listTasks } from "../api/client.js";
import type { TaskSummary } from "../api/client.js";

const STATUS_COLORS: Record<string, string> = {
  pending: "#6c757d",
  validating: "#0d6efd",
  awaiting_approval: "#ffc107",
  running: "#0dcaf0",
  completed: "#198754",
  failed: "#dc3545",
  cancelled: "#6c757d",
};

interface Props {
  onSelectTask: (id: string) => void;
}

export function TaskList({ onSelectTask }: Props) {
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await listTasks();
      setTasks(data);
    } catch {
      setError("タスクの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading) return <p>読み込み中...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>タスク一覧</h2>
        <button onClick={() => void load()}>更新</button>
      </div>
      {tasks.length === 0 ? (
        <p>タスクはありません</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8f9fa" }}>
              <th style={th}>名前</th>
              <th style={th}>状態</th>
              <th style={th}>プロバイダ</th>
              <th style={th}>環境</th>
              <th style={th}>投入元</th>
              <th style={th}>作成日時</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => onSelectTask(task.id)}
                style={{ cursor: "pointer", borderBottom: "1px solid #dee2e6" }}
              >
                <td style={td}>{task.script.metadata.name}</td>
                <td style={td}>
                  <span
                    style={{
                      background: STATUS_COLORS[task.status] ?? "#6c757d",
                      color: "white",
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: "0.8rem",
                    }}
                  >
                    {task.status}
                  </span>
                </td>
                <td style={td}>{task.script.spec.provider}</td>
                <td style={td}>{task.script.spec.environment}</td>
                <td style={td}>{task.source}</td>
                <td style={td}>{new Date(task.createdAt).toLocaleString("ja-JP")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const th: React.CSSProperties = { padding: "0.5rem 1rem", textAlign: "left", borderBottom: "2px solid #dee2e6" };
const td: React.CSSProperties = { padding: "0.5rem 1rem" };
