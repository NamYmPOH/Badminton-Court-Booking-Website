import type { PrismaClient } from "@prisma/client";
import { db } from "../lib/db";
import { cachedPublicData, recordPublicCacheDbQueries } from "../lib/public-cache";
import { COACH_SPECIALTY_ALIASES, isDemoCoach, normalizeCoachSpecialty } from "../lib/coach-policy";
import type { CoachFilterParams, PublicCoachListItem } from "./coach.service";

async function loadCatalog(database: PrismaClient) {
  recordPublicCacheDbQueries(1);
  const rows = await database.coachProfile.findMany({
    where: { status: "ACTIVE", user: { status: "ACTIVE" } },
    select: {
      id: true, userId: true, bio: true, specialties: true,
      experienceYears: true, hourlyRate: true, createdAt: true,
      user: { select: { name: true, image: true } },
      certificates: {
        where: { verifiedAt: { not: null } },
        select: { id: true, title: true, verifiedAt: true },
      },
      venues: {
        where: { status: "ACTIVE", venue: { status: "ACTIVE" } },
        select: { venue: { select: {
          id: true, name: true, slug: true, address: true, district: true,
          province: true, openMin: true, closeMin: true,
        } } },
      },
    },
    orderBy: [{ hourlyRate: "asc" }, { createdAt: "desc" }, { id: "asc" }],
  });
  return rows.map(coach => ({
    id: coach.id, userId: coach.userId, name: coach.user.name,
    image: coach.user.image, bio: coach.bio, specialties: coach.specialties,
    experienceYears: coach.experienceYears, hourlyRate: coach.hourlyRate,
    isDemo: isDemoCoach({ id: coach.id, userId: coach.userId, name: coach.user.name }),
    createdAt: coach.createdAt.toISOString(),
    certificates: coach.certificates.map(c => ({
      id: c.id, title: c.title, verifiedAt: c.verifiedAt?.toISOString() || null,
    })),
    venues: coach.venues.map(({ venue }) => ({
      id: venue.id, name: venue.name, slug: venue.slug, address: venue.address,
      district: venue.district, province: venue.province,
      openMin: venue.openMin, closeMin: venue.closeMin,
    })),
  }));
}

export function publicCoachCatalog(database: PrismaClient) {
  const loader = () => loadCatalog(database);
  // Injected clients may belong to a transaction or another DB. Never share their data.
  return database === db ? cachedPublicData("coaches", loader) : loader();
}

export async function listPublicCoachCatalog(database: PrismaClient, params: CoachFilterParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 12));
  const search = params.q?.trim();
  const rawSpec = params.specialty?.trim();
  const variants = new Set<string>();
  if (rawSpec) {
    const norm = normalizeCoachSpecialty(rawSpec);
    variants.add(rawSpec); variants.add(norm);
    for (const [alias, canonical] of Object.entries(COACH_SPECIALTY_ALIASES)) {
      if (canonical.toLowerCase() === norm.toLowerCase() || alias.toLowerCase() === rawSpec.toLowerCase()) {
        variants.add(alias); variants.add(canonical);
      }
    }
  }
  const contains = (value: string | null, query: string) =>
    (value || "").toLowerCase().includes(query.toLowerCase());
  const district = params.district;
  const matches = (await publicCoachCatalog(database)).filter(coach => {
    if (search && !contains(coach.name, search) && !contains(coach.bio, search) && !coach.specialties.includes(search)) return false;
    if (rawSpec && !coach.specialties.some(s => variants.has(s))) return false;
    if (params.minRate !== undefined && coach.hourlyRate < params.minRate) return false;
    if (params.maxRate !== undefined && coach.hourlyRate > params.maxRate) return false;
    if (params.venueId && !coach.venues.some(v => v.id === params.venueId)) return false;
    if (!params.venueId && district && !coach.venues.some(v => contains(v.district, district))) return false;
    return true;
  });
  const coaches: PublicCoachListItem[] = matches.slice((page - 1) * limit, page * limit).map(coach => ({
    id: coach.id, userId: coach.userId, name: coach.name, image: coach.image,
    bio: coach.bio, specialties: coach.specialties, experienceYears: coach.experienceYears,
    hourlyRate: coach.hourlyRate, isDemo: coach.isDemo,
    venues: coach.venues.map(v => ({
      id: v.id, name: v.name, address: v.address, district: v.district, province: v.province,
    })),
  }));
  return { coaches, total: matches.length, page, limit };
}
