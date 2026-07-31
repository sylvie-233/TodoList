export interface SubTask {
  id: string;
  taskId: string;
  text: string;
  isCompleted: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubTaskDto {
  taskId: string;
  text: string;
}

export interface UpdateSubTaskDto {
  text?: string;
  isCompleted?: boolean;
}

export interface ReorderSubTasksDto {
  items: { id: string; sortOrder: number }[];
}
