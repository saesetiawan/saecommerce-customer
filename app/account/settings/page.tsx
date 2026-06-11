"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Bell,
    Loader2,
    Lock,
    Mail,
    Phone,
    Save,
    User,
} from "lucide-react";
import { toast } from "sonner";

import Navbar from "@/app/components/Navbar";
import { theme } from "@/app/config/theme";
import {
    changeCustomerPassword,
    getCustomerProfile,
    getUser,
    updateCustomerProfile,
} from "@/app/services/auth.service";

type ProfileForm = {
    fullName: string;
    birthDate: string;
    email: string;
    phone: string;
    promoNotificationEnabled: boolean;
    orderNotificationEnabled: boolean;
};

type PasswordForm = {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
};

const initialPasswordForm: PasswordForm = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
};

function toDateInput(value?: string) {
    if (!value) {
        return "";
    }

    return value.slice(0, 10);
}

function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error) {
        return error.message;
    }

    return fallback;
}

export default function AccountSettingsPage() {
    const localUser = getUser();

    const [profileForm, setProfileForm] = useState<ProfileForm>(() => ({
        fullName: localUser?.full_name ?? "",
        birthDate: toDateInput(localUser?.birth_date),
        email: localUser?.email ?? "",
        phone: localUser?.phone ?? "",
        promoNotificationEnabled:
            localUser?.promo_notification_enabled ?? true,
        orderNotificationEnabled:
            localUser?.order_notification_enabled ?? true,
    }));
    const [passwordForm, setPasswordForm] =
        useState<PasswordForm>(initialPasswordForm);

    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const avatarLetter = useMemo(() => {
        return (profileForm.fullName || profileForm.email || "U").charAt(0).toUpperCase();
    }, [profileForm.email, profileForm.fullName]);

    const loadProfile = useCallback(async () => {
        setIsLoadingProfile(true);
        setErrorMessage("");

        try {
            const profile = await getCustomerProfile();

            setProfileForm({
                fullName: profile.full_name ?? "",
                birthDate: toDateInput(profile.birth_date),
                email: profile.email ?? "",
                phone: profile.phone ?? "",
                promoNotificationEnabled:
                    profile.promo_notification_enabled ?? true,
                orderNotificationEnabled:
                    profile.order_notification_enabled ?? true,
            });
        } catch (error) {
            setErrorMessage(
                getErrorMessage(error, "Gagal mengambil data profil customer."),
            );
        } finally {
            setIsLoadingProfile(false);
        }
    }, []);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            void loadProfile();
        }, 0);

        return () => window.clearTimeout(timeout);
    }, [loadProfile]);

    const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!profileForm.fullName.trim()) {
            toast.error("Nama lengkap wajib diisi.");
            return;
        }

        if (!profileForm.email.trim()) {
            toast.error("Email wajib diisi.");
            return;
        }

        setIsSavingProfile(true);

        try {
            const profile = await updateCustomerProfile({
                full_name: profileForm.fullName.trim(),
                birth_date: profileForm.birthDate || undefined,
                email: profileForm.email.trim(),
                phone: profileForm.phone.trim(),
                promo_notification_enabled:
                    profileForm.promoNotificationEnabled,
                order_notification_enabled:
                    profileForm.orderNotificationEnabled,
            });

            setProfileForm({
                fullName: profile.full_name ?? "",
                birthDate: toDateInput(profile.birth_date),
                email: profile.email ?? "",
                phone: profile.phone ?? "",
                promoNotificationEnabled:
                    profile.promo_notification_enabled ?? true,
                orderNotificationEnabled:
                    profile.order_notification_enabled ?? true,
            });

            toast.success("Pengaturan akun berhasil disimpan.");
        } catch (error) {
            toast.error(
                getErrorMessage(error, "Gagal menyimpan pengaturan akun."),
            );
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!passwordForm.currentPassword) {
            toast.error("Password lama wajib diisi.");
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            toast.error("Password baru minimal 8 karakter.");
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("Konfirmasi password tidak sama.");
            return;
        }

        setIsSavingPassword(true);

        try {
            await changeCustomerPassword({
                current_password: passwordForm.currentPassword,
                new_password: passwordForm.newPassword,
                new_password_confirmation: passwordForm.confirmPassword,
            });

            setPasswordForm(initialPasswordForm);
            toast.success("Password berhasil diperbarui.");
        } catch (error) {
            toast.error(getErrorMessage(error, "Gagal memperbarui password."));
        } finally {
            setIsSavingPassword(false);
        }
    };

    return (
        <main className={`min-h-screen ${theme.colors.neutral.page}`}>
            <Navbar />

            <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
                <div className="mb-6">
                    <Link
                        href="/products"
                        className={`mb-4 inline-flex items-center gap-2 text-sm font-semibold ${theme.colors.neutral.body} hover:text-pink-600`}
                    >
                        <ArrowLeft size={16} />
                        Kembali belanja
                    </Link>

                    <p className={`font-semibold ${theme.colors.primary.text}`}>
                        Akun Saya
                    </p>

                    <h1
                        className={`mt-2 text-2xl font-extrabold sm:text-4xl ${theme.colors.neutral.title}`}
                    >
                        Pengaturan Akun
                    </h1>

                    <p className={`mt-2 text-sm sm:text-base ${theme.colors.neutral.body}`}>
                        Kelola profil, kontak, password, dan preferensi notifikasi.
                    </p>
                </div>

                {errorMessage ? (
                    <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
                        {errorMessage}
                    </div>
                ) : null}

                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-6">
                        <form
                            id="account-settings-form"
                            onSubmit={handleProfileSubmit}
                            className="space-y-6"
                        >
                            <section
                                className={`rounded-2xl border p-5 ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                            >
                                <div className="mb-5 flex items-center gap-3">
                                    <div
                                        className={`flex h-11 w-11 items-center justify-center rounded-full ${theme.colors.primary.soft} ${theme.colors.primary.text}`}
                                    >
                                        <User size={22} />
                                    </div>

                                    <div>
                                        <h2 className={`font-bold ${theme.colors.neutral.title}`}>
                                            Informasi Profil
                                        </h2>
                                        <p className={`text-sm ${theme.colors.neutral.body}`}>
                                            Data dasar akun customer.
                                        </p>
                                    </div>
                                </div>

                                {isLoadingProfile ? (
                                    <div className="flex min-h-36 items-center justify-center rounded-2xl bg-slate-50">
                                        <div className="flex items-center gap-3 text-slate-500">
                                            <Loader2 className="animate-spin text-pink-500" />
                                            <span className="font-semibold">Memuat profil...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label
                                                className={`mb-2 block text-sm font-semibold ${theme.colors.neutral.title}`}
                                            >
                                                Nama Lengkap
                                            </label>
                                            <input
                                                value={profileForm.fullName}
                                                onChange={(event) =>
                                                    setProfileForm((value) => ({
                                                        ...value,
                                                        fullName: event.target.value,
                                                    }))
                                                }
                                                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${theme.colors.neutral.input}`}
                                            />
                                        </div>

                                        <div>
                                            <label
                                                className={`mb-2 block text-sm font-semibold ${theme.colors.neutral.title}`}
                                            >
                                                Tanggal Lahir
                                            </label>
                                            <input
                                                type="date"
                                                value={profileForm.birthDate}
                                                onChange={(event) =>
                                                    setProfileForm((value) => ({
                                                        ...value,
                                                        birthDate: event.target.value,
                                                    }))
                                                }
                                                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${theme.colors.neutral.input}`}
                                            />
                                        </div>

                                        <div>
                                            <label
                                                className={`mb-2 block text-sm font-semibold ${theme.colors.neutral.title}`}
                                            >
                                                Email
                                            </label>
                                            <div
                                                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${theme.colors.neutral.input}`}
                                            >
                                                <Mail size={18} className="text-slate-400" />
                                                <input
                                                    type="email"
                                                    value={profileForm.email}
                                                    onChange={(event) =>
                                                        setProfileForm((value) => ({
                                                            ...value,
                                                            email: event.target.value,
                                                        }))
                                                    }
                                                    className="w-full bg-transparent text-sm outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label
                                                className={`mb-2 block text-sm font-semibold ${theme.colors.neutral.title}`}
                                            >
                                                Nomor HP
                                            </label>
                                            <div
                                                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${theme.colors.neutral.input}`}
                                            >
                                                <Phone size={18} className="text-slate-400" />
                                                <input
                                                    value={profileForm.phone}
                                                    onChange={(event) =>
                                                        setProfileForm((value) => ({
                                                            ...value,
                                                            phone: event.target.value,
                                                        }))
                                                    }
                                                    className="w-full bg-transparent text-sm outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </section>

                            <section
                                className={`rounded-2xl border p-5 ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                            >
                                <div className="mb-5 flex items-center gap-3">
                                    <div
                                        className={`flex h-11 w-11 items-center justify-center rounded-full ${theme.colors.accent.soft} ${theme.colors.accent.text}`}
                                    >
                                        <Bell size={22} />
                                    </div>

                                    <div>
                                        <h2 className={`font-bold ${theme.colors.neutral.title}`}>
                                            Notifikasi
                                        </h2>
                                        <p className={`text-sm ${theme.colors.neutral.body}`}>
                                            Atur info promo dan status pesanan.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className={`font-bold ${theme.colors.neutral.title}`}>
                                                Promo dan diskon
                                            </p>
                                            <p className={`text-sm ${theme.colors.neutral.body}`}>
                                                Terima info promo produk bayi dan anak.
                                            </p>
                                        </div>

                                        <input
                                            type="checkbox"
                                            checked={profileForm.promoNotificationEnabled}
                                            onChange={(event) =>
                                                setProfileForm((value) => ({
                                                    ...value,
                                                    promoNotificationEnabled: event.target.checked,
                                                }))
                                            }
                                            className="h-5 w-5"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className={`font-bold ${theme.colors.neutral.title}`}>
                                                Status pesanan
                                            </p>
                                            <p className={`text-sm ${theme.colors.neutral.body}`}>
                                                Terima update pembayaran dan pengiriman.
                                            </p>
                                        </div>

                                        <input
                                            type="checkbox"
                                            checked={profileForm.orderNotificationEnabled}
                                            onChange={(event) =>
                                                setProfileForm((value) => ({
                                                    ...value,
                                                    orderNotificationEnabled: event.target.checked,
                                                }))
                                            }
                                            className="h-5 w-5"
                                        />
                                    </label>
                                </div>
                            </section>
                        </form>

                        <form onSubmit={handlePasswordSubmit}>
                            <section
                                className={`rounded-2xl border p-5 ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                            >
                                <div className="mb-5 flex items-center gap-3">
                                    <div
                                        className={`flex h-11 w-11 items-center justify-center rounded-full ${theme.colors.secondary.soft} ${theme.colors.secondary.text}`}
                                    >
                                        <Lock size={22} />
                                    </div>

                                    <div>
                                        <h2 className={`font-bold ${theme.colors.neutral.title}`}>
                                            Ubah Password
                                        </h2>
                                        <p className={`text-sm ${theme.colors.neutral.body}`}>
                                            Gunakan password yang kuat dan aman.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label
                                            className={`mb-2 block text-sm font-semibold ${theme.colors.neutral.title}`}
                                        >
                                            Password Lama
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordForm.currentPassword}
                                            onChange={(event) =>
                                                setPasswordForm((value) => ({
                                                    ...value,
                                                    currentPassword: event.target.value,
                                                }))
                                            }
                                            placeholder="Masukkan password lama"
                                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${theme.colors.neutral.input}`}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            className={`mb-2 block text-sm font-semibold ${theme.colors.neutral.title}`}
                                        >
                                            Password Baru
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordForm.newPassword}
                                            onChange={(event) =>
                                                setPasswordForm((value) => ({
                                                    ...value,
                                                    newPassword: event.target.value,
                                                }))
                                            }
                                            placeholder="Password baru"
                                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${theme.colors.neutral.input}`}
                                        />
                                    </div>

                                    <div>
                                        <label
                                            className={`mb-2 block text-sm font-semibold ${theme.colors.neutral.title}`}
                                        >
                                            Konfirmasi Password
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordForm.confirmPassword}
                                            onChange={(event) =>
                                                setPasswordForm((value) => ({
                                                    ...value,
                                                    confirmPassword: event.target.value,
                                                }))
                                            }
                                            placeholder="Ulangi password baru"
                                            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${theme.colors.neutral.input}`}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSavingPassword}
                                    className={`mt-5 flex w-full items-center justify-center gap-2 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70 sm:w-fit ${theme.radius.button} ${theme.colors.secondary.bg} ${theme.colors.secondary.hover}`}
                                >
                                    {isSavingPassword ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Lock size={18} />
                                    )}
                                    Simpan Password
                                </button>
                            </section>
                        </form>
                    </div>

                    <aside
                        className={`h-fit rounded-2xl border p-5 lg:sticky lg:top-32 ${theme.colors.neutral.card} ${theme.colors.neutral.border}`}
                    >
                        <h2 className={`text-xl font-bold ${theme.colors.neutral.title}`}>
                            Ringkasan Akun
                        </h2>

                        <div className="mt-5 flex items-center gap-3">
                            <div
                                className={`flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white ${theme.colors.primary.bg}`}
                            >
                                {avatarLetter}
                            </div>

                            <div className="min-w-0">
                                <p className={`truncate font-bold ${theme.colors.neutral.title}`}>
                                    {profileForm.fullName || "Customer"}
                                </p>
                                <p className={`truncate text-sm ${theme.colors.neutral.body}`}>
                                    {profileForm.email || "Customer"}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-3">
                            <button
                                type="submit"
                                form="account-settings-form"
                                disabled={isLoadingProfile || isSavingProfile}
                                className={`flex items-center justify-center gap-2 px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-70 ${theme.radius.button} ${theme.colors.primary.bg} ${theme.colors.primary.hover}`}
                            >
                                {isSavingProfile ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Save size={18} />
                                )}
                                Simpan Perubahan
                            </button>

                            <Link
                                href="/account/address"
                                className={`flex items-center justify-center border px-5 py-3 font-bold ${theme.radius.button} ${theme.colors.neutral.border} ${theme.colors.neutral.title} hover:bg-slate-50`}
                            >
                                Kelola Alamat
                            </Link>
                        </div>
                    </aside>
                </div>
            </section>
        </main>
    );
}
