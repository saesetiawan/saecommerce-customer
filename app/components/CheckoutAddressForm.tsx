"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Check,
    Edit3,
    Loader2,
    MapPin,
    Plus,
    Save,
    X,
} from "lucide-react";
import { toast } from "sonner";

import { theme } from "@/app/config/theme";
import {
    CityOption,
    DistrictOption,
    getCityOptions,
    getDistrictOptions,
    getProvinceOptions,
    getSubdistrictOptions,
    ProvinceOption,
    SubdistrictOption,
} from "@/app/services/address-option.service";
import {
    createCustomerAddress,
    CustomerAddress,
    CustomerAddressPayload,
    getCustomerAddresses,
    updateCustomerAddress,
} from "@/app/services/customer-address.service";

export type CheckoutAddressFormValue = {
    id?: string;

    receiver_name: string;
    receiver_phone: string;

    province_id: string;
    city_id: string;
    district_id: string;
    subdistrict_id: string;

    province_name: string;
    city_name: string;
    district_name: string;
    subdistrict_name: string;

    province: string;
    city: string;
    district: string;
    sub_district: string;

    postal_code: string;
    address: string;

    latitude: string;
    longitude: string;

    rajaongkir_destination_id: string;
    is_default: boolean;
};

type Props = {
    value: CheckoutAddressFormValue;
    onChange: (value: CheckoutAddressFormValue) => void;
};

type FormMode = "list" | "create" | "edit";

export const initialCheckoutAddressValue: CheckoutAddressFormValue = {
    id: "",

    receiver_name: "",
    receiver_phone: "",

    province_id: "",
    city_id: "",
    district_id: "",
    subdistrict_id: "",

    province_name: "",
    city_name: "",
    district_name: "",
    subdistrict_name: "",

    province: "",
    city: "",
    district: "",
    sub_district: "",

    postal_code: "",
    address: "",

    latitude: "",
    longitude: "",

    rajaongkir_destination_id: "",
    is_default: false,
};

function mapCustomerAddressToFormValue(
    address: CustomerAddress,
): CheckoutAddressFormValue {
    return {
        id: address.id,

        receiver_name: address.receiverName,
        receiver_phone: address.receiverPhone,

        province_id: address.provinceId,
        city_id: address.cityId,
        district_id: address.districtId,
        subdistrict_id: address.subdistrictId,

        province_name: address.provinceName || address.province,
        city_name: address.cityName || address.city,
        district_name: address.districtName || address.district,
        subdistrict_name: address.subdistrictName || address.subdistrict,

        province: address.provinceName || address.province,
        city: address.cityName || address.city,
        district: address.districtName || address.district,
        sub_district: address.subdistrictName || address.subdistrict,

        postal_code: address.postalCode,
        address: address.address,

        latitude: address.latitude ? String(address.latitude) : "",
        longitude: address.longitude ? String(address.longitude) : "",

        rajaongkir_destination_id:
            address.rajaongkirDestinationId || address.subdistrictId,
        is_default: address.isDefault,
    };
}

function mapFormValueToPayload(
    value: CheckoutAddressFormValue,
): CustomerAddressPayload {
    return {
        address: value.address,
        postal_code: value.postal_code,

        sub_district_id: value.subdistrict_id,
        district_id: value.district_id,
        city_id: value.city_id,
        province_id: value.province_id,

        sub_district: value.subdistrict_name || value.sub_district,
        district: value.district_name || value.district,
        city: value.city_name || value.city,
        province: value.province_name || value.province,

        receiver_name: value.receiver_name,
        receiver_phone: value.receiver_phone,

        is_default: value.is_default,
    };
}

function getAddressText(address: CustomerAddress) {
    return [
        address.address,
        address.subdistrictName,
        address.districtName,
        address.cityName,
        address.provinceName,
        address.postalCode,
    ]
        .filter(Boolean)
        .join(", ");
}

export default function CheckoutAddressForm({ value, onChange }: Props) {
    const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState("");
    const [formValue, setFormValue] =
        useState<CheckoutAddressFormValue>(initialCheckoutAddressValue);

    const [mode, setMode] = useState<FormMode>("list");

    const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
    const [cities, setCities] = useState<CityOption[]>([]);
    const [districts, setDistricts] = useState<DistrictOption[]>([]);
    const [subdistricts, setSubdistricts] = useState<SubdistrictOption[]>([]);

    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
    const [isLoadingCities, setIsLoadingCities] = useState(false);
    const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
    const [isLoadingSubdistricts, setIsLoadingSubdistricts] = useState(false);

    const selectedAddress = useMemo(() => {
        return addresses.find((item) => item.id === selectedAddressId) ?? null;
    }, [addresses, selectedAddressId]);

    const updateFormValue = (partial: Partial<CheckoutAddressFormValue>) => {
        setFormValue((previous) => ({
            ...previous,
            ...partial,
        }));
    };

    const fetchProvinces = async () => {
        setIsLoadingProvinces(true);

        try {
            const data = await getProvinceOptions();
            setProvinces(data);
        } catch {
            toast.error("Gagal mengambil data provinsi.");
        } finally {
            setIsLoadingProvinces(false);
        }
    };

    const fetchCities = async (provinceId: string) => {
        if (!provinceId) {
            setCities([]);
            return;
        }

        setIsLoadingCities(true);

        try {
            const data = await getCityOptions(provinceId);
            setCities(data);
        } catch {
            toast.error("Gagal mengambil data kota.");
        } finally {
            setIsLoadingCities(false);
        }
    };

    const fetchDistricts = async (cityId: string) => {
        if (!cityId) {
            setDistricts([]);
            return;
        }

        setIsLoadingDistricts(true);

        try {
            const data = await getDistrictOptions(cityId);
            setDistricts(data);
        } catch {
            toast.error("Gagal mengambil data kecamatan.");
        } finally {
            setIsLoadingDistricts(false);
        }
    };

    const fetchSubdistricts = async (districtId: string) => {
        if (!districtId) {
            setSubdistricts([]);
            return;
        }

        setIsLoadingSubdistricts(true);

        try {
            const data = await getSubdistrictOptions(districtId);
            setSubdistricts(data);
        } catch {
            toast.error("Gagal mengambil data kelurahan/desa.");
        } finally {
            setIsLoadingSubdistricts(false);
        }
    };
    const selectAddress = (address: CustomerAddress) => {
        const mappedAddress = mapCustomerAddressToFormValue(address);

        setSelectedAddressId(address.id);
        setFormValue(mappedAddress);
        onChange(mappedAddress);
        setMode("list");
    };

    const fetchAddresses = async () => {
        setIsLoadingAddresses(true);

        try {
            const response = await getCustomerAddresses({
                page: 1,
                limit: 20,
                orderBy: "created_at",
                searchBy: "receiver_name",
                search: "",
                orderType: "desc",
            });

            setAddresses(response.data);

            if (response.data.length === 0) {
                setSelectedAddressId("");
                setFormValue(initialCheckoutAddressValue);
                onChange(initialCheckoutAddressValue);
                setMode("create");
                return;
            }

            const defaultAddress =
                response.data.find((item) => item.isDefault) ?? response.data[0];

            selectAddress(defaultAddress);
            setMode("list");
        } catch {
            toast.error("Gagal mengambil daftar alamat.");
            setMode("create");
        } finally {
            setIsLoadingAddresses(false);
        }
    };

    const prepareEditForm = async (address: CustomerAddress) => {
        const mappedAddress = mapCustomerAddressToFormValue(address);

        setFormValue(mappedAddress);
        setMode("edit");

        await fetchCities(mappedAddress.province_id);
        await fetchDistricts(mappedAddress.city_id);
        await fetchSubdistricts(mappedAddress.district_id);
    };

    const prepareCreateForm = () => {
        setFormValue(initialCheckoutAddressValue);
        setCities([]);
        setDistricts([]);
        setSubdistricts([]);
        setMode("create");
    };

    useEffect(() => {
        fetchProvinces();
        fetchAddresses();
    }, []);

    useEffect(() => {
        if (value.id && value.id !== formValue.id) {
            setFormValue(value);
        }
    }, [value.id]);

    const handleProvinceChange = async (
        event: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        const provinceId = event.target.value;
        const province = provinces.find((item) => String(item.rajaongkir_id) === provinceId);

        updateFormValue({
            province_id: provinceId,
            province_name: province?.name ?? "",
            province: province?.name ?? "",

            city_id: "",
            city_name: "",
            city: "",

            district_id: "",
            district_name: "",
            district: "",

            subdistrict_id: "",
            subdistrict_name: "",
            sub_district: "",

            rajaongkir_destination_id: "",
        });

        setCities([]);
        setDistricts([]);
        setSubdistricts([]);

        await fetchCities(provinceId);
    };

    const handleCityChange = async (
        event: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        const cityId = event.target.value;
        const city = cities.find((item) => String(item.rajaongkir_id) === cityId);

        updateFormValue({
            city_id: cityId,
            city_name: city?.name ?? "",
            city: city?.name ?? "",

            district_id: "",
            district_name: "",
            district: "",

            subdistrict_id: "",
            subdistrict_name: "",
            sub_district: "",

            rajaongkir_destination_id: "",
        });

        setDistricts([]);
        setSubdistricts([]);

        await fetchDistricts(cityId);
    };

    const handleDistrictChange = async (
        event: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        const districtId = event.target.value;
        const district = districts.find((item) => String(item.rajaongkir_id) === districtId);

        updateFormValue({
            district_id: districtId,
            district_name: district?.name ?? "",
            district: district?.name ?? "",

            subdistrict_id: "",
            subdistrict_name: "",
            sub_district: "",

            rajaongkir_destination_id: "",
        });

        setSubdistricts([]);

        await fetchSubdistricts(districtId);
    };

    const handleSubdistrictChange = (
        event: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        const subdistrictId = event.target.value;
        const subdistrict = subdistricts.find(
            (item) => String(item.rajaongkir_id) === subdistrictId,
        );

        updateFormValue({
            subdistrict_id: subdistrictId,
            subdistrict_name: subdistrict?.name ?? "",
            sub_district: subdistrict?.name ?? "",

            rajaongkir_destination_id: subdistrictId,
        });
    };

    const validateForm = () => {
        if (!formValue.receiver_name.trim()) {
            toast.error("Nama penerima wajib diisi.");
            return false;
        }

        if (!formValue.receiver_phone.trim()) {
            toast.error("Nomor HP penerima wajib diisi.");
            return false;
        }

        if (!formValue.province_id) {
            toast.error("Provinsi wajib dipilih.");
            return false;
        }

        if (!formValue.city_id) {
            toast.error("Kota/Kabupaten wajib dipilih.");
            return false;
        }

        if (!formValue.district_id) {
            toast.error("Kecamatan wajib dipilih.");
            return false;
        }

        if (!formValue.subdistrict_id) {
            toast.error("Kelurahan/Desa wajib dipilih.");
            return false;
        }

        if (!formValue.address.trim()) {
            toast.error("Alamat lengkap wajib diisi.");
            return false;
        }

        return true;
    };

    const handleSaveAddress = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSaving(true);

        try {
            const payload = mapFormValueToPayload(formValue);

            const savedAddress =
                mode === "edit" && formValue.id
                    ? await updateCustomerAddress(formValue.id, payload)
                    : await createCustomerAddress(payload);

            toast.success(
                mode === "edit"
                    ? "Alamat berhasil diperbarui."
                    : "Alamat berhasil dibuat.",
            );

            await fetchAddresses();
            selectAddress(savedAddress);
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Gagal menyimpan alamat.",
            );
        } finally {
            setIsSaving(false);
        }
    };

    const isFormMode = mode === "create" || mode === "edit";

    return (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-sm font-extrabold uppercase text-slate-500">
                        Alamat Pengiriman
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Pilih alamat tersimpan atau buat alamat baru.
                    </p>
                </div>

                {addresses.length > 0 ? (
                    <button
                        type="button"
                        onClick={prepareCreateForm}
                        className="inline-flex items-center gap-2 rounded-xl bg-pink-50 px-4 py-2 text-sm font-bold text-pink-600 hover:bg-pink-100"
                    >
                        <Plus size={16} />
                        Alamat Baru
                    </button>
                ) : null}
            </div>

            {isLoadingAddresses ? (
                <div className="flex min-h-[160px] items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3 text-slate-500">
                        <Loader2 size={18} className="animate-spin text-pink-500" />
                        <span className="font-semibold">Memuat alamat...</span>
                    </div>
                </div>
            ) : addresses.length > 0 && mode === "list" ? (
                <div className="space-y-3">
                    {addresses.map((address) => {
                        const isSelected = selectedAddressId === address.id;

                        return (
                            <div
                                key={address.id}
                                className={`rounded-2xl border p-4 transition ${
                                    isSelected
                                        ? "border-pink-300 bg-pink-50"
                                        : "border-slate-200 bg-white"
                                }`}
                            >
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <button
                                        type="button"
                                        onClick={() => selectAddress(address)}
                                        className="flex flex-1 gap-3 text-left"
                                    >
                                        <div
                                            className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                                                isSelected
                                                    ? "bg-pink-500 text-white"
                                                    : "bg-slate-100 text-slate-400"
                                            }`}
                                        >
                                            {isSelected ? <Check size={16} /> : <MapPin size={16} />}
                                        </div>

                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="font-extrabold text-slate-950">
                                                    Rumah • {address.receiverName}
                                                </p>

                                                {address.isDefault ? (
                                                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-600">
                            Default
                          </span>
                                                ) : null}
                                            </div>

                                            <p className="mt-2 text-sm leading-6 text-slate-700">
                                                {getAddressText(address)}
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-600">
                                                {address.receiverPhone}
                                            </p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => prepareEditForm(address)}
                                        className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                                    >
                                        <Edit3 size={15} />
                                        Ubah
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : null}

            {addresses.length === 0 && mode === "create" ? (
                <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
                    <p className="font-bold text-orange-700">
                        Kamu belum memiliki alamat.
                    </p>

                    <p className="mt-1 text-sm text-orange-600">
                        Buat alamat pengiriman terlebih dahulu untuk melanjutkan checkout.
                    </p>
                </div>
            ) : null}

            {isFormMode ? (
                <div className={addresses.length > 0 ? "mt-5" : ""}>
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <h3 className="font-extrabold text-slate-950">
                            {mode === "edit" ? "Ubah Alamat" : "Tambah Alamat Baru"}
                        </h3>

                        {addresses.length > 0 ? (
                            <button
                                type="button"
                                onClick={() => setMode("list")}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                            >
                                <X size={15} />
                                Batal
                            </button>
                        ) : null}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-800">
                                Nama Penerima
                            </label>

                            <input
                                value={formValue.receiver_name}
                                onChange={(event) =>
                                    updateFormValue({
                                        receiver_name: event.target.value,
                                    })
                                }
                                placeholder="Contoh: Bagus Setiawan"
                                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${theme.colors.neutral.input}`}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-800">
                                Nomor HP Penerima
                            </label>

                            <input
                                value={formValue.receiver_phone}
                                onChange={(event) =>
                                    updateFormValue({
                                        receiver_phone: event.target.value,
                                    })
                                }
                                placeholder="Contoh: 081224173721"
                                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${theme.colors.neutral.input}`}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-800">
                                Provinsi
                            </label>

                            <select
                                value={formValue.province_id}
                                onChange={handleProvinceChange}
                                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${theme.colors.neutral.input}`}
                            >
                                <option value="">
                                    {isLoadingProvinces
                                        ? "Memuat provinsi..."
                                        : "Pilih provinsi"}
                                </option>

                                {provinces.map((province) => (
                                    <option key={province.id} value={province.rajaongkir_id}>
                                        {province.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-800">
                                Kota / Kabupaten
                            </label>

                            <select
                                value={formValue.city_id}
                                onChange={handleCityChange}
                                disabled={!formValue.province_id || isLoadingCities}
                                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60 ${theme.colors.neutral.input}`}
                            >
                                <option value="">
                                    {isLoadingCities ? "Memuat kota..." : "Pilih kota/kabupaten"}
                                </option>

                                {cities.map((city) => (
                                    <option key={city.id} value={city.rajaongkir_id}>
                                        {city.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-800">
                                Kecamatan
                            </label>

                            <select
                                value={formValue.district_id}
                                onChange={handleDistrictChange}
                                disabled={!formValue.city_id || isLoadingDistricts}
                                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60 ${theme.colors.neutral.input}`}
                            >
                                <option value="">
                                    {isLoadingDistricts
                                        ? "Memuat kecamatan..."
                                        : "Pilih kecamatan"}
                                </option>

                                {districts.map((district) => (
                                    <option key={district.id} value={district.rajaongkir_id}>
                                        {district.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-800">
                                Kelurahan / Desa
                            </label>

                            <select
                                value={formValue.subdistrict_id}
                                onChange={handleSubdistrictChange}
                                disabled={!formValue.district_id || isLoadingSubdistricts}
                                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60 ${theme.colors.neutral.input}`}
                            >
                                <option value="">
                                    {isLoadingSubdistricts
                                        ? "Memuat kelurahan/desa..."
                                        : "Pilih kelurahan/desa"}
                                </option>

                                {subdistricts.map((subdistrict) => (
                                    <option key={subdistrict.id} value={subdistrict.rajaongkir_id}>
                                        {subdistrict.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-800">
                                Kode Pos
                            </label>

                            <input
                                value={formValue.postal_code}
                                onChange={(event) =>
                                    updateFormValue({
                                        postal_code: event.target.value,
                                    })
                                }
                                placeholder="Contoh: 145112"
                                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${theme.colors.neutral.input}`}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-800">
                                Default Address
                            </label>

                            <label
                                className={`flex h-[46px] cursor-pointer items-center gap-3 rounded-xl border px-4 text-sm ${theme.colors.neutral.input}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={formValue.is_default}
                                    onChange={(event) =>
                                        updateFormValue({
                                            is_default: event.target.checked,
                                        })
                                    }
                                    className="h-4 w-4 accent-pink-500"
                                />

                                Jadikan alamat utama
                            </label>
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-semibold text-slate-800">
                                Alamat Lengkap
                            </label>

                            <textarea
                                value={formValue.address}
                                onChange={(event) =>
                                    updateFormValue({
                                        address: event.target.value,
                                    })
                                }
                                placeholder="Nama jalan, nomor rumah, RT/RW, patokan, detail gedung, dan lainnya."
                                rows={4}
                                className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${theme.colors.neutral.input}`}
                            />
                        </div>

                        <div className="md:col-span-2">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                                RajaOngkir Destination ID:{" "}
                                <strong>
                                    {formValue.rajaongkir_destination_id ||
                                        formValue.subdistrict_id ||
                                        "-"}
                                </strong>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 flex justify-end">
                        <button
                            type="button"
                            disabled={isSaving}
                            onClick={handleSaveAddress}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-500 px-6 py-3 text-sm font-extrabold text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}

                            {isSaving
                                ? "Menyimpan..."
                                : mode === "edit"
                                    ? "Update Alamat"
                                    : "Simpan Alamat"}
                        </button>
                    </div>
                </div>
            ) : null}
        </section>
    );
}