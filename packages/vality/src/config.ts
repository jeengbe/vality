declare global {
  namespace vality {
    interface Config {
      bail: boolean;
      strict: boolean;
    }
  }
}

export const config: Partial<vality.Config> = {};
