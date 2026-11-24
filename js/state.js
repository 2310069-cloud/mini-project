/**
 * Adaptive SOC - lightweight global state store.
 * Connected to the local FastAPI + MySQL backend.
 */

const State = (() => {

  // =========================================================
  // GLOBAL DATA STORE
  // =========================================================

  window.data = {
    page: "overview",

    incidents: [],
    events: [],
    detections: [],
    clusters: [],
    fingerprints: [],
    risks: [],
    aiAnalyses: [],
    responses: [],
    credentials: [],
    verifications: [],
    reports: [],
    notifications: [],
    auditLogs: [],

    selectedIncidentId: null,

    running: false,

    liveStages: [],
    liveEventProgress: null
  };


  // =========================================================
  // REFRESH ALL DATA FROM BACKEND
  // =========================================================

  async function refreshAll() {

    try {

      const [
        incidents,
        events,
        detections,
        risks,
        responses,
        verifications,
        notifications,
        auditLogs
      ] = await Promise.all([

        Tables.list("incidents", {
          limit: 500
        }),

        Tables.list("events", {
          limit: 500
        }),

        Tables.list("detections", {
          limit: 500
        }),

        Tables.list("risks", {
          limit: 500
        }),

        Tables.list("responses", {
          limit: 500
        }),

        Tables.list("verifications", {
          limit: 500
        }),

        Tables.list("notifications", {
          limit: 500
        }),

        Tables.list("audit_logs", {
          limit: 500
        })

      ]);


      // =====================================================
      // INCIDENTS
      // =====================================================

      window.data.incidents = Array.isArray(incidents)
        ? incidents.sort(
            (a, b) =>
              new Date(
                b.created_at || b.incident_time
              ) -
              new Date(
                a.created_at || a.incident_time
              )
          )
        : [];


      // =====================================================
      // SECURITY EVENTS
      // =====================================================

      window.data.events = Array.isArray(events)
        ? events.sort(
            (a, b) =>
              new Date(
                b.created_at || b.event_time
              ) -
              new Date(
                a.created_at || a.event_time
              )
          )
        : [];


      // =====================================================
      // DETECTIONS
      // =====================================================

      window.data.detections = Array.isArray(detections)
        ? detections.sort(
            (a, b) =>
              new Date(
                b.created_at || b.detection_time
              ) -
              new Date(
                a.created_at || a.detection_time
              )
          )
        : [];


      // Keep compatibility with the old frontend name
      window.data.aiAnalyses = window.data.detections;


      // =====================================================
      // RISKS
      // =====================================================

      window.data.risks = Array.isArray(risks)
        ? risks.sort(
            (a, b) =>
              new Date(
                b.calculated_at
              ) -
              new Date(
                a.calculated_at
              )
          )
        : [];


      // =====================================================
      // RESPONSES
      // =====================================================

      window.data.responses = Array.isArray(responses)
        ? responses.sort(
            (a, b) =>
              new Date(
                b.response_time
              ) -
              new Date(
                a.response_time
              )
          )
        : [];


      // =====================================================
      // VERIFICATIONS
      // =====================================================

      window.data.verifications = Array.isArray(verifications)
        ? verifications.sort(
            (a, b) =>
              new Date(
                b.verified_at
              ) -
              new Date(
                a.verified_at
              )
          )
        : [];


      // =====================================================
      // NOTIFICATIONS
      // =====================================================

      window.data.notifications = Array.isArray(notifications)
        ? notifications.sort(
            (a, b) =>
              new Date(
                b.created_at || b.notification_time
              ) -
              new Date(
                a.created_at || a.notification_time
              )
          )
        : [];


      // =====================================================
      // AUDIT LOGS
      // =====================================================

      window.data.auditLogs = Array.isArray(auditLogs)
        ? auditLogs.sort(
            (a, b) =>
              new Date(
                b.event_time || b.created_at
              ) -
              new Date(
                a.event_time || a.created_at
              )
          )
        : [];


      // =====================================================
      // OLD FRONTEND CONCEPTS
      // No separate backend tables currently exist.
      // =====================================================

      window.data.clusters = [];

      window.data.fingerprints = [];

      window.data.credentials = [];

      window.data.reports = [];


      // =====================================================
      // DEBUG INFORMATION
      // =====================================================

      console.log(
        "Adaptive SOC state refreshed successfully"
      );

      console.log(
        "Events:",
        window.data.events.length
      );

      console.log(
        "Detections:",
        window.data.detections.length
      );

      console.log(
        "Risks:",
        window.data.risks.length
      );

      console.log(
        "Responses:",
        window.data.responses.length
      );

      console.log(
        "Verifications:",
        window.data.verifications.length
      );

      console.log(
        "Incidents:",
        window.data.incidents.length
      );

      console.log(
        "Notifications:",
        window.data.notifications.length
      );


      return window.data;

    } catch (error) {

      console.error(
        "Adaptive SOC: refreshAll failed",
        error
      );

      throw error;
    }
  }


  // =========================================================
  // GET RECORDS BELONGING TO AN INCIDENT
  // =========================================================

  function byIncident(list, incidentId) {

    if (!Array.isArray(list)) {
      return [];
    }

    return list.filter(
      (record) =>
        record.incident_id === incidentId
    );
  }


  // =========================================================
  // GET LATEST RECORD FOR AN INCIDENT
  // =========================================================

  function latestByIncident(list, incidentId) {

    const items = byIncident(
      list,
      incidentId
    ).sort(
      (a, b) =>
        new Date(
          b.created_at ||
          b.response_time ||
          b.verified_at ||
          b.notification_time ||
          b.event_time ||
          b.detection_time
        ) -
        new Date(
          a.created_at ||
          a.response_time ||
          a.verified_at ||
          a.notification_time ||
          a.event_time ||
          a.detection_time
        )
    );

    return items[0] || null;
  }


  // =========================================================
  // PUBLIC STATE API
  // =========================================================

  return {

    data: window.data,

    refreshAll,

    byIncident,

    latestByIncident

  };

})();


// =============================================================
// GLOBAL ACCESS
// =============================================================

// Make State available globally
window.State = State;

// Make data directly accessible
window.data = State.data;

// Make refreshAll directly accessible
window.refreshAll = State.refreshAll;


// =============================================================
// INITIAL DEBUG
// =============================================================

console.log(
  "Adaptive SOC State loaded"
);

console.log(
  "window.data available:",
  window.data
);

console.log(
  "window.refreshAll available:",
  typeof window.refreshAll
);