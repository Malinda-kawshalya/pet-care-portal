export type EventApprovalStatus = "pending_approval" | "approved" | "rejected";

export type EventItem = {
  id: string;
  title: string;
  description: string;
  location: string;
  eventType: "meetup" | "workshop" | "adoption_drive" | "awareness" | "other";
  startsAt: string;
  endsAt: string | null;
  approvalStatus: EventApprovalStatus;
  approvedBy: {
    id: string;
    fullName: string;
    role: string;
  } | null;
  approvedAt: string | null;
  createdBy: {
    id: string;
    fullName: string;
    role: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type EventListPayload = {
  events: EventItem[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
};
