export type Protocol = 'TCP' | 'UDP' | 'ICMP' | 'HTTP' | 'DNS';
export type Classification = 'Normal' | 'Attack' | 'Inspecting...';
export type AttackType = 'SYN Flood' | 'UDP Flood' | 'ICMP Flood' | 'HTTP GET Flood' | 'DNS Amplification' | 'None';

export interface Packet {
  id: string;
  timestamp: string;
  sourceIp: string;
  requestRate: number; // req/s
  payloadSize: number; // KB
  protocol: Protocol;
  classification: Classification;
  confidence: number;
  isBlocked: boolean;
}

export interface Stats {
  serverLoad: number;
  totalRequests: number;
  attacksDetected: number;
  ipsBlocked: number;
}

export interface ChartData {
  time: string;
  normal: number;
  attack: number;
  blocked: number;
}
