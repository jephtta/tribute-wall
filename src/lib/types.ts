export type WallTone = "celebration" | "memorial";
export type TributePermission = "open" | "approval";
export type TributeStatus = "published" | "pending" | "rejected" | "hidden";

export interface Wall {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string;
  tone: WallTone;
  tributePermission: TributePermission;
  creatorId: string;
  locked: boolean;
  pinnedTributeIds: string[];
  galleryItems: GalleryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  type: "image" | "video";
  alt: string;
  order: number;
}

export interface Tribute {
  id: string;
  wallId: string;
  displayName: string;
  message: string;
  mediaUrls: TributeMedia[];
  likes: number;
  reportCount: number;
  status: TributeStatus;
  createdAt: string;
}

export interface TributeMedia {
  url: string;
  type: "image" | "video";
}

export interface Report {
  id: string;
  tributeId: string;
  wallId: string;
  category: "spam" | "offensive" | "impersonation" | "other";
  createdAt: string;
}
