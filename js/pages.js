/* ============================================================
   ADAPTIVE SOC — pages.js
   Backend-aligned dashboard
   MySQL + FastAPI
   No CSS changes required
   ============================================================ */

(function () {
  "use strict";

  const API = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http'))
    ? window.location.origin
    : "http://127.0.0.1:8000";

  /* ------------------------------------------------------------
     BASIC HELPERS
     ------------------------------------------------------------ */

  function root() {
    return document.getElementById("page-content");
  }

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function arr(value) {
    return Array.isArray(value) ? value : [];
  }

  function num(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function upper(value) {
    return String(value ?? "").toUpperCase();
  }

  function date(value) {
    if (!value) return "—";

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) {
      return String(value);
    }

    return d.toLocaleString();
  }

  function shortDate(value) {
    if (!value) return "—";

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) {
      return String(value);
    }

    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function dataStore() {
    try {
      if (typeof data !== "undefined") return data;
    } catch (_) {}

    if (window.data) return window.data;

    if (window.State && window.State.data) {
      return window.State.data;
    }

    return {};
  }

  function get(table) {
    const d = dataStore();
    return arr(d[table]);
  }

  function detectionForIncident(incident) {
    return get("aiAnalyses").find(
      x => num(x.detection_id) === num(incident.detection_id)
    ) || get("detections").find(
      x => num(x.detection_id) === num(incident.detection_id)
    ) || null;
  }

  function riskForDetection(detection) {
    if (!detection) return null;

    return get("risks").find(
      x => num(x.detection_id) === num(detection.detection_id)
    ) || null;
  }

  function eventForDetection(detection) {
    if (!detection) return null;

    return get("events").find(
      x => num(x.event_id) === num(detection.event_id)
    ) || null;
  }

  function responseForRisk(risk) {
    if (!risk) return null;

    return get("responses").find(
      x => num(x.risk_id) === num(risk.risk_id)
    ) || null;
  }

  function verificationForResponse(response) {
    if (!response) return null;

    return get("verifications").find(
      x => num(x.response_id) === num(response.response_id)
    ) || null;
  }

  function severityClass(level) {
    const s = upper(level);

    if (s === "CRITICAL") return "sev-critical";
    if (s === "HIGH") return "sev-high";
    if (s === "MEDIUM") return "sev-medium";

    return "sev-low";
  }

  function statusClass(status) {
    const s = upper(status);

    if (
      s === "RESOLVED" ||
      s === "CLOSED" ||
      s === "SUCCESS" ||
      s === "STOPPED"
    ) {
      return "st-resolved";
    }

    if (
      s === "FAILED" ||
      s === "ESCALATED" ||
      s === "CRITICAL"
    ) {
      return "st-escalated";
    }

    if (
      s === "VERIFYING" ||
      s === "PARTIAL"
    ) {
      return "st-verifying";
    }

    if (
      s === "CONTAINING" ||
      s === "BLOCK_IP"
    ) {
      return "st-containing";
    }

    return "st-detected";
  }

  function badge(text, cls) {
    return `<span class="badge ${cls || ""}">${esc(text)}</span>`;
  }

  function stat(icon, value, label, color) {
    return `
      <div class="card metric-card"
           style="position:relative;overflow:hidden;">
        <div style="
          position:absolute;
          right:-25px;
          top:-25px;
          width:90px;
          height:90px;
          border-radius:50%;
          background:${color};
          opacity:.08;
        "></div>

        <div class="metric-top">
          <div class="metric-icon" style="color:${color};">
            <i class="fa-solid ${icon}"></i>
          </div>
        </div>

        <div class="metric-value">${esc(value)}</div>
        <div class="metric-label">${esc(label)}</div>

        <div style="
          height:2px;
          width:42px;
          margin-top:5px;
          background:${color};
          border-radius:2px;
        "></div>
      </div>
    `;
  }

  function empty(message) {
    return `
      <div class="empty-state">
        <i class="fa-solid fa-shield-halved"></i>
        <div>${esc(message)}</div>
      </div>
    `;
  }

  /* ------------------------------------------------------------
     PAGE HEADER
     ------------------------------------------------------------ */

  function header(title, description, icon) {
    return `
      <div style="
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:20px;
        margin-bottom:20px;
      ">
        <div>
          <div style="
            display:flex;
            align-items:center;
            gap:9px;
            margin-bottom:5px;
          ">
            <div style="
              width:32px;
              height:32px;
              border-radius:8px;
              background:rgba(47,129,255,.12);
              color:#2f81ff;
              display:flex;
              align-items:center;
              justify-content:center;
            ">
              <i class="fa-solid ${icon || "fa-shield-halved"}"></i>
            </div>

            <h2 class="section-title">${esc(title)}</h2>
          </div>

          <p class="section-desc">${esc(description)}</p>
        </div>

        <div class="chip">
          <i class="fa-solid fa-circle" style="
            color:#2fd977;
            font-size:7px;
          "></i>
          LOCAL SOC ONLINE
        </div>
      </div>
    `;
  }

  /* ============================================================
     OVERVIEW
     ============================================================ */

  async function mountOverview() {

    const el = root();

    if (!el) {
      console.error("page-content element not found");
      return;
    }

    /*
       Refresh backend data if state.js exposes refreshAll().
    */
    try {
      if (typeof refreshAll === "function") {
        await refreshAll();
      }
    } catch (error) {
      console.warn("Dashboard refresh failed:", error);
    }

    const incidents = get("incidents");
    const events = get("events");
    const detections = get("detections");
    const risks = get("risks");
    const responses = get("responses");
    const verifications = get("verifications");
    const notifications = get("notifications");

    const openIncidents = incidents.filter(i =>
      ["OPEN", "INVESTIGATING"].includes(upper(i.status))
    ).length;

    const critical = risks.filter(
      r => upper(r.risk_level) === "CRITICAL"
    ).length;

    const high = risks.filter(
      r => upper(r.risk_level) === "HIGH"
    ).length;

    const blocked = responses.filter(
      r =>
        upper(r.action_type) === "BLOCK_IP" &&
        upper(r.status) === "SUCCESS"
    ).length;

    const stopped = verifications.filter(
      v => upper(v.result) === "STOPPED"
    ).length;

    const unread = notifications.filter(
      n => !n.is_read
    ).length;

    const latestIncidents = incidents
      .slice()
      .sort((a, b) =>
        new Date(b.incident_time || b.created_at) -
        new Date(a.incident_time || a.created_at)
      )
      .slice(0, 6);

    const latestNotifications = notifications
      .slice()
      .sort((a, b) =>
        new Date(b.notification_time || b.created_at) -
        new Date(a.notification_time || a.created_at)
      )
      .slice(0, 5);

    const latestEvents = events
      .slice()
      .sort((a, b) =>
        new Date(b.event_time || b.created_at) -
        new Date(a.event_time || a.created_at)
      )
      .slice(0, 8);

    /* ----------------------------------------------------------
       THREAT DISTRIBUTION
       ---------------------------------------------------------- */

    const low = risks.filter(
      r => upper(r.risk_level) === "LOW"
    ).length;

    const medium = risks.filter(
      r => upper(r.risk_level) === "MEDIUM"
    ).length;

    const totalRisk = low + medium + high + critical;

    const percent = count =>
      totalRisk
        ? Math.round((count / totalRisk) * 100)
        : 0;

    /* ----------------------------------------------------------
       HTML
       ---------------------------------------------------------- */

    el.innerHTML = `

      ${header(
        "Security Overview",
        "Real-time visibility into brute-force detection, risk assessment and automated response.",
        "fa-chart-line"
      )}

      <!-- STATUS BANNER -->

      <div class="card"
           style="
             margin-bottom:18px;
             border-color:rgba(47,217,119,.25);
             background:
               linear-gradient(
                 90deg,
                 rgba(47,217,119,.07),
                 rgba(47,129,255,.04)
               );
           ">

        <div style="
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:15px;
          flex-wrap:wrap;
        ">

          <div style="
            display:flex;
            align-items:center;
            gap:12px;
          ">

            <div style="
              width:42px;
              height:42px;
              border-radius:50%;
              background:rgba(47,217,119,.12);
              color:#2fd977;
              display:flex;
              align-items:center;
              justify-content:center;
              box-shadow:0 0 20px rgba(47,217,119,.12);
            ">
              <i class="fa-solid fa-shield-halved"></i>
            </div>

            <div>
              <div style="
                font-size:14px;
                font-weight:800;
              ">
                Adaptive SOC is operational
              </div>

              <div style="
                color:var(--text-secondary);
                font-size:12px;
                margin-top:2px;
              ">
                Detection → Risk → Firewall Response → Verification
              </div>
            </div>

          </div>

          <div style="
            display:flex;
            gap:8px;
            flex-wrap:wrap;
          ">
            <span class="chip">
              <i class="fa-solid fa-database"></i>
              MySQL Connected
            </span>

            <span class="chip">
              <i class="fa-solid fa-lock"></i>
              Local Response
            </span>

            <span class="chip">
              <i class="fa-solid fa-ban"></i>
              ${blocked} IPs Blocked
            </span>
          </div>

        </div>
      </div>


      <!-- TOP METRICS -->

      <div class="grid grid-4"
           style="margin-bottom:18px;">

        ${stat(
          "fa-triangle-exclamation",
          openIncidents,
          "Active Incidents",
          "#ff8a3d"
        )}

        ${stat(
          "fa-skull-crossbones",
          critical,
          "Critical Threats",
          "#ff4d5e"
        )}

        ${stat(
          "fa-fire",
          high,
          "High Risk Threats",
          "#ff8a3d"
        )}

        ${stat(
          "fa-wave-square",
          events.length,
          "Events Processed",
          "#2f81ff"
        )}

      </div>


      <!-- SECOND METRICS -->

      <div class="grid grid-4"
           style="margin-bottom:18px;">

        ${stat(
          "fa-check-double",
          stopped,
          "Verified Stopped",
          "#2fd977"
        )}

        ${stat(
          "fa-ban",
          blocked,
          "Firewall Blocks",
          "#9b7bff"
        )}

        ${stat(
          "fa-bell",
          unread,
          "Unread Alerts",
          "#f5a623"
        )}

        ${stat(
          "fa-crosshairs",
          detections.length,
          "Detections",
          "#22d3c8"
        )}

      </div>


      <!-- MAIN DASHBOARD GRID -->

      <div class="grid grid-2"
           style="margin-bottom:18px;">

        <!-- THREAT DISTRIBUTION -->

        <div class="card">

          <div class="card-header">
            <div>
              <div class="card-title">
                Threat Distribution
              </div>

              <div class="card-sub">
                Current risk classification
              </div>
            </div>

            <i class="fa-solid fa-chart-pie"
               style="color:#2f81ff;"></i>
          </div>

          <div style="
            display:flex;
            flex-direction:column;
            gap:12px;
          ">

            ${[
              ["Critical", critical, "#ff4d5e"],
              ["High", high, "#ff8a3d"],
              ["Medium", medium, "#f5c542"],
              ["Low", low, "#2fd977"]
            ].map(item => {

              const [label, count, color] = item;

              return `
                <div>

                  <div style="
                    display:flex;
                    justify-content:space-between;
                    margin-bottom:5px;
                    font-size:12px;
                  ">
                    <span>${label}</span>
                    <span class="mono">
                      ${count} · ${percent(count)}%
                    </span>
                  </div>

                  <div style="
                    height:8px;
                    background:var(--bg-3);
                    border-radius:5px;
                    overflow:hidden;
                  ">
                    <div style="
                      width:${percent(count)}%;
                      height:100%;
                      background:${color};
                      border-radius:5px;
                      transition:width .4s ease;
                    "></div>
                  </div>

                </div>
              `;

            }).join("")}

          </div>

        </div>


        <!-- RESPONSE PIPELINE -->

        <div class="card">

          <div class="card-header">
            <div>
              <div class="card-title">
                Response Pipeline
              </div>

              <div class="card-sub">
                Automated containment status
              </div>
            </div>

            <i class="fa-solid fa-diagram-project"
               style="color:#22d3c8;"></i>
          </div>

          <div class="stage-list">

            <div class="stage-item done">
              <span class="stage-icon">
                <i class="fa-solid fa-check"></i>
              </span>
              Security Events
              <span class="chip" style="margin-left:auto;">
                ${events.length}
              </span>
            </div>

            <div class="stage-item done">
              <span class="stage-icon">
                <i class="fa-solid fa-check"></i>
              </span>
              Brute-Force Detection
              <span class="chip" style="margin-left:auto;">
                ${detections.length}
              </span>
            </div>

            <div class="stage-item done">
              <span class="stage-icon">
                <i class="fa-solid fa-check"></i>
              </span>
              Risk Assessment
              <span class="chip" style="margin-left:auto;">
                ${risks.length}
              </span>
            </div>

            <div class="stage-item done">
              <span class="stage-icon">
                <i class="fa-solid fa-check"></i>
              </span>
              Windows Firewall
              <span class="chip" style="margin-left:auto;">
                ${blocked}
              </span>
            </div>

            <div class="stage-item ${
              stopped > 0 ? "done" : "active"
            }">
              <span class="stage-icon">
                <i class="fa-solid ${
                  stopped > 0
                    ? "fa-check"
                    : "fa-spinner fa-spin"
                }"></i>
              </span>
              Verification
              <span class="chip" style="margin-left:auto;">
                ${stopped} stopped
              </span>
            </div>

          </div>

        </div>

      </div>


      <!-- INCIDENTS -->

      <div class="card"
           style="margin-bottom:18px;">

        <div class="card-header">

          <div>
            <div class="card-title">
              Recent Security Incidents
            </div>

            <div class="card-sub">
              Latest brute-force incidents detected by the SOC
            </div>
          </div>

          <span class="chip">
            ${incidents.length} total
          </span>

        </div>

        ${
          latestIncidents.length
            ? `
              <div class="table-scroll">

                <table class="data-table">

                  <thead>
                    <tr>
                      <th>Incident</th>
                      <th>Attack</th>
                      <th>Source IP</th>
                      <th>Severity</th>
                      <th>Risk</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>

                  <tbody>

                    ${latestIncidents.map(incident => {

                      const detection =
                        detectionForIncident(incident);

                      const risk =
                        riskForDetection(detection);

                      const event =
                        eventForDetection(detection);

                      const riskLevel =
                        risk?.risk_level ||
                        incident.severity ||
                        "LOW";

                      return `
                        <tr class="clickable"
                            onclick="Pages.showIncident(${num(incident.incident_id)})">

                          <td>
                            <strong>
                              INC-${String(
                                incident.incident_id
                              ).padStart(4, "0")}
                            </strong>
                          </td>

                          <td>
                            ${esc(
                              detection?.detection_type ||
                              "BRUTE_FORCE"
                            )}
                          </td>

                          <td class="mono">
                            ${esc(
                              event?.source_ip ||
                              "—"
                            )}
                          </td>

                          <td>
                            ${badge(
                              riskLevel,
                              severityClass(riskLevel)
                            )}
                          </td>

                          <td>
                            <strong>
                              ${num(risk?.risk_score)}
                            </strong>
                            <span style="
                              color:var(--text-muted);
                              font-size:10px;
                            ">
                              /100
                            </span>
                          </td>

                          <td>
                            ${badge(
                              incident.status || "OPEN",
                              statusClass(incident.status)
                            )}
                          </td>

                          <td class="mono">
                            ${shortDate(
                              incident.incident_time ||
                              incident.created_at
                            )}
                          </td>

                        </tr>
                      `;

                    }).join("")}

                  </tbody>

                </table>

              </div>
            `
            : empty("No security incidents recorded.")
        }

      </div>


      <!-- BOTTOM GRID -->

      <div class="grid grid-2">

        <!-- LIVE EVENT STREAM -->

        <div class="card">

          <div class="card-header">

            <div>
              <div class="card-title">
                Event Stream
              </div>

              <div class="card-sub">
                Latest authentication activity
              </div>
            </div>

            <span class="chip">
              LIVE
            </span>

          </div>

          ${
            latestEvents.length
              ? `
                <div class="timeline">

                  ${latestEvents.map(event => {

                    const failed =
                      upper(event.event_type) ===
                      "LOGIN_FAILED";

                    return `
                      <div class="timeline-item">

                        <div class="
                          timeline-dot
                          ${failed ? "fail" : "done"}
                        ">
                          <i class="fa-solid ${
                            failed
                              ? "fa-xmark"
                              : "fa-check"
                          }"></i>
                        </div>

                        <div class="timeline-title">
                          ${esc(
                            event.event_type ||
                            "SECURITY_EVENT"
                          )}
                        </div>

                        <div class="timeline-time mono">
                          ${shortDate(
                            event.event_time ||
                            event.created_at
                          )}
                        </div>

                        <div class="timeline-desc">
                          Source:
                          <span class="mono">
                            ${esc(event.source_ip || "—")}
                          </span>
                        </div>

                      </div>
                    `;

                  }).join("")}

                </div>
              `
              : empty("No events available.")
          }

        </div>


        <!-- NOTIFICATIONS -->

        <div class="card">

          <div class="card-header">

            <div>
              <div class="card-title">
                Security Notifications
              </div>

              <div class="card-sub">
                Latest SOC alerts and response updates
              </div>
            </div>

            <i class="fa-solid fa-bell"
               style="color:#f5a623;"></i>

          </div>

          ${
            latestNotifications.length
              ? latestNotifications.map(n => {

                  const type =
                    upper(n.notification_type);

                  let icon = "fa-circle-info";
                  let color = "#2f81ff";

                  if (type === "ALERT") {
                    icon = "fa-triangle-exclamation";
                    color = "#ff4d5e";
                  }

                  if (type === "SUCCESS") {
                    icon = "fa-circle-check";
                    color = "#2fd977";
                  }

                  if (type === "WARNING") {
                    icon = "fa-triangle-exclamation";
                    color = "#f5a623";
                  }

                  return `
                    <div style="
                      display:flex;
                      gap:10px;
                      padding:10px 0;
                      border-bottom:1px solid var(--border-subtle);
                    ">

                      <div style="
                        width:30px;
                        height:30px;
                        border-radius:7px;
                        background:${color}18;
                        color:${color};
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        flex:0 0 30px;
                      ">
                        <i class="fa-solid ${icon}"></i>
                      </div>

                      <div style="min-width:0;">

                        <div style="
                          font-size:12.5px;
                          font-weight:700;
                        ">
                          ${esc(
                            n.title ||
                            "Security Notification"
                          )}
                        </div>

                        <div style="
                          color:var(--text-secondary);
                          font-size:11.5px;
                          margin-top:2px;
                          line-height:1.4;
                        ">
                          ${esc(
                            n.message ||
                            "Security event recorded."
                          )}
                        </div>

                        <div class="mono"
                             style="
                               color:var(--text-muted);
                               font-size:9.5px;
                               margin-top:4px;
                             ">
                          ${shortDate(
                            n.notification_time ||
                            n.created_at
                          )}
                        </div>

                      </div>

                    </div>
                  `;

                }).join("")
              : empty("No notifications available.")
          }

        </div>

      </div>

    `;
  }


  /* ============================================================
     INCIDENT DETAIL
     ============================================================ */

  function showIncident(id) {

    const incident = get("incidents").find(
      x => num(x.incident_id) === num(id)
    );

    if (!incident) return;

    const detection =
      detectionForIncident(incident);

    const event =
      eventForDetection(detection);

    const risk =
      riskForDetection(detection);

    const response =
      responseForRisk(risk);

    const verification =
      verificationForResponse(response);

    const overlay = document.createElement("div");

    overlay.className = "modal-overlay";

    overlay.innerHTML = `
      <div class="modal-box">

        <div class="modal-header">

          <div>
            <h3>
              Incident #${esc(incident.incident_id)}
            </h3>

            <div class="card-sub">
              Brute-force security incident
            </div>
          </div>

          <button class="modal-close"
                  onclick="this.closest('.modal-overlay').remove()">
            <i class="fa-solid fa-xmark"></i>
          </button>

        </div>

        <div class="modal-body">

          <div class="narration-box">

            <div class="narration-title">
              SOC Incident Summary
            </div>

            <div class="narration-text">
              The SOC detected repeated authentication
              failures and automatically evaluated the
              source for brute-force activity.
            </div>

          </div>

          <div class="grid grid-2">

            <div class="card">

              <div class="card-title">
                Detection
              </div>

              <div class="kv-row">
                <span class="kv-label">Type</span>
                <span class="kv-value">
                  ${esc(
                    detection?.detection_type ||
                    "BRUTE_FORCE"
                  )}
                </span>
              </div>

              <div class="kv-row">
                <span class="kv-label">Source IP</span>
                <span class="kv-value mono">
                  ${esc(event?.source_ip || "—")}
                </span>
              </div>

              <div class="kv-row">
                <span class="kv-label">Account</span>
                <span class="kv-value">
                  ${esc(event?.account_id || "—")}
                </span>
              </div>

            </div>


            <div class="card">

              <div class="card-title">
                Risk Assessment
              </div>

              <div class="kv-row">
                <span class="kv-label">Score</span>
                <span class="kv-value">
                  ${num(risk?.risk_score)}/100
                </span>
              </div>

              <div class="kv-row">
                <span class="kv-label">Level</span>
                <span class="kv-value">
                  ${badge(
                    risk?.risk_level || incident.severity,
                    severityClass(
                      risk?.risk_level ||
                      incident.severity
                    )
                  )}
                </span>
              </div>

              <div class="kv-row">
                <span class="kv-label">Confidence</span>
                <span class="kv-value">
                  ${num(risk?.confidence)}%
                </span>
              </div>

            </div>


            <div class="card">

              <div class="card-title">
                Response
              </div>

              <div class="kv-row">
                <span class="kv-label">Action</span>
                <span class="kv-value">
                  ${esc(
                    response?.action_type ||
                    "—"
                  )}
                </span>
              </div>

              <div class="kv-row">
                <span class="kv-label">Target</span>
                <span class="kv-value mono">
                  ${esc(
                    response?.target_ip ||
                    event?.source_ip ||
                    "—"
                  )}
                </span>
              </div>

              <div class="kv-row">
                <span class="kv-label">Status</span>
                <span class="kv-value">
                  ${badge(
                    response?.status || "—",
                    statusClass(response?.status)
                  )}
                </span>
              </div>

            </div>


            <div class="card">

              <div class="card-title">
                Verification
              </div>

              <div class="kv-row">
                <span class="kv-label">Result</span>
                <span class="kv-value">
                  ${badge(
                    verification?.result || "UNKNOWN",
                    statusClass(
                      verification?.result
                    )
                  )}
                </span>
              </div>

              <div class="kv-row">
                <span class="kv-label">
                  Attempts Before
                </span>
                <span class="kv-value">
                  ${num(
                    verification?.attempts_before
                  )}
                </span>
              </div>

              <div class="kv-row">
                <span class="kv-label">
                  Attempts After
                </span>
                <span class="kv-value">
                  ${num(
                    verification?.attempts_after
                  )}
                </span>
              </div>

            </div>

          </div>

          <div style="margin-top:18px;">

            <div class="card-title"
                 style="margin-bottom:8px;">
              Incident Description
            </div>

            <div class="explain-box">

              <i class="fa-solid fa-shield-halved"></i>

              <div>
                ${esc(
                  incident.description ||
                  "No additional description available."
                )}
              </div>

            </div>

          </div>

        </div>

      </div>
    `;

    overlay.addEventListener("click", e => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });

    document.body.appendChild(overlay);
  }


  /* ============================================================
     GENERIC TABLE PAGE
     ============================================================ */

  function mountTablePage(
    title,
    description,
    icon,
    tableName,
    columns
  ) {

    const el = root();

    if (!el) return;

    const rows = get(tableName);

    el.innerHTML = `
      ${header(title, description, icon)}

      <div class="card">

        <div class="card-header">

          <div>
            <div class="card-title">
              ${esc(tableName)}
            </div>

            <div class="card-sub">
              ${rows.length} records
            </div>
          </div>

          <span class="chip">
            LOCAL DATABASE
          </span>

        </div>

        ${
          rows.length
            ? `
              <div class="table-scroll">

                <table class="data-table">

                  <thead>
                    <tr>
                      ${columns.map(
                        c => `<th>${esc(c.label)}</th>`
                      ).join("")}
                    </tr>
                  </thead>

                  <tbody>

                    ${rows.map(row => {

                      return `
                        <tr>

                          ${columns.map(c => {

                            let value =
                              typeof c.value === "function"
                                ? c.value(row)
                                : row[c.key];

                            return `
                              <td>
                                ${esc(
                                  value ?? "—"
                                )}
                              </td>
                            `;

                          }).join("")}

                        </tr>
                      `;

                    }).join("")}

                  </tbody>

                </table>

              </div>
            `
            : empty("No records found.")
        }

      </div>
    `;
  }


  /* ============================================================
     OTHER PAGES
     ============================================================ */

  function mountIncidents() {
    mountTablePage(
      "Security Incidents",
      "Investigate detected brute-force incidents and their response lifecycle.",
      "fa-triangle-exclamation",
      "incidents",
      [
        {
          label: "ID",
          key: "incident_id"
        },
        {
          label: "Detection",
          key: "detection_id"
        },
        {
          label: "Severity",
          value: r => r.severity
        },
        {
          label: "Title",
          key: "title"
        },
        {
          label: "Status",
          key: "status"
        },
        {
          label: "Time",
          value: r => date(r.incident_time)
        }
      ]
    );
  }


  function mountEvents() {
    mountTablePage(
      "Security Events",
      "Authentication and security events received by the backend.",
      "fa-wave-square",
      "events",
      [
        { label: "ID", key: "event_id" },
        {
          label: "Time",
          value: r => date(r.event_time)
        },
        { label: "Type", key: "event_type" },
        { label: "Code", key: "event_code" },
        {
          label: "Source IP",
          key: "source_ip"
        },
        {
          label: "Account",
          key: "account_id"
        }
      ]
    );
  }


  function mountDetections() {
    mountTablePage(
      "Threat Detections",
      "Confirmed brute-force detections generated by the detection engine.",
      "fa-crosshairs",
      "detections",
      [
        { label: "ID", key: "detection_id" },
        { label: "Event", key: "event_id" },
        { label: "Type", key: "detection_type" },
        { label: "Title", key: "title" },
        { label: "Status", key: "status" },
        {
          label: "Time",
          value: r => date(r.detection_time)
        }
      ]
    );
  }


  function mountRisks() {
    mountTablePage(
      "Risk Assessment",
      "Risk scores calculated from detected brute-force activity.",
      "fa-gauge-high",
      "risks",
      [
        { label: "ID", key: "risk_id" },
        { label: "Detection", key: "detection_id" },
        { label: "Score", key: "risk_score" },
        { label: "Level", key: "risk_level" },
        { label: "Confidence", key: "confidence" },
        {
          label: "Calculated",
          value: r => date(r.calculated_at)
        }
      ]
    );
  }


  function mountResponses() {
    mountTablePage(
      "Automated Responses",
      "Firewall and containment actions executed by the SOC backend.",
      "fa-shield-halved",
      "responses",
      [
        { label: "ID", key: "response_id" },
        { label: "Risk", key: "risk_id" },
        { label: "Action", key: "action_type" },
        {
          label: "Target IP",
          key: "target_ip"
        },
        { label: "Status", key: "status" },
        {
          label: "Time",
          value: r => date(r.response_time)
        }
      ]
    );
  }


  function mountVerifications() {
    mountTablePage(
      "Response Verification",
      "Evidence showing whether containment stopped the attack.",
      "fa-check-double",
      "verifications",
      [
        {
          label: "ID",
          key: "verification_id"
        },
        {
          label: "Response",
          key: "response_id"
        },
        {
          label: "Before",
          key: "attempts_before"
        },
        {
          label: "After",
          key: "attempts_after"
        },
        {
          label: "Result",
          key: "result"
        },
        {
          label: "Verified",
          value: r => date(r.verified_at)
        }
      ]
    );
  }


  function mountNotifications() {
    mountTablePage(
      "Notifications",
      "Security alerts generated by the Adaptive SOC.",
      "fa-bell",
      "notifications",
      [
        {
          label: "ID",
          key: "notification_id"
        },
        {
          label: "Incident",
          key: "incident_id"
        },
        {
          label: "Type",
          key: "notification_type"
        },
        {
          label: "Title",
          key: "title"
        },
        {
          label: "Channel",
          key: "channel"
        },
        {
          label: "Read",
          value: r =>
            r.is_read ? "YES" : "NO"
        },
        {
          label: "Time",
          value: r =>
            date(r.notification_time)
        }
      ]
    );
  }


  function mountAuditLogs() {
    mountTablePage(
      "Audit Trail",
      "Complete record of SOC actions and system activity.",
      "fa-file-shield",
      "auditLogs",
      [
        {
          label: "ID",
          key: "audit_id"
        },
        {
          label: "Actor",
          key: "actor"
        },
        {
          label: "Action",
          key: "action"
        },
        {
          label: "Result",
          key: "action_result"
        },
        {
          label: "Details",
          key: "details"
        },
        {
          label: "Time",
          value: r =>
            date(r.event_time)
        }
      ]
    );
  }


  function mountSettings() {

    const el = root();

    if (!el) return;

    el.innerHTML = `
      ${header(
        "System Settings",
        "Local Adaptive SOC configuration and operating information.",
        "fa-sliders"
      )}

      <div class="grid grid-2">

        <div class="card">

          <div class="card-title">
            Detection Configuration
          </div>

          <div class="kv-row">
            <span class="kv-label">
              Detection Type
            </span>

            <span class="kv-value">
              BRUTE_FORCE
            </span>
          </div>

          <div class="kv-row">
            <span class="kv-label">
              Failed Attempt Threshold
            </span>

            <span class="kv-value">
              5
            </span>
          </div>

          <div class="kv-row">
            <span class="kv-label">
              Time Window
            </span>

            <span class="kv-value">
              1 minute
            </span>
          </div>

        </div>


        <div class="card">

          <div class="card-title">
            Response Configuration
          </div>

          <div class="kv-row">
            <span class="kv-label">
              Response
            </span>

            <span class="kv-value">
              BLOCK_IP
            </span>
          </div>

          <div class="kv-row">
            <span class="kv-label">
              Firewall
            </span>

            <span class="kv-value">
              Windows Firewall
            </span>
          </div>

          <div class="kv-row">
            <span class="kv-label">
              Mode
            </span>

            <span class="kv-value">
              LOCAL
            </span>
          </div>

        </div>

      </div>
    `;
  }


  function mountHowItWorks() {

    const el = root();

    if (!el) return;

    el.innerHTML = `
      ${header(
        "How Adaptive SOC Works",
        "The complete detection-to-response workflow.",
        "fa-route"
      )}

      <div class="card">

        <div class="arch-flow">

          <div class="arch-node">
            <i class="fa-solid fa-right-to-bracket"></i>
            Login Events
          </div>

          <div class="arch-arrow">→</div>

          <div class="arch-node">
            Detection
          </div>

          <div class="arch-arrow">→</div>

          <div class="arch-node">
            Risk
          </div>

          <div class="arch-arrow">→</div>

          <div class="arch-node">
            Firewall Block
          </div>

          <div class="arch-arrow">→</div>

          <div class="arch-node">
            Verification
          </div>

          <div class="arch-arrow">→</div>

          <div class="arch-node">
            Incident
          </div>

          <div class="arch-arrow">→</div>

          <div class="arch-node">
            Notification
          </div>

        </div>

      </div>


      <div class="grid grid-2"
           style="margin-top:18px;">

        <div class="step-card">

          <div class="step-number">1</div>

          <div>
            <h4>Event Collection</h4>

            <p>
              The backend receives authentication events
              and stores them in MySQL.
            </p>
          </div>

        </div>


        <div class="step-card">

          <div class="step-number">2</div>

          <div>
            <h4>Brute-Force Detection</h4>

            <p>
              Five or more failed login attempts from the
              same source and account within one minute
              trigger detection.
            </p>
          </div>

        </div>


        <div class="step-card">

          <div class="step-number">3</div>

          <div>
            <h4>Risk Assessment</h4>

            <p>
              The system calculates a risk score and
              classifies the threat as LOW, MEDIUM,
              HIGH or CRITICAL.
            </p>
          </div>

        </div>


        <div class="step-card">

          <div class="step-number">4</div>

          <div>
            <h4>Automatic Response</h4>

            <p>
              The detected source IP is blocked using
              the local Windows Firewall.
            </p>
          </div>

        </div>


        <div class="step-card">

          <div class="step-number">5</div>

          <div>
            <h4>Verification</h4>

            <p>
              The SOC records whether the response stopped
              the attack.
            </p>
          </div>

        </div>


        <div class="step-card">

          <div class="step-number">6</div>

          <div>
            <h4>Incident & Notification</h4>

            <p>
              The complete action chain is stored in the
              database and shown on the dashboard.
            </p>
          </div>

        </div>

      </div>
    `;
  }


  function mountAttack() {

    const el = root();

    if (!el) return;

    el.innerHTML = `
      ${header(
        "Attack Simulation",
        "Controlled local brute-force demonstration.",
        "fa-bug"
      )}

      <div class="card">

        <div class="narration-box">

          <div class="narration-title">
            Safe Demonstration
          </div>

          <div class="narration-text">
            Generate controlled synthetic failed-login
            events and observe the full detection,
            risk, response and verification pipeline.
          </div>

        </div>

        <div class="stage-list">

          <div class="stage-item">
            <span class="stage-icon">
              <i class="fa-solid fa-1"></i>
            </span>
            Generate failed login events
          </div>

          <div class="stage-item">
            <span class="stage-icon">
              <i class="fa-solid fa-2"></i>
            </span>
            Reach the five-attempt threshold
          </div>

          <div class="stage-item">
            <span class="stage-icon">
              <i class="fa-solid fa-3"></i>
            </span>
            Create brute-force detection
          </div>

          <div class="stage-item">
            <span class="stage-icon">
              <i class="fa-solid fa-4"></i>
            </span>
            Calculate risk
          </div>

          <div class="stage-item">
            <span class="stage-icon">
              <i class="fa-solid fa-5"></i>
            </span>
            Block source IP
          </div>

          <div class="stage-item">
            <span class="stage-icon">
              <i class="fa-solid fa-6"></i>
            </span>
            Verify response
          </div>

        </div>

      </div>
    `;
  }


  /* ============================================================
     ALIASES
     
     IMPORTANT:
     app.js expects mountOverview().
     We expose BOTH mount names and simple names so the
     existing router remains compatible.
     ============================================================ */

  const Pages = {

    /* Main required functions */
    mountOverview,
    mountIncidents,
    mountEvents,
    mountDetections,
    mountRisks,
    mountResponses,
    mountVerifications,
    mountNotifications,
    mountAuditLogs,
    mountSettings,
    mountHowItWorks,
    mountAttack,

    /* Compatibility aliases */
    overview: mountOverview,
    incidents: mountIncidents,
    events: mountEvents,
    detections: mountDetections,
    risk: mountRisks,
    risks: mountRisks,
    response: mountResponses,
    responses: mountResponses,
    verification: mountVerifications,
    verifications: mountVerifications,
    notifications: mountNotifications,
    auditLogs: mountAuditLogs,
    settings: mountSettings,
    howItWorks: mountHowItWorks,
    attack: mountAttack,

    /* Detail */
    showIncident
  };


  /* ------------------------------------------------------------
     GLOBAL EXPORT
     ------------------------------------------------------------ */

  window.Pages = Pages;

  console.log(
    "%cAdaptive SOC Pages loaded",
    "color:#2fd977;font-weight:bold;"
  );

  console.log(
    "Available:",
    Object.keys(Pages)
  );

})();