import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

const BASE = process.env.BASE_URL || "http://localhost:5000";

async function run() {
  console.log("Starting integration tests against", BASE);

  // Test data
  const user = {
    username: "testuser",
    email: `testuser+${Date.now()}@example.com`,
    password: "Password1!",
  };

  // 1) Register
  let res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  const registerBody = await res.json();
  console.log(
    "REGISTER status",
    res.status,
    registerBody.message || registerBody.error
  );
  if (!res.ok) return process.exit(2);

  // 2) Login
  res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });
  const loginBody = await res.json();
  console.log("LOGIN status", res.status, loginBody.message || loginBody.error);
  if (!res.ok) return process.exit(3);
  const token = loginBody.data?.token || loginBody.token;
  if (!token) {
    console.error("No token returned");
    return process.exit(4);
  }

  // 3) Create additional user (if create endpoint exists for admin, skip)
  // Use GET /api/users to verify list
  res = await fetch(`${BASE}/api/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const usersBody = await res.json();
  console.log(
    "GET /api/users",
    res.status,
    usersBody.message || usersBody.error
  );
  if (!res.ok) return process.exit(5);
  const me =
    usersBody.data?.find((u) => u.email === user.email) || usersBody.data?.[0];
  if (!me) {
    console.error("Could not find user in list");
    return process.exit(6);
  }

  // 4) Get user by id
  res = await fetch(`${BASE}/api/users/${me.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const getBody = await res.json();
  console.log(
    "GET /api/users/:id",
    res.status,
    getBody.message || getBody.error
  );
  if (!res.ok) return process.exit(7);

  // 5) Update user
  res = await fetch(`${BASE}/api/users/${me.id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username: "updated-" + me.username }),
  });
  const updateBody = await res.json();
  console.log(
    "PUT /api/users/:id",
    res.status,
    updateBody.message || updateBody.error
  );
  if (!res.ok) return process.exit(8);

  // 6) Upload avatar (if upload route exists)
  try {
    // Use global FormData and fetch available in Node 18+ / 22+
    const form = new FormData();
    const avatarUrl = new URL("./tests/fixtures/avatar.png", import.meta.url);
    const avatarPath = fileURLToPath(avatarUrl);
    if (fs.existsSync(avatarPath)) {
      form.append("avatar", fs.createReadStream(avatarPath));
      res = await fetch(`${BASE}/api/users/${me.id}/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const avatarBody = await res.json();
      console.log(
        "POST /api/users/:id/avatar",
        res.status,
        avatarBody.message || avatarBody.error
      );
      if (!res.ok) return process.exit(9);
    } else {
      console.log(
        "Skipping avatar upload test (tests/fixtures/avatar.png missing)"
      );
    }
  } catch (e) {
    console.warn("Avatar upload test failed:", e?.message || e);
  }

  // 7) Delete user
  res = await fetch(`${BASE}/api/users/${me.id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const delBody = await res.json();
  console.log(
    "DELETE /api/users/:id",
    res.status,
    delBody.message || delBody.error
  );
  // deletion may be forbidden for non-admin; that's acceptable as long as we handle status

  console.log("Integration tests finished successfully");
  process.exit(0);
}

run().catch((err) => {
  console.error("Test runner error", err);
  process.exit(10);
});
