export interface Branding<BrandT> {
  _type: BrandT;
}
export type Brand<T, BrandT> = T & Branding<BrandT>;