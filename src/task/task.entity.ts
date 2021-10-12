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

export enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  ARCHIVED = "ARCHIVED",
}

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
    enum: TaskStatus,
  })
  status: TaskStatus;

  @ManyToOne(() => User, (user) => user.tasks)
  user: User;
}
