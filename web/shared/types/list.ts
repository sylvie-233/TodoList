export interface List {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  isBuiltin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListDto {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateListDto {
  name?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
}

export interface ReorderListsDto {
  items: { id: string; sortOrder: number }[];
}

export interface ListStats {
  total: number;
  completed: number;
  active: number;
  completionRate: number;
}
