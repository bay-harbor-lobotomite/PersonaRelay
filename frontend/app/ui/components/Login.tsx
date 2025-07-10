// app/components/Login.tsx
"use client"; // This is a client component, as it uses hooks

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "@/app/lib/constants";
import { checkLogin } from "@/app/lib/checkLogin";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [currentUser, setCurrentUser] = useState<any>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if the user is already logged in
    checkLogin(router, setCurrentUser);
  }, []);

  const handleLogin = async () => {
    // The /token endpoint expects form data, not JSON
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_BASE_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      throw new Error("Failed to login");
    }

    const data = await response.json();
    // Not worried about safety in a demo :P
    localStorage.setItem("accessToken", data.access_token);
    router.push("/dashboard");
  };

  const handleRegister = async () => {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Registration failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Username and password are required.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      await handleLogin();
    } catch (loginError) {
      console.log("Login failed, attempting to register...");
      try {
        await handleRegister();
        console.log("Registration successful, logging in again...");
        await handleLogin();
      } catch (registerOrSecondLoginError: any) {
        setError(registerOrSecondLoginError.message || "An unexpected error occurred. The username might be taken or invalid.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--color-bg-secondary)" }}>
      <div className="w-full max-w-md p-8 space-y-8 rounded-xl shadow-lg border border-white" style={{ backgroundColor: "var(--color-bg-primary)" }}>
        <div className="text-center">
          <h2 className="text-3xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            Welcome!
          </h2>
          <p className="mt-2 text-sm text-gray-600" style={{ color: "var(--color-text-secondary)" }}>
            Login to continue
          </p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-3 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-green sm:text-sm"
                style={{ color: "var(--color-text-primary)" }}
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password-input" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full mt-4 appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-3 placeholder-gray-500 focus:z-10 focus:border-green-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                style={{ color: "var(--color-text-primary)" }}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="mt-2 text-sm text-center text-red-600">
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent py-3 px-4 text-sm font-medium text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--color-accent-primary)" }}
            >
              {isLoading ? "Processing..." : "Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}