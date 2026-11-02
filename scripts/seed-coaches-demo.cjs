const { loadEnvConfig } = require("@next/env");
const { PrismaClient } = require("@prisma/client");

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const DEMO_COACH_USER_ID = "smashbook-demo-2000-coach-user";
const DEMO_COACH_ID = "smashbook-demo-2000-coach";

const SAMPLE_COACHES = [
  {
    userId: DEMO_COACH_USER_ID,
    coachId: DEMO_COACH_ID,
    name: "HLV Demo SmashBook — 2.000đ/giờ",
    phone: "0900000000",
    email: "demo.coach.2000@smashbook.test",
    hourlyRate: 2000,
    experienceYears: 4,
    specialties: ["Kỹ thuật cơ bản", "Nâng cao & Chiến thuật", "Đơn nam / Đơn nữ"],
    bio: "(Hồ sơ mẫu thử nghiệm) Huấn luyện viên mẫu SmashBook phục vụ kiểm thử hệ thống. Mức phí 2.000đ/giờ dành riêng cho kiểm tra luồng chọn HLV và thanh toán.",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  },
  {
    userId: "smashbook-demo-coach-user-1",
    coachId: "smashbook-demo-coach-1",
    name: "HLV Mẫu Nguyễn Văn Tuấn",
    phone: "0900000001",
    email: "coach.tuan.demo@smashbook.test",
    hourlyRate: 150000,
    experienceYears: 5,
    specialties: ["Kỹ thuật cơ bản", "Đào tạo thiếu nhi & thanh thiếu niên"],
    bio: "(Hồ sơ mẫu thử nghiệm) Chuyên hướng dẫn kỹ thuật cơ bản cho người mới bắt đầu và các lớp năng khiếu thiếu nhi phong trào.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  },
  {
    userId: "smashbook-demo-coach-user-2",
    coachId: "smashbook-demo-coach-2",
    name: "HLV Mẫu Trần Thị Mai",
    phone: "0900000002",
    email: "coach.mai.demo@smashbook.test",
    hourlyRate: 250000,
    experienceYears: 8,
    specialties: ["Nâng cao & Chiến thuật", "Đơn nam / Đơn nữ"],
    bio: "(Hồ sơ mẫu thử nghiệm) Cựu VĐV chuyên sâu kỹ chiến thuật đơn, rèn luyện bộ pháp và tư duy chiến thuật thi đấu.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
  },
  {
    userId: "smashbook-demo-coach-user-3",
    coachId: "smashbook-demo-coach-3",
    name: "HLV Mẫu Lê Hoàng Long",
    phone: "0900000003",
    email: "coach.long.demo@smashbook.test",
    hourlyRate: 200000,
    experienceYears: 6,
    specialties: ["Đôi nam / Đôi nữ", "Đôi nam nữ phối hợp"],
    bio: "(Hồ sơ mẫu thử nghiệm) Chuyên chiến thuật đánh đôi, phản tạt nhanh, di chuyển bọc lót và phối hợp nhịp nhàng trên sân.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
  },
  {
    userId: "smashbook-demo-coach-user-4",
    coachId: "smashbook-demo-coach-4",
    name: "HLV Mẫu Phạm Quốc Hùng",
    phone: "0900000004",
    email: "coach.hung.demo@smashbook.test",
    hourlyRate: 180000,
    experienceYears: 7,
    specialties: ["Rèn luyện thể lực", "Nâng cao & Chiến thuật"],
    bio: "(Hồ sơ mẫu thử nghiệm) Chuyên gia thể lực chuyên biệt cầu lông, nâng cao sức bền, tốc độ phát lực và phòng tránh chấn thương.",
    image: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80",
  },
];

async function main() {
  console.log("=== BẮT ĐẦU SEED HUẤN LUYỆN VIÊN DEMO & MẪU SMASHBOOK ===");

  // 1. Tìm hoặc đảm bảo có cơ sở sân để gán
  let venue = await prisma.venue.findFirst({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, slug: true },
  });

  if (!venue) {
    venue = await prisma.venue.findFirst({
      select: { id: true, name: true, slug: true },
    });
  }

  if (!venue) {
    console.log("Không tìm thấy cơ sở sân nào trong DB. Vui lòng tạo cơ sở trước khi gán HLV.");
    return;
  }

  console.log(`Cơ sở sân sử dụng gán HLV: ${venue.name} (ID: ${venue.id})`);

  // 2. Upsert từng huấn luyện viên mẫu
  for (const item of SAMPLE_COACHES) {
    console.log(`Đang xử lý HLV: ${item.name} (${item.hourlyRate.toLocaleString("vi-VN")}đ/giờ)...`);

    // Upsert User
    const user = await prisma.user.upsert({
      where: { id: item.userId },
      create: {
        id: item.userId,
        name: item.name,
        phone: item.phone,
        email: item.email,
        role: "CUSTOMER",
        status: "ACTIVE",
        image: item.image,
      },
      update: {
        name: item.name,
        image: item.image,
        status: "ACTIVE",
      },
    });

    // Upsert CoachProfile
    const profile = await prisma.coachProfile.upsert({
      where: { id: item.coachId },
      create: {
        id: item.coachId,
        userId: user.id,
        bio: item.bio,
        specialties: item.specialties,
        experienceYears: item.experienceYears,
        hourlyRate: item.hourlyRate,
        status: "ACTIVE",
        reviewedAt: new Date(),
        reviewedById: "system-seed",
      },
      update: {
        bio: item.bio,
        specialties: item.specialties,
        experienceYears: item.experienceYears,
        hourlyRate: item.hourlyRate,
        status: "ACTIVE",
      },
    });

    // Gắn với Venue (CoachVenue)
    await prisma.coachVenue.upsert({
      where: {
        coachId_venueId: {
          coachId: profile.id,
          venueId: venue.id,
        },
      },
      create: {
        coachId: profile.id,
        venueId: venue.id,
        status: "ACTIVE",
        reviewedAt: new Date(),
        reviewedById: "system-seed",
      },
      update: {
        status: "ACTIVE",
      },
    });

    // Tạo lịch sẵn sàng (CoachAvailability) cho 14 ngày tới
    const now = new Date();
    // Xóa availability cũ của HLV này tại cơ sở này để không trùng lặp
    await prisma.coachAvailability.deleteMany({
      where: {
        coachId: profile.id,
        venueId: venue.id,
      },
    });

    const availabilitiesData = [];
    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
      const dateStr = targetDate.toISOString().slice(0, 10);

      // Ca sáng: 08:00 - 11:30
      const startMorning = new Date(`${dateStr}T08:00:00+07:00`);
      const endMorning = new Date(`${dateStr}T11:30:00+07:00`);

      // Ca chiều tối: 14:00 - 21:00
      const startEvening = new Date(`${dateStr}T14:00:00+07:00`);
      const endEvening = new Date(`${dateStr}T21:00:00+07:00`);

      availabilitiesData.push({
        coachId: profile.id,
        venueId: venue.id,
        startsAt: startMorning,
        endsAt: endMorning,
      });

      availabilitiesData.push({
        coachId: profile.id,
        venueId: venue.id,
        startsAt: startEvening,
        endsAt: endEvening,
      });
    }

    await prisma.coachAvailability.createMany({
      data: availabilitiesData,
    });

    console.log(`  -> Đã cập nhật hồ sơ & ${availabilitiesData.length} khung giờ sẵn sàng cho ${item.name}`);
  }

  console.log("=== HOÀN TẤT SEED HUẤN LUYỆN VIÊN DEMO & MẪU THÀNH CÔNG ===");
}

main()
  .catch((err) => {
    console.error("LỖI SEED COACH:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
