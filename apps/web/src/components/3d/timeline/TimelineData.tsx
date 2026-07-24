'use client';

import { useMemo } from 'react';
import useSWR from 'swr';
import * as THREE from 'three';

/* ─── Types ─── */
export interface FeaturedProject {
  id: string;
  slug: string;
  title: string;
  client?: string;
  location?: string;
  date?: string;
  description_vi?: string;
  description_en?: string;
  images?: { url: string; caption?: string }[];
  company_logo_url?: string;
  featured_year: number;
  featured_month?: number;
  featured_order: number;
  scope_vi?: string;
  scope_en?: string;
}

/** 3D position + data for one project node on the timeline curve */
export interface ProjectNode3D {
  project: FeaturedProject;
  position: THREE.Vector3;
  year: number;
}

/* ─── 2D timeline types ─── */
export interface ProjectNode2D {
  project: FeaturedProject;
  x: number;
  y: number;
  cardX: number;
  cardY: number;
  side: 'top' | 'bottom';
}

export interface YearMarker2D {
  year: number;
  x: number;         // center X of year badge (above path)
  y: number;         // Y of year badge center
  curveAnchorX: number;  // point on the curve this year connects to
  curveAnchorY: number;
}

export interface Timeline2DPath {
  nodes: ProjectNode2D[];
  pathD: string;
  totalWidth: number;
  totalHeight: number;
  years: YearMarker2D[];
}

/* ─── Mock data for dev (no Docker / Supabase needed) ─── */
const MOCK_FEATURED: FeaturedProject[] = [
  {
    id: 'mock-1', slug: 'scada-nha-may-xyz',
    title: 'Hệ thống SCADA Nhà máy XYZ',
    client: 'Công ty TNHH XYZ', location: 'Bình Dương',
    date: '2026-06-15',
    description_vi: 'Thiết kế, lắp đặt hệ thống SCADA cho 3 dây chuyền sản xuất với hơn 200 điểm giám sát.',
    description_en: 'Design and installation of SCADA system for 3 production lines with over 200 monitoring points.',
    featured_year: 2026, featured_month: 6, featured_order: 1,
    scope_vi: 'Thiết kế, lắp đặt hệ thống SCADA cho 3 dây chuyền sản xuất',
    scope_en: 'SCADA system design & installation for 3 production lines',
  },
  {
    id: 'mock-2', slug: 'tu-dien-mcc',
    title: 'Tủ điện MCC Nhà máy Chế biến',
    client: 'Nhà máy Chế biến ABC', location: 'Đồng Nai',
    date: '2026-03-20',
    description_vi: 'Chế tạo và lắp đặt 15 tủ MCC cho nhà máy chế biến thực phẩm, tích hợp biến tần và PLC.',
    description_en: 'Fabrication and installation of 15 MCC cabinets with VFD and PLC integration.',
    featured_year: 2026, featured_month: 3, featured_order: 2,
    scope_vi: 'Chế tạo 15 tủ MCC, tích hợp biến tần và PLC',
    scope_en: '15 MCC cabinets with VFD and PLC integration',
  },
  {
    id: 'mock-3', slug: 'tu-dien-trung-the',
    title: 'Trạm điện trung thế KCN Sen Hồ',
    client: 'Khu công nghiệp Sen Hồ', location: 'Bắc Ninh',
    date: '2025-12-10',
    description_vi: 'Cung cấp và lắp đặt trạm điện trung thế 22kV, tủ phân phối hạ thế cho toàn bộ khu công nghiệp.',
    description_en: '22kV substation and LV distribution for the whole industrial park.',
    featured_year: 2025, featured_month: 12, featured_order: 1,
    scope_vi: 'Trạm 22kV + tủ phân phối hạ thế',
    scope_en: '22kV substation + LV distribution cabinets',
  },
  {
    id: 'mock-4', slug: 'line-automation-robot',
    title: 'Tự động hoá dây chuyền lắp ráp linh kiện',
    client: 'Tập đoàn Sản xuất DEF', location: 'TP. Hồ Chí Minh',
    date: '2025-09-05',
    description_vi: 'Tích hợp robot ABB cho dây chuyền lắp ráp linh kiện điện tử, kết hợp vision AI.',
    description_en: 'ABB robot integration for electronics assembly line with AI vision.',
    featured_year: 2025, featured_month: 9, featured_order: 2,
    scope_vi: 'Robot ABB + Vision AI cho lắp ráp linh kiện',
    scope_en: 'ABB robots + Vision AI for component assembly',
  },
  {
    id: 'mock-5', slug: 'plc-scada-nha-may',
    title: 'Hệ thống PLC/SCADA Nhà máy Thuỷ sản',
    client: 'Công ty Thuỷ sản GHI', location: 'Cần Thơ',
    date: '2025-06-18',
    description_vi: 'Tích hợp hệ thống PLC Siemens và SCADA WinCC cho nhà máy chế biến thuỷ sản, 5 dây chuyền cấp đông.',
    description_en: 'Siemens PLC and SCADA WinCC integration for seafood processing with 5 freezing lines.',
    featured_year: 2025, featured_month: 6, featured_order: 3,
    scope_vi: 'PLC Siemens + SCADA WinCC cho 5 dây chuyền cấp đông',
    scope_en: 'Siemens PLC + SCADA WinCC for 5 freezing lines',
  },
  {
    id: 'mock-6', slug: 'bao-tri-nha-may',
    title: 'Bảo trì hệ thống điện Nhà máy Sữa',
    client: 'Công ty Sữa JKL', location: 'Hà Nội',
    date: '2025-03-01',
    description_vi: 'Dịch vụ bảo trì dự phòng toàn bộ hệ thống điện và tự động hoá, cam kết phản hồi dưới 4 giờ.',
    description_en: 'Preventive maintenance for electrical and automation system, <4hr response.',
    featured_year: 2025, featured_month: 3, featured_order: 1,
    scope_vi: 'Bảo trì điện + tự động hoá, phản hồi 4h',
    scope_en: 'Electrical & automation maintenance, 4hr response',
  },
];

/* ─── Fetch hook ─── */
export function useTimelineProjects() {
  const { data, error, isLoading } = useSWR<FeaturedProject[]>(
    '/api/projects?featured=true',
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch featured projects');
      return res.json();
    },
    { revalidateOnFocus: false, revalidateOnReconnect: false },
  );

  /*
   * Use real data from Supabase when available.
   * Falls back to mock data when API is unavailable or returns empty.
   */
  const useMock = !data || data.length === 0 || !!error || isLoading;
  const projects = useMock ? MOCK_FEATURED : data;

  return { projects, error, isLoading };
}

/* ─── Build 3D curve from project data ─── */
export function buildTimelineCurve(
  projects: FeaturedProject[],
): { curve: THREE.CatmullRomCurve3; nodes: ProjectNode3D[] } {
  if (!projects.length) {
    return { curve: new THREE.CatmullRomCurve3([]), nodes: [] };
  }

  /* Tự động sort theo thời gian: năm giảm dần → tháng giảm dần */
  const sorted = [...projects].sort((a, b) => {
    if (b.featured_year !== a.featured_year) return b.featured_year - a.featured_year;
    const ma = a.featured_month ?? 1;
    const mb = b.featured_month ?? 1;
    return mb - ma;
  });

  const total = sorted.length;
  const nodes: ProjectNode3D[] = [];
  const points: THREE.Vector3[] = [];

  const SPREAD_X = 8;  // total width of curve
  const SPREAD_Z = 6;  // depth oscillation
  const SPREAD_Y = 3;  // vertical oscillation
  const START_Y = -1.5;

  sorted.forEach((project, i) => {
    const t = total > 1 ? i / (total - 1) : 0;
    const angle = t * Math.PI * 2;

    /* S-curve in X-Z plane + gentle Y oscillation */
    // 1.3 multiplier avoids sin(π)=0 with 4 evenly-spaced nodes
    const x = (t - 0.5) * SPREAD_X;
    const z = Math.sin(angle * 1.3) * SPREAD_Z;
    const y = START_Y + Math.sin(angle * 1.2) * SPREAD_Y + t * 1.5;

    const pos = new THREE.Vector3(x, y, z);
    points.push(pos);
    nodes.push({ project, position: pos, year: project.featured_year });
  });

  const curve = new THREE.CatmullRomCurve3(points);

  return { curve, nodes };
}

/* ─── Build 2D timeline path (SVG) — HORIZONTAL S-CURVE ─── */
export function build2DTimelinePath(
  projects: FeaturedProject[],
  containerHeight = 850,
): Timeline2DPath {
  if (!projects.length) {
    return { nodes: [], pathD: '', totalWidth: 1200, totalHeight: containerHeight, years: [] };
  }

  const sorted = [...projects].sort((a, b) => {
    if (b.featured_year !== a.featured_year) return b.featured_year - a.featured_year;
    const ma = a.featured_month ?? 1;
    const mb = b.featured_month ?? 1;
    return mb - ma;
  });

  const total = sorted.length;
  const PADDING_LEFT = 250;
  const PADDING_RIGHT = 400;
  const TOP_MARGIN = 350;           // room above for year badges (tăng mạnh)
  const BOTTOM_MARGIN = 100;
  const CURVE_AMPLITUDE = 140;      // vertical swing from center
  const CENTER_Y = TOP_MARGIN + (containerHeight - TOP_MARGIN - BOTTOM_MARGIN) / 2;
  const CARD_WIDTH = 280;
  const CARD_HEIGHT = 130;
  const CARD_GAP = 180;

  // Compute totalWidth
  const NODE_SPACING = 580;
  const totalWidth = Math.max(
    PADDING_LEFT + (total - 1) * NODE_SPACING + PADDING_RIGHT,
    1400,
  );
  const STEP_X = (totalWidth - PADDING_LEFT - PADDING_RIGHT) / Math.max(total - 1, 1);

  const nodes: ProjectNode2D[] = [];
  const pts: { x: number; y: number }[] = [];

  // Build year markers — placed ABOVE the path at the top
  const YEARS_TOP_Y = 70; // year badge center Y
  const YEAR_BADGE_BOTTOM = YEARS_TOP_Y + 27 + 60; // badge edge + safe padding 60px

  sorted.forEach((project, i) => {
    const t = total > 1 ? i / (total - 1) : 0;
    const angle = t * Math.PI * 2;

    // Horizontal S-curve: X goes rightward, Y oscillates up-down
    const x = PADDING_LEFT + i * STEP_X;
    const y = CENTER_Y + Math.sin(angle * 1.4) * CURVE_AMPLITUDE;

    pts.push({ x, y });

    // Strict alternating: even index = top, odd index = bottom
    const side: 'top' | 'bottom' = i % 2 === 0 ? 'top' : 'bottom';

    // Card X centered on node, offset vertically
    const cardX = x - CARD_WIDTH / 2;
    let cardY = side === 'top' ? y - CARD_HEIGHT - CARD_GAP : y + CARD_GAP;

    // Clamp: top cards must not overlap year badges
    if (side === 'top' && cardY < YEAR_BADGE_BOTTOM) {
      cardY = YEAR_BADGE_BOTTOM;
    }

    nodes.push({ project, x, y, cardX, cardY, side });
  });

  // Build SVG path D — smooth cubic bezier with control points at X-midpoints
  let pathD = '';
  pts.forEach((p, i) => {
    if (i === 0) {
      pathD = `M ${p.x} ${p.y}`;
    } else {
      const prev = pts[i - 1];
      const cpX = (prev.x + p.x) / 2; // midpoint X for vertical tangents
      pathD += ` C ${cpX} ${prev.y}, ${cpX} ${p.y}, ${p.x} ${p.y}`;
    }
  });

  const years: YearMarker2D[] = [];
  let yearStartIdx = 0;
  for (let i = 1; i <= sorted.length; i++) {
    const isLast = i === sorted.length;
    if (isLast || sorted[i].featured_year !== sorted[yearStartIdx].featured_year) {
      const endIdx = Math.min(i - 1, nodes.length - 1);
      const midIdx = yearStartIdx + Math.floor((endIdx - yearStartIdx) / 2);
      const midNodeX = nodes[midIdx].x;

      // Curve anchor at the midpoint Y on curve
      const curveAnchorX = midNodeX;
      const curveAnchorY = CENTER_Y + Math.sin(((midIdx / Math.max(total - 1, 1)) * Math.PI * 2) * 1.4) * CURVE_AMPLITUDE;

      years.push({
        year: sorted[yearStartIdx].featured_year,
        x: midNodeX,
        y: YEARS_TOP_Y,
        curveAnchorX,
        curveAnchorY,
      });
      yearStartIdx = i;
    }
  }

  return {
    nodes,
    pathD,
    totalWidth,
    totalHeight: containerHeight,
    years,
  };
}
