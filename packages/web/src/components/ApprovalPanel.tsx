import { approveTask, cancelTask } from "../api/client.js";

interface Props {
  taskId: string;
  status: string;
  onUpdated: () => void;
}

export function ApprovalPanel({ taskId, status, onUpdated }: Props) {
  if (status !== "awaiting_approval") return null;

  const handleApprove = async () => {
    await approveTask(taskId);
    onUpdated();
  };

  const handleReject = async () => {
    await cancelTask(taskId);
    onUpdated();
  };

  return (
    <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 4, padding: "1rem", marginTop: "1rem" }}>
      <strong>承認待ち</strong>
      <p>このタスクは本番環境への変更を含みます。実行を承認しますか？</p>
      <button
        onClick={() => void handleApprove()}
        style={{ background: "#198754", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: 4, cursor: "pointer", marginRight: "0.5rem" }}
      >
        承認して実行
      </button>
      <button
        onClick={() => void handleReject()}
        style={{ background: "#dc3545", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: 4, cursor: "pointer" }}
      >
        却下
      </button>
    </div>
  );
}
