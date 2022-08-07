declare global {
  namespace vality {
    interface guards {}
    interface valits {}
  }
  interface valits extends vality.guards, vality.valits {}
}

export const vality = {} as valits;
// Alias
export const v = vality;
