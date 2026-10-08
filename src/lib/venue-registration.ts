import { z } from "zod";

export const venueRegistrationSchema = z
  .object({
    name: z.string().trim().min(5).max(150),
    address: z.string().trim().min(10).max(300),
    district: z.string().trim().min(2).max(100),
    province: z.string().trim().min(2).max(100),
    phone: z.string().regex(/^0\d{9,10}$/, "Số điện thoại không hợp lệ."),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    courts: z.number().int().min(1).max(30),
    hourlyPrice: z.number().int().min(1000).max(5000000),
    openMin: z.number().int().min(0).max(1380).multipleOf(30),
    closeMin: z.number().int().min(60).max(1440).multipleOf(30),
  })
  .strict()
  .refine(
    (v) => v.closeMin - v.openMin >= 60,
    "Giờ đóng cửa phải sau giờ mở cửa ít nhất 60 phút.",
  );
