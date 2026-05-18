import type { ValidationError as VError } from "../api/client.js";

interface Props {
  errors: VError[];
}

export function ValidationErrorList({ errors }: Props) {
  if (errors.length === 0) return null;
  return (
    <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 4, padding: "1rem" }}>
      <strong>検証エラー ({errors.length}件)</strong>
      <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.5rem" }}>
        {errors.map((e, i) => (
          <li key={i} style={{ marginBottom: "0.5rem" }}>
            <code style={{ background: "#f8f9fa", padding: "0 4px" }}>{e.field}</code>
            {" — "}
            <strong>[{e.code}]</strong> {e.message}
            {e.received !== undefined && (
              <span style={{ color: "#dc3545" }}> (受信値: {JSON.stringify(e.received)})</span>
            )}
            {e.suggestion && (
              <div style={{ color: "#198754", fontSize: "0.875rem" }}>💡 {e.suggestion}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
