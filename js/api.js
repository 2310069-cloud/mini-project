/**
 * Adaptive SOC - Local Table API wrapper
 * Talks ONLY to the local FastAPI backend.
 * No external services.
 */

const Tables = (() => {

  const API_BASE = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http'))
    ? window.location.origin
    : "http://127.0.0.1:8000";

  async function _req(path, opts = {}) {

    const res = await fetch(`${API_BASE}/${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(opts.headers || {})
      },
      ...opts
    });

    if (!res.ok && res.status !== 204) {
      const body = await res.json().catch(async () => ({ detail: await res.text().catch(() => '') }));
      const detail = body && body.detail;
      const message = Array.isArray(detail)
        ? detail.map((item) => item.msg || 'Invalid request').join(' ')
        : (detail || body.message || `Request failed with status ${res.status}.`);
      const error = new Error(message);
      error.status = res.status;
      throw error;
    }

    if (res.status === 204) {
      return null;
    }

    return res.json();
  }


  return {

    async list(
      table,
      {
        page = 1,
        limit = 200,
        sort
      } = {}
    ) {

      let all = [];

      let p = page;

      for (let i = 0; i < 25; i++) {

        const qs = new URLSearchParams({
          page: String(p),
          limit: String(limit)
        });

        if (sort) {
          qs.set("sort", sort);
        }

        const resp = await _req(
          `tables/${table}?${qs.toString()}`
        );

        const data =
          resp && resp.data
            ? resp.data
            : [];

        all = all.concat(data);

        if (
          !resp ||
          data.length < limit ||
          all.length >= (resp.total || all.length)
        ) {
          break;
        }

        p += 1;
      }

      return all;
    },


    async get(table, id) {

      return _req(
        `tables/${table}/${id}`
      );
    },


    async create(table, data) {

      return _req(
        `tables/${table}`,
        {
          method: "POST",
          body: JSON.stringify(data)
        }
      );
    },


    async update(table, id, data) {

      return _req(
        `tables/${table}/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(data)
        }
      );
    },


    async remove(table, id) {

      return _req(
        `tables/${table}/${id}`,
        {
          method: "DELETE"
        }
      );
    },

    async registerAccount(data) {
      return _req('auth/register', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async loginAccount(data) {
      return _req('auth/login', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async restoreAuthSession(token) {
      return _req('auth/session', {
        method: 'POST',
        body: JSON.stringify({ token })
      });
    },

    async logoutAccount(token) {
      return _req('auth/logout', {
        method: 'POST',
        body: JSON.stringify({ token })
      });
    }

  };

})();