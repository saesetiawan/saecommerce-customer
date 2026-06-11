"use client";

import Link from "next/link";
import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, Lock, Mail } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import { theme } from "@/app/config/theme";
import { login, saveAuth } from '@/app/services/auth.service';
import { useWebsiteSettings } from "@/app/contexts/WebsiteSettingsContext";

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginContent />
        </Suspense>
    );
}

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { settings } = useWebsiteSettings();

    const redirect = searchParams.get("redirect") ?? "/products";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setErrorMessage("");
        setIsLoading(true);

        try {
            const response = await login({
                email,
                password,
            });
            saveAuth(response)
            router.push(redirect);
            router.refresh();
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : "Login gagal. Silakan coba lagi.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className={`min-h-screen ${theme.colors.neutral.page}`}>
            <Navbar />

            <section className="mx-auto grid max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-2 lg:items-center lg:gap-12">
                <div className="hidden lg:block">
                    <p className={`font-semibold ${theme.colors.primary.text}`}>
                        {settings.siteName}
                    </p>

                    <h1
                        className={`mt-4 text-5xl font-extrabold leading-tight ${theme.colors.neutral.title}`}
                    >
                        Belanja kebutuhan anak jadi lebih mudah.
                    </h1>

                    <p className={`mt-5 max-w-md text-lg ${theme.colors.neutral.body}`}>
                        Masuk untuk melihat pesanan, menyimpan wishlist, dan melanjutkan
                        belanja produk bayi sampai remaja.
                    </p>

                    <Link
                        href="/"
                        className={`mt-8 inline-flex px-6 py-3 font-bold text-white ${theme.radius.button} ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                    >
                        Lanjut Belanja
                    </Link>
                </div>

                <div
                    className={`mx-auto w-full max-w-md ${theme.radius.card} ${theme.colors.neutral.card} p-5 shadow-sm sm:p-8`}
                >
                    <Link
                        href="/"
                        className={`mb-6 inline-flex items-center gap-2 text-sm font-semibold lg:hidden ${theme.colors.neutral.body}`}
                    >
                        <ArrowLeft size={16} />
                        Kembali belanja
                    </Link>

                    <div>
                        <p
                            className={`text-sm font-semibold lg:hidden ${theme.colors.primary.text}`}
                        >
                            {settings.siteName}
                        </p>

                        <h2
                            className={`mt-1 text-2xl font-bold sm:text-3xl ${theme.colors.neutral.title}`}
                        >
                            Masuk
                        </h2>

                        <p
                            className={`mt-2 text-sm sm:text-base ${theme.colors.neutral.body}`}
                        >
                            Selamat datang kembali di {settings.siteName}.
                        </p>
                    </div>

                    {errorMessage ? (
                        <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                            {errorMessage}
                        </div>
                    ) : null}

                    <form onSubmit={handleLogin} className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
                        <div>
                            <label
                                className={`mb-2 block text-sm font-medium ${theme.colors.neutral.title}`}
                            >
                                Email
                            </label>

                            <div
                                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${theme.colors.neutral.input}`}
                            >
                                <Mail size={18} className="shrink-0 text-slate-400" />

                                <input
                                    type="email"
                                    placeholder="nama@email.com"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    required
                                    suppressHydrationWarning
                                    className="w-full bg-transparent text-sm outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                className={`mb-2 block text-sm font-medium ${theme.colors.neutral.title}`}
                            >
                                Password
                            </label>

                            <div
                                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${theme.colors.neutral.input}`}
                            >
                                <Lock size={18} className="shrink-0 text-slate-400" />

                                <input
                                    type="password"
                                    placeholder="Masukkan password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    required
                                    suppressHydrationWarning
                                    className="w-full bg-transparent text-sm outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                            <label
                                className={`flex items-center gap-2 ${theme.colors.neutral.body}`}
                            >
                                <input type="checkbox" className="rounded" />
                                Ingat saya
                            </label>

                            <Link
                                href="#"
                                className={`font-semibold ${theme.colors.primary.text}`}
                            >
                                Lupa password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`flex w-full items-center justify-center gap-2 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-70 sm:text-base ${theme.radius.button} ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                "Masuk"
                            )}
                        </button>
                    </form>

                    <p className={`mt-6 text-center text-sm ${theme.colors.neutral.body}`}>
                        Belum punya akun?{" "}
                        <Link
                            href="/register"
                            className={`font-bold ${theme.colors.primary.text}`}
                        >
                            Daftar
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    );
}
