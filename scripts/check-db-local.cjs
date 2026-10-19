const { loadEnvConfig } = require("@next/env");
const { PrismaClient } = require("@prisma/client");

loadEnvConfig(process.cwd());

async function main() {
    const variable = process.argv.includes("--direct")
        ? "DIRECT_URL"
        : "DATABASE_URL";

    const value = process.env[variable];

    if (!value) {
        throw new Error(`Thiếu biến ${variable}`);
    }

    const url = new URL(value);

    if (
        url.hostname.endsWith(".pooler.supabase.com") &&
        url.port === "6543"
    ) {
        url.searchParams.set("pgbouncer", "true");
    }

    url.searchParams.set("connect_timeout", "10");

    console.log(`Đang kiểm tra ${variable}`);
    console.log(`Máy chủ: ${url.hostname}:${url.port || "5432"}`);

    const prisma = new PrismaClient({
        datasources: {
            db: { url: url.toString() },
        },
    });

    try {
        const result = await prisma.$queryRawUnsafe("SELECT 1 AS ok");
        console.log("KẾT NỐI DB THÀNH CÔNG:", result);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((error) => {
    const message = String(error.message).replace(
        /postgres(?:ql)?:\/\/[^\s"'`]+/gi,
        "[ĐÃ ẨN CHUỖI KẾT NỐI]",
    );

    console.error("KIỂM TRA THẤT BẠI:", error.code || error.name);
    console.error(message);
    process.exitCode = 1;
});