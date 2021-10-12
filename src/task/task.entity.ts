import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from "typeorm";
import { User } from "../auth/user.entity";

export const TASK_STATUSES = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  ARCHIVED: "ARCHIVED",
} as const;

export type TaskStatus = typeof TASK_STATUSES[keyof typeof TASK_STATUSES];

@Entity()
export class Task extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  lastUpdatedAt: Date;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({
    type: "enum",
    enum: Object.values(TASK_STATUSES),
  })
  status: TaskStatus;

  @ManyToOne(() => User, (user) => user.tasks)
  user: User;
}
