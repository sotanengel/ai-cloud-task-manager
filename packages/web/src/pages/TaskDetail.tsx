import { useState, useEffect } from "react";
import { getTask } from "../api/client.js";
import type { TaskDetail as TDetail } from "../api/client.js";
import { ValidationErrorList } from "../components/ValidationError.js";
import { ApprovalPanel } from "../components/ApprovalPanel.js";

interface Props {
  taskId: string;
  onBack: () => void;
}

export function TaskDetail({ taskId, onBack }: Props) {
  const [task, setTask] = useState<TDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await getTask(taskId);
    setTask(data);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [taskId]);

  if (loading) return <p>読み込み中...</p>;
  if (!task) return <p>タスクが見つかりません</p>;

  return (
    <div>
      <button onClick={onBack}>← 一覧に戻る</button>
      <h2>{task.script.metadata.name}</h2>
      <p>
        <strong>ID:</strong> {task.id} | <strong>状態:</strong> {task.status} |{" "}
        <strong>プロバイダ:</strong> {task.script.spec.provider} |{" "}
        <strong>環境:</strong> {task.script.spec.environment}
      </p>

      {task.validationResult?.errors && task.validationResult.errors.length > 0 && (
        <ValidationErrorList errors={task.validationResult.errors} />
      )}

      <ApprovalPanel taskId={task.id} status={task.status} onUpdated={() => void load()} />

      <h3>スクリプト</h3>
      <pre style={{ background: "#f8f9fa", padding: "1rem", borderRadius: 4, overflow: "auto" }}>
        {task.rawInput}
      </pre>

      {task.executionLog && task.executionLog.length > 0 && (
        <>
          <h3>実行ログ</h3>
          <pre style={{ background: "#212529", color: "#f8f9fa", padding: "1rem", borderRadius: 4, overflow: "auto" }}>
            {task.executionLog.join("\n")}
          </pre>
        </>
      )}
    </div>
  );
}
