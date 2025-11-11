"use client";

/**
 * @file components/products/ProductForm.tsx
 * @description 상품 등록/수정 폼 컴포넌트
 *
 * 이 컴포넌트는 도매점이 상품을 등록하거나 수정할 때 사용하는 폼입니다.
 *
 * 주요 기능:
 * 1. 상품명 입력
 * 2. 가격 입력 (숫자만)
 * 3. 단위 선택 (kg, g, 개 등)
 * 4. 재고 입력
 * 5. 이미지 업로드 (Supabase Storage)
 * 6. 이미지 미리보기
 * 7. 용량 제한 (5MB)
 *
 * 핵심 구현 로직:
 * - React Hook Form + Zod로 폼 검증
 * - Supabase Storage에 이미지 업로드
 * - useClerkSupabaseClient 훅으로 인증된 클라이언트 사용
 * - 이미지 미리보기를 위한 FileReader API 사용
 *
 * @dependencies
 * - react-hook-form: 폼 관리 및 유효성 검사
 * - zod: 스키마 검증
 * - @clerk/nextjs: 사용자 인증
 * - @/lib/supabase/clerk-client: Supabase 클라이언트
 * - @/components/ui: shadcn/ui 컴포넌트
 * - lucide-react: 아이콘
 *
 * @see {@link docs/PRD.md} - 상품 등록 페이지 명세
 * @see {@link docs/TODO.md} - TODO 499-509 라인
 */

import { useState, useRef } from "react";
import * as React from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUser } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { REGIONS, getCitiesByRegion } from "@/lib/constants/regions";

// 상품 등록 폼 스키마
const productFormSchema = z.object({
  original_name: z
    .string()
    .min(1, "상품명을 입력해주세요.")
    .max(100, "상품명은 100자 이하로 입력해주세요."),
  price: z
    .number()
    .min(1, "가격은 1원 이상이어야 합니다.")
    .max(999999999, "가격은 999,999,999원 이하여야 합니다."),
  unit: z.string().min(1, "단위를 선택해주세요."),
  stock: z
    .number()
    .min(0, "재고는 0 이상이어야 합니다.")
    .max(999999, "재고는 999,999 이하여야 합니다."),
  image_url: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;

// 단위 옵션
const UNIT_OPTIONS = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
  { value: "개", label: "개" },
  { value: "박스", label: "박스" },
  { value: "팩", label: "팩" },
  { value: "봉", label: "봉" },
  { value: "포기", label: "포기" },
  { value: "단", label: "단" },
  { value: "마리", label: "마리" },
  { value: "근", label: "근" },
];

interface ProductFormProps {
  onSubmit: (data: ProductFormData) => Promise<void>;
  defaultValues?: Partial<ProductFormData>;
  isSubmitting?: boolean;
}

const STORAGE_BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET || "uploads";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function ProductForm({
  onSubmit,
  defaultValues,
  isSubmitting = false,
}: ProductFormProps) {
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    defaultValues?.image_url || null,
  );
  const [uploadingImage, setUploadingImage] = useState(false);
  const [standardizedName, setStandardizedName] = useState<string | null>(null);
  const [previewingStandardization, setPreviewingStandardization] =
    useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      original_name: defaultValues?.original_name || "",
      price: defaultValues?.price || 0,
      unit: defaultValues?.unit || "",
      stock: defaultValues?.stock || 0,
      image_url: defaultValues?.image_url || "",
      region: defaultValues?.region || "",
      city: defaultValues?.city || "",
    },
  });

  const originalName = watch("original_name");
  const unit = watch("unit");
  const region = watch("region");
  const city = watch("city");

  // 시/도 선택 시 시/군/구 목록 업데이트
  React.useEffect(() => {
    if (region) {
      const cities = getCitiesByRegion(region);
      setAvailableCities(cities);
      // 시/도가 변경되면 시/군/구 초기화
      if (city && !cities.includes(city)) {
        setValue("city", "");
      }
    } else {
      setAvailableCities([]);
    }
  }, [region, city, setValue]);

  // AI 표준화 미리보기
  const handlePreviewStandardization = async () => {
    if (!originalName || originalName.trim().length === 0) {
      toast.error("상품명을 입력해주세요.");
      return;
    }

    try {
      setPreviewingStandardization(true);
      console.group("🤖 AI 표준화 미리보기 시작");
      console.log("원본 상품명:", originalName);

      const response = await fetch("/api/products/standardize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          original_name: originalName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ AI 표준화 실패:", result);
        throw new Error(result.error || "AI 표준화에 실패했습니다.");
      }

      console.log("✅ AI 표준화 성공:", result);
      setStandardizedName(result.standard_name);
      console.groupEnd();

      toast.success("AI 표준화가 완료되었습니다.");
    } catch (error) {
      console.error("❌ AI 표준화 미리보기 에러:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "AI 표준화 미리보기에 실패했습니다.",
      );
      setStandardizedName(null);
    } finally {
      setPreviewingStandardization(false);
    }
  };

  // 이미지 파일 선택
  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!user) {
      toast.error("로그인이 필요합니다.");
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 타입 확인
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다.");
      return;
    }

    // 파일 크기 확인
    if (file.size > MAX_FILE_SIZE) {
      toast.error("이미지 크기는 5MB 이하여야 합니다.");
      return;
    }

    try {
      setUploadingImage(true);
      console.group("📤 이미지 업로드 시작");
      console.log("파일명:", file.name);
      console.log("파일 크기:", (file.size / 1024 / 1024).toFixed(2), "MB");

      // 이미지 미리보기
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // 파일명 생성 (타임스탬프 + 랜덤 문자열)
      const fileExt = file.name.split(".").pop();
      const fileName = `product-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      console.log("업로드 경로:", filePath);

      // Supabase Storage에 업로드
      const { data, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("❌ 업로드 실패:", uploadError);
        throw uploadError;
      }

      console.log("✅ 업로드 성공:", data.path);

      // 업로드된 파일의 공개 URL 가져오기
      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

      console.log("📎 공개 URL:", publicUrl);

      // 폼에 이미지 URL 설정
      setValue("image_url", publicUrl);
      console.groupEnd();

      toast.success("이미지가 업로드되었습니다.");
    } catch (error) {
      console.error("❌ 이미지 업로드 에러:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "이미지 업로드에 실패했습니다.",
      );
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 이미지 삭제
  const handleImageRemove = () => {
    setImagePreview(null);
    setValue("image_url", "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 폼 제출
  const onSubmitForm = async (data: ProductFormData) => {
    console.group("📦 상품 등록 폼 제출");
    console.log("상품명:", data.original_name);
    console.log("가격:", data.price, "원");
    console.log("단위:", data.unit);
    console.log("재고:", data.stock);
    console.log("지역 - 시/도:", data.region || "없음");
    console.log("지역 - 시/군/구:", data.city || "없음");
    console.log("이미지 URL:", data.image_url || "없음");
    console.groupEnd();

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {/* 상품명 입력 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="original_name">
            상품명 <span className="text-red-500">*</span>
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePreviewStandardization}
            disabled={previewingStandardization || !originalName?.trim()}
            className="flex items-center gap-2"
          >
            {previewingStandardization ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                표준화 중...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                AI 표준화 미리보기
              </>
            )}
          </Button>
        </div>
        <Input
          id="original_name"
          {...register("original_name")}
          placeholder="예: 청양고추 1키로"
          className={errors.original_name ? "border-red-500" : ""}
        />
        {errors.original_name && (
          <p className="text-sm text-red-500">{errors.original_name.message}</p>
        )}
        {/* AI 표준화 결과 표시 */}
        {standardizedName && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-blue-900">
                AI 표준화 결과
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStandardizedName(null)}
                className="h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-sm text-blue-800">{standardizedName}</p>
          </div>
        )}
      </div>

      {/* 가격 입력 */}
      <div className="space-y-2">
        <Label htmlFor="price">
          가격 (원) <span className="text-red-500">*</span>
        </Label>
        <Input
          id="price"
          type="number"
          {...register("price", { valueAsNumber: true })}
          placeholder="예: 8500"
          min="1"
          className={errors.price ? "border-red-500" : ""}
        />
        {errors.price && (
          <p className="text-sm text-red-500">{errors.price.message}</p>
        )}
      </div>

      {/* 단위 선택 */}
      <div className="space-y-2">
        <Label htmlFor="unit">
          단위 <span className="text-red-500">*</span>
        </Label>
        <Select value={unit} onValueChange={(value) => setValue("unit", value)}>
          <SelectTrigger
            id="unit"
            className={errors.unit ? "border-red-500" : ""}
          >
            <SelectValue placeholder="단위를 선택해주세요" />
          </SelectTrigger>
          <SelectContent>
            {UNIT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.unit && (
          <p className="text-sm text-red-500">{errors.unit.message}</p>
        )}
      </div>

      {/* 재고 입력 */}
      <div className="space-y-2">
        <Label htmlFor="stock">
          재고 <span className="text-red-500">*</span>
        </Label>
        <Input
          id="stock"
          type="number"
          {...register("stock", { valueAsNumber: true })}
          placeholder="예: 100"
          min="0"
          className={errors.stock ? "border-red-500" : ""}
        />
        {errors.stock && (
          <p className="text-sm text-red-500">{errors.stock.message}</p>
        )}
      </div>

      {/* 지역 선택 - 시/도 */}
      <div className="space-y-2">
        <Label htmlFor="region">
          시/도 <span className="text-gray-500">(선택 사항)</span>
        </Label>
        <Select
          value={region || undefined}
          onValueChange={(value) => {
            setValue("region", value || "");
            setValue("city", ""); // 시/도 변경 시 시/군/구 초기화
          }}
        >
          <SelectTrigger
            id="region"
            className={errors.region ? "border-red-500" : ""}
          >
            <SelectValue placeholder="시/도를 선택해주세요" />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.region && (
          <p className="text-sm text-red-500">{errors.region.message}</p>
        )}
      </div>

      {/* 지역 선택 - 시/군/구 */}
      {region && availableCities.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="city">
            시/군/구 <span className="text-gray-500">(선택 사항)</span>
          </Label>
          <Select
            value={city || undefined}
            onValueChange={(value) => setValue("city", value || "")}
          >
            <SelectTrigger
              id="city"
              className={errors.city ? "border-red-500" : ""}
            >
              <SelectValue placeholder="시/군/구를 선택해주세요" />
            </SelectTrigger>
            <SelectContent>
              {availableCities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.city && (
            <p className="text-sm text-red-500">{errors.city.message}</p>
          )}
        </div>
      )}

      {/* 이미지 업로드 */}
      <div className="space-y-2">
        <Label htmlFor="image">
          상품 이미지 <span className="text-gray-500">(선택 사항)</span>
        </Label>
        <div className="space-y-4">
          {/* 이미지 미리보기 */}
          {imagePreview && (
            <div className="relative w-full max-w-md h-48">
              <Image
                src={imagePreview}
                alt="상품 미리보기"
                fill
                className="object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleImageRemove}
                disabled={uploadingImage}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* 이미지 업로드 버튼 */}
          {!imagePreview && (
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="image"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">클릭하여 이미지 선택</span>
                    {" 또는 드래그 앤 드롭"}
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF (최대 5MB)
                  </p>
                </div>
                <input
                  id="image"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* 업로드 중 표시 */}
          {uploadingImage && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Upload className="w-4 h-4 animate-pulse" />
              <span>이미지 업로드 중...</span>
            </div>
          )}
        </div>
      </div>

      {/* 제출 버튼 */}
      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || uploadingImage}
          className="flex-1"
        >
          {isSubmitting ? "등록 중..." : "상품 등록"}
        </Button>
      </div>
    </form>
  );
}
