// Core OST Node Types
export type NodeType = 'outcome' | 'opportunity' | 'solution' | 'experiment';

export interface TreeNode {
  id: string;
  treeId: string;
  type: NodeType;
  title: string;
  description?: string | null;
  parentId?: string | null;
  position?: { x: number; y: number };
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string;
}

export interface Outcome extends TreeNode {
  type: 'outcome';
}

export interface Opportunity extends TreeNode {
  type: 'opportunity';
  evidenceCount?: number;
  voteCount?: number;
  confidenceLevel?: number;
  startDate?: string | null;
  endDate?: string | null;
}

export interface Solution extends TreeNode {
  type: 'solution';
  voteCount?: number;
  iceScore?: {
    impact: number;
    confidence: number;
    ease: number;
  };
  startDate?: string | null;
  endDate?: string | null;
}

export interface Experiment extends TreeNode {
  type: 'experiment';
  status: 'planned' | 'running' | 'completed' | 'failed';
  startDate?: string;
  endDate?: string;
  successMetrics?: {
    target: number;
    actual?: number;
    unit: string;
  };
  learnings?: string;
  externalLink?: string;
}

// Tree Structure
export interface Tree {
  id: string;
  name: string;
  description?: string | null;
  teamId?: string | null;
  isPublic: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string;
}

// Collaboration
export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
}

export interface Comment {
  id: string;
  nodeId: string;
  nodeType: NodeType;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Evidence {
  id: string;
  nodeId: string;
  nodeType: NodeType;
  title: string;
  content: string;
  sourceType: 'interview' | 'survey' | 'analytics' | 'feedback' | 'other';
  externalLink?: string;
  userId: string;
  createdAt: string;
}

export interface Vote {
  id: string;
  nodeId: string;
  nodeType: NodeType;
  userId: string;
  value: number; // 1-5 scale
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  treeId: string;
  nodeId?: string;
  action: string;
  userId: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface TreeMember {
  id: string;
  treeId: string;
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  createdAt: string;
}

// React Flow types
export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: TreeNode;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

