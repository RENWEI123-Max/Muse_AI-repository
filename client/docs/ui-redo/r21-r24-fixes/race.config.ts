import config from '../../../tests/d7.config'
export default {...config,testDir:new URL('.',import.meta.url).pathname,testMatch:'race-*.spec.ts',workers:1}
