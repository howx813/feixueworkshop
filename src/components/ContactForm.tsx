"use client";

import { FormEvent, useState } from "react";

type Status = "idle" | "ok" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus("idle");

    await new Promise((r) => setTimeout(r, 500));
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const message = String(data.get("message") || "").trim();

    if (!name || !message) {
      setStatus("error");
      setSubmitting(false);
      return;
    }

    setStatus("ok");
    setSubmitting(false);
    form.reset();
  };

  return (
    <form onSubmit={onSubmit} className="card card-pad">
      <div className="grid-2">
        <label>
          <span className="field-label">称呼</span>
          <input className="field" name="name" required placeholder="怎么称呼你" />
        </label>
        <label>
          <span className="field-label">联系方式</span>
          <input
            className="field"
            name="contact"
            placeholder="微信 / 邮箱 / 手机"
          />
        </label>
      </div>
      <label style={{ display: "block", marginTop: 12 }}>
        <span className="field-label">想交流什么</span>
        <textarea
          className="field"
          name="message"
          required
          rows={4}
          placeholder="合作、演示、方法交流、项目讨论……"
          style={{ resize: "vertical" }}
        />
      </label>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 10,
          marginTop: 14,
        }}
      >
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "提交中…" : "发送留言"}
        </button>
        <span style={{ color: "var(--text-2)", fontSize: "0.75rem" }}>
          v0.1 前端演示，后续接云函数落库
        </span>
      </div>

      {status === "ok" && (
        <div className="alert alert-ok">已记录（本地演示）。正式环境将写入后台。</div>
      )}
      {status === "error" && (
        <div className="alert alert-err">请至少填写称呼和留言内容。</div>
      )}
    </form>
  );
}
