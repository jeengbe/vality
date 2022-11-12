declare global {
  namespace vality {
    interface scalars {}
    interface compounds {}
    interface flags {}
  }
  interface vality extends vality.scalars, vality.compounds, vality.flags {}
}

export const vality = {} as vality;
// Alias
export const v = vality;
