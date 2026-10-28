export interface Seller {
  name: string;
  url: string;
  platform?: "yupoo" | "weidian" | "taobao" | "other";
}

export interface Brand {
  name: string;
  sellers: Seller[];
}
