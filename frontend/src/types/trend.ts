import * as d3 from 'd3';

export interface ChartDataPoint {
  label: string;
  mentions: number;
}

export interface TimelineData {
  daily: ChartDataPoint[];
  monthly: ChartDataPoint[];
  yearly: ChartDataPoint[];
}

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  group: number;
  value: number;
  desc: string;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

export interface TabData {
  nodes: GraphNode[];
  links: GraphLink[];
  timeline: TimelineData;
}

export interface CategoryDetail {
  name: string;
  color: string;
  company: TabData;
  community: TabData;
}

// CategoryInfoMap 타입 정의
export type CategoryInfoMap = {
  [key: string]: CategoryDetail;
};

// ✅ [수정] 백엔드 데이터 구조 반영 (description, created_at 추가)
export interface TechStackData {
  id: number;
  name: string;
  logo: string | null;
  docs_url: string | null;
  description?: string; // 설명 (검색용)
  created_at?: string;  // 생성일
}

export interface TechStackUI extends TechStackData {
  catName?: string;
  count?: number;
  growth?: number;
  color?: string;
  themeColor?: string;
  officialSite?: string;
}